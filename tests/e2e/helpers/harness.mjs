import { startStaticServer } from './server.mjs';
import { launchChromium, CdpClient } from './cdp.mjs';

const KEY_CODES = {
  Space: 32,
  ' ': 32,
  Enter: 13,
  Escape: 27,
  Tab: 9,
  Backspace: 8,
  ArrowUp: 38,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
};

export class E2EHarness {
  #server;
  #browser;
  #cdp;
  #consoleLogs = [];
  #pageErrors = [];
  #dialogs = [];
  #nextDialogAccept = true;
  #closed = false;
  #unsubscribers = [];

  constructor({ server, browser, cdp }) {
    this.#server = server;
    this.#browser = browser;
    this.#cdp = cdp;
    this.#attachListeners();
  }

  get server() {
    return this.#server;
  }

  get origin() {
    return this.#server.origin;
  }

  get dialogs() {
    return [...this.#dialogs];
  }

  get consoleLogs() {
    return [...this.#consoleLogs];
  }

  static async create({
    rootDir,
    pagePath = '/index.html',
    initialState = null,
    storageKey = 'idle_button_v3_save',
    initialStorage = null,
    viewport = { width: 1280, height: 800 },
  } = {}) {
    if (!rootDir) {
      throw new Error('E2EHarness.create requires rootDir');
    }

    const server = await startStaticServer(rootDir);
    let browser = null;
    let cdp = null;

    try {
      browser = await launchChromium();
      cdp = await CdpClient.connect(browser.pageWsUrl);
      const harness = new E2EHarness({ server, browser, cdp });

      if (viewport) {
        await harness.setViewport(viewport.width, viewport.height);
      }

      const seedMap = {};
      if (initialState !== null && initialState !== undefined) {
        seedMap[storageKey] = typeof initialState === 'string'
          ? initialState
          : JSON.stringify(initialState);
      }
      if (initialStorage && typeof initialStorage === 'object') {
        for (const [k, v] of Object.entries(initialStorage)) {
          seedMap[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
      }

      if (Object.keys(seedMap).length > 0) {
        await harness.addOneShotSeedScript(seedMap);
      }

      if (pagePath) {
        await harness.goto(pagePath);
      }

      return harness;
    } catch (err) {
      if (cdp) await cdp.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
      await server.stop().catch(() => {});
      throw err;
    }
  }

  #attachListeners() {
    this.#unsubscribers.push(
      this.#cdp.on('Runtime.consoleAPICalled', (params) => {
        const text = (params.args || [])
          .map((arg) => {
            if (arg.value !== undefined) return String(arg.value);
            if (arg.description) return arg.description;
            return arg.type || '';
          })
          .join(' ');
        this.#consoleLogs.push({
          type: params.type,
          text,
          timestamp: params.timestamp,
        });
      })
    );

    this.#unsubscribers.push(
      this.#cdp.on('Runtime.exceptionThrown', (params) => {
        const details = params.exceptionDetails || {};
        const desc =
          details.exception?.description ||
          details.exception?.value ||
          details.text ||
          'Uncaught exception';
        this.#pageErrors.push({
          text: String(desc),
          lineNumber: details.lineNumber,
          columnNumber: details.columnNumber,
          url: details.url,
        });
      })
    );

    this.#unsubscribers.push(
      this.#cdp.on('Page.javascriptDialogOpening', (params) => {
        this.#dialogs.push({
          type: params.type,
          message: params.message,
          defaultPrompt: params.defaultPrompt,
        });
        this.#cdp
          .send('Page.handleJavaScriptDialog', { accept: this.#nextDialogAccept })
          .catch(() => {});
      })
    );
  }

  /**
   * Registers a Page.addScriptToEvaluateOnNewDocument script guarded by
   * sessionStorage so it seeds localStorage once before game scripts boot,
   * without overwriting state on subsequent reload() calls.
   */
  async addOneShotSeedScript(seedMap) {
    const scriptSource = `
      (function() {
        try {
          if (!sessionStorage.getItem('__e2e_seeded')) {
            sessionStorage.setItem('__e2e_seeded', '1');
            var data = ${JSON.stringify(seedMap)};
            for (var key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                localStorage.setItem(key, data[key]);
              }
            }
          }
        } catch (e) {}
      })();
    `;
    await this.#cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: scriptSource,
    });
  }

  async goto(urlOrPath) {
    const targetUrl = /^https?:\/\//i.test(urlOrPath)
      ? urlOrPath
      : this.#server.url(urlOrPath);

    await this.#waitForLoad(() => this.#cdp.send('Page.navigate', { url: targetUrl }));
  }

  async reload({ ignoreCache = true } = {}) {
    await this.#waitForLoad(() => this.#cdp.send('Page.reload', { ignoreCache }));
  }

  async #waitForLoad(actionFn, timeoutMs = 10000) {
    let loaded = false;
    const unsub = this.#cdp.on('Page.loadEventFired', () => {
      loaded = true;
    });

    try {
      await actionFn();
      const deadline = Date.now() + timeoutMs;
      while (!loaded && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }
      if (!loaded) {
        throw new Error('Timed out waiting for Page.loadEventFired');
      }
      await this.waitForCondition(() => document.readyState === 'complete', {
        timeoutMs: 5000,
      });
    } finally {
      unsub();
    }
  }

  async seedStorage(stateObj, key = 'idle_button_v3_save') {
    const serialized = typeof stateObj === 'string' ? stateObj : JSON.stringify(stateObj);
    await this.evaluate(
      (k, v) => {
        localStorage.setItem(k, v);
      },
      key,
      serialized
    );
  }

  async readStorage(key = 'idle_button_v3_save') {
    const raw = await this.evaluate((k) => localStorage.getItem(k), key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async clearStorage(key = null) {
    await this.evaluate((k) => {
      if (k) {
        localStorage.removeItem(k);
      } else {
        localStorage.clear();
      }
    }, key);
  }

  async evaluate(fnOrExpr, ...args) {
    const expression =
      typeof fnOrExpr === 'function'
        ? `(${fnOrExpr.toString()})(...${JSON.stringify(args)})`
        : String(fnOrExpr);

    const res = await this.#cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });

    if (res.exceptionDetails) {
      const desc =
        res.exceptionDetails.exception?.description ||
        res.exceptionDetails.exception?.value ||
        res.exceptionDetails.text ||
        'Evaluation error';
      throw new Error(`Page evaluate failed: ${desc}`);
    }

    return res.result ? res.result.value : undefined;
  }

  async waitForSelector(selector, { visible = true, timeoutMs = 5000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = await this.evaluate(
        (sel, mustBeVisible) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          if (!mustBeVisible) return true;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        },
        selector,
        visible
      );
      if (found) return true;
      await new Promise((r) => setTimeout(r, 40));
    }
    throw new Error(`Timed out waiting for selector "${selector}" (visible=${visible})`);
  }

  async waitForCondition(fnOrExpr, { timeoutMs = 5000, intervalMs = 40 } = {}) {
    const deadline = Date.now() + timeoutMs;
    let lastErr = null;
    while (Date.now() < deadline) {
      try {
        const result = await this.evaluate(fnOrExpr);
        if (result) return result;
      } catch (err) {
        lastErr = err;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    const suffix = lastErr ? ` (last error: ${lastErr.message})` : '';
    throw new Error(`Timed out waiting for condition after ${timeoutMs}ms${suffix}`);
  }

  async click(selector) {
    await this.waitForSelector(selector, { visible: true, timeoutMs: 5000 });
    const box = await this.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { error: 'Element not found' };
      if (el.disabled) return { error: 'Element is disabled' };
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }, selector);

    if (box.error) {
      throw new Error(`Cannot click "${selector}": ${box.error}`);
    }

    await this.#cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: box.x,
      y: box.y,
    });
    await this.#cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1,
    });
    await this.#cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1,
    });
  }

  async type(selector, text, { clear = true } = {}) {
    await this.click(selector);
    if (clear) {
      await this.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el && 'value' in el) {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, selector);
    }
    await this.#cdp.send('Input.insertText', { text: String(text) });
  }

  async pressKey(key, code = key, { selector = null } = {}) {
    if (selector) {
      await this.waitForSelector(selector, { visible: true });
      await this.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el && typeof el.focus === 'function') el.focus();
      }, selector);
    }
    const keyCode = KEY_CODES[key] ?? KEY_CODES[code] ?? 0;
    await this.#cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await this.#cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  setDialogResponse(accept = true) {
    this.#nextDialogAccept = Boolean(accept);
  }

  async setViewport(width, height, { deviceScaleFactor = 1, mobile = false } = {}) {
    await this.#cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile,
    });
  }

  async text(selector) {
    return this.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : null;
    }, selector);
  }

  async isVisible(selector) {
    return this.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, selector);
  }

  async hasClass(selector, className) {
    return this.evaluate(
      (sel, cls) => {
        const el = document.querySelector(sel);
        return el ? el.classList.contains(cls) : false;
      },
      selector,
      className
    );
  }

  getConsoleErrors() {
    return this.#consoleLogs.filter((entry) => entry.type === 'error');
  }

  getPageErrors() {
    return [...this.#pageErrors];
  }

  assertNoErrors() {
    const consoleErrors = this.getConsoleErrors();
    const pageErrors = this.getPageErrors();
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      const parts = [];
      if (consoleErrors.length > 0) {
        parts.push(`Console errors:\n${consoleErrors.map((e) => `  - ${e.text}`).join('\n')}`);
      }
      if (pageErrors.length > 0) {
        parts.push(`Page errors:\n${pageErrors.map((e) => `  - ${e.text}`).join('\n')}`);
      }
      throw new Error(parts.join('\n'));
    }
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    for (const unsub of this.#unsubscribers) {
      try {
        unsub();
      } catch {
        // ignore
      }
    }
    this.#unsubscribers = [];
    await this.#cdp.close().catch(() => {});
    await this.#browser.close().catch(() => {});
    await this.#server.stop().catch(() => {});
  }
}
