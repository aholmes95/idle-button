import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROMIUM_BIN = process.env.CHROMIUM_BIN || '/usr/bin/chromium';

/**
 * Launches headless Chromium with an ephemeral profile directory and
 * an OS-assigned remote debugging port.
 */
export async function launchChromium({ headless = true, extraArgs = [] } = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idle-btn-cdp-'));
  const args = [
    ...(headless ? ['--headless'] : []),
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=0',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    `--user-data-dir=${userDataDir}`,
    ...extraArgs,
    'about:blank',
  ];

  const proc = spawn(CHROMIUM_BIN, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderrBuf = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      proc.kill('SIGKILL');
      reject(new Error(`Chromium timed out waiting for DevTools URL. stderr:\n${stderrBuf}`));
    }, 10000);

    function onStderr(chunk) {
      stderrBuf += chunk.toString();
      const match = stderrBuf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        cleanup();
        resolve(match[1]);
      }
    }

    function onExit(code, signal) {
      cleanup();
      reject(new Error(`Chromium exited prematurely (code=${code}, signal=${signal}). stderr:\n${stderrBuf}`));
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    function cleanup() {
      clearTimeout(timer);
      proc.stderr.off('data', onStderr);
      proc.off('exit', onExit);
      proc.off('error', onError);
    }

    proc.stderr.on('data', onStderr);
    proc.once('exit', onExit);
    proc.once('error', onError);
  });

  const parsedUrl = new URL(wsUrl);
  const host = parsedUrl.host;

  // Discover the initial page target via /json/list
  let pageWsUrl = null;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://${host}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pageTarget) {
          pageWsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {
      // retry briefly
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!pageWsUrl) {
    proc.kill('SIGKILL');
    fs.rmSync(userDataDir, { recursive: true, force: true });
    throw new Error(`Failed to discover Chromium page target at http://${host}/json/list`);
  }

  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;

    if (proc.exitCode === null && proc.signalCode === null) {
      await new Promise((resolve) => {
        const killTimer = setTimeout(() => {
          try {
            proc.kill('SIGKILL');
          } catch {
            // ignore
          }
        }, 500);

        proc.once('exit', () => {
          clearTimeout(killTimer);
          resolve();
        });

        try {
          proc.kill('SIGTERM');
        } catch {
          clearTimeout(killTimer);
          resolve();
        }
      });
    }

    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }

  return {
    wsUrl,
    pageWsUrl,
    host,
    userDataDir,
    process: proc,
    close,
  };
}

/**
 * Minimal zero-dependency Chrome DevTools Protocol client built on Node 24's
 * global WebSocket.
 */
export class CdpClient {
  #ws;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();
  #closed = false;

  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (typeof msg.id === 'number') {
        const entry = this.#pending.get(msg.id);
        if (entry) {
          this.#pending.delete(msg.id);
          if (msg.error) {
            entry.reject(new Error(`CDP error (${entry.method}): ${msg.error.message}`));
          } else {
            entry.resolve(msg.result || {});
          }
        }
      } else if (msg.method) {
        const handlers = this.#listeners.get(msg.method);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(msg.params || {});
            } catch {
              // keep event loop safe
            }
          }
        }
      }
    });

    ws.addEventListener('close', () => {
      this.#closed = true;
      for (const [, entry] of this.#pending) {
        entry.reject(new Error(`CDP WebSocket closed while waiting for ${entry.method}`));
      }
      this.#pending.clear();
    });
  }

  static async connect(pageWsUrl) {
    const ws = new WebSocket(pageWsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out connecting to CDP WebSocket: ${pageWsUrl}`));
      }, 5000);

      ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });

      ws.addEventListener('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`CDP WebSocket error: ${err?.message || 'connection failed'}`));
      }, { once: true });
    });

    const client = new CdpClient(ws);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    return client;
  }

  send(method, params = {}) {
    if (this.#closed || this.#ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(`Cannot send ${method}: CDP WebSocket is not open`));
    }
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, method });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(eventName, handler) {
    if (!this.#listeners.has(eventName)) {
      this.#listeners.set(eventName, new Set());
    }
    const set = this.#listeners.get(eventName);
    set.add(handler);
    return () => set.delete(handler);
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    if (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 500);
        this.#ws.addEventListener('close', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
        this.#ws.close();
      });
    }
  }
}
