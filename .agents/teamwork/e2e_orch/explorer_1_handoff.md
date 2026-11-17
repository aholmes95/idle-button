# Explorer 1 Handoff: Codebase DOM/State Audit & Zero-Dependency CDP Harness Design

## 1. Existing Codebase & Standalone Artifact Audit

Both the modular codebase (`/home/antigravity/aholmes95/idle-button/`) and the standalone artifact (`/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`) share the **exact same DOM IDs, CSS classes, tab/panel structure, `SAVE_KEY`, state schema, and game data**.

Key differences between modular (`index.html` + `js/*`) and standalone (`idle_button.html`):
- `index.html` loads Google Fonts (`fonts.googleapis.com`), `styles.css`, and `<script type="module" src="js/game.js"></script>` (requires HTTP server for ES modules; `file://` blocks ES module imports due to CORS).
- `idle_button.html` inlines all CSS and an IIFE `<script>` with no external network requests or ES module imports (can load via `file://` or `http://127.0.0.1:<port>/idle_button.html`; HTTP server is recommended so `localStorage` has a standard `http://127.0.0.1:<port>` origin).
- `js/game.js` (lines 854–857) registers a `window.beforeunload` save handler; `idle_button.html` relies on the 5-second periodic save and action-triggered saves.

---

### 1.1 Static DOM Selectors & Structure (`index.html`)

Visibility is controlled via `.is-hidden` (`display: none !important;` in `styles.css:61`), `.active` on tabs/panels (`styles.css:120, 122-123`), `.has-console` on `#workspace` (`styles.css:67`), and `body.is-sinister` (`styles.css:31`).

#### Top Bar & App Shell
- `#app-shell` (`.app-shell`, `index.html:14`)
- `#top-bar` (`.top-bar.is-hidden`, `index.html:16`) — visible when `state.phase >= 1`
  - `#status-led` (`.status-led`, `index.html:18`) — gets `.is-pulsing` for 120ms on press (`js/game.js:211-213`)
  - `#brand-name` (`.brand-name.mono`, `index.html:19`) — `"BUTTONCORP™"` or `"CONTAINMENT RIG 04"` when `sinisterRevealed`
  - `#phase-tag` (`.phase-tag.mono`, `index.html:20`) — `'INTERNSHIP' | 'OPERATOR' | 'MANAGEMENT' | 'R&D DIVISION' | 'EXECUTIVE'` or `'COMPLIANCE ACTIVE'`
  - `#pill-rp` (`.stat-pill.is-hidden`, `index.html:24`) — visible when `phase >= 3`; contains `#top-rp` (`0.0` format)
  - `#pill-shares` (`.stat-pill.is-hidden`, `index.html:25`) — visible when `shares > 0 || phase >= 4 || restructures > 0`; contains `#top-shares`
  - `#btn-sound` (`.icon-btn.mono`, `index.html:29`) — `"AUDIO: ON"` / `"AUDIO: OFF"`
  - `#btn-reset` (`.icon-btn.mono`, `index.html:30`) — **Triggers native `window.confirm('Reset all ButtonCorp™ progress and Shares?')`** (`js/game.js:828`, `idle_button.html:818`)

#### Workspace & Left Column (`#workspace`, `index.html:35`)
- `.left-column` (`index.html:37`)
  - `#currency-label` (`.currency-label.mono.is-hidden`, `index.html:39`) — `"CORPORATE FUNDS"` or `"COMPLIANCE YIELD"` (`phase >= 1`)
  - `#currency-value` (`.currency-value.mono`, `index.html:40`) — always visible; formatted `$0.00`, `$1.23M`, `$1.23B`
  - `#currency-rates` (`.currency-rates.mono.is-hidden`, `index.html:41`) — visible when `phase >= 1`
    - `#rate-money` (`index.html:42`) — `+$0.00 / sec`
    - `#rate-rp-sep` (`.rate-sep.is-hidden`, `index.html:43`) — visible when `phase >= 3`
    - `#rate-rp` (`.is-hidden`, `index.html:44`) — `+0.0 RP / sec` (`phase >= 3`)
  - `#button-housing` (`.button-housing`, `index.html:48`)
    - `#main-button` (`.main-button`, `index.html:52`) — `Space` key adds `.is-pressed` (`js/game.js:845`)
    - `#button-label` (`.button-label.mono`, `index.html:54`) — `"PRESS"` or `"ACTUATE"`
    - `#button-sub` (`.button-sub.mono.is-hidden`, `index.html:55`) — `+$1.00` (`phase >= 1`)
    - `#floating-layer` (`.floating-layer`, `index.html:58`) — spawns `<span class="float-delta">` on click (`js/game.js:201-208`)
  - `#abilities-bar` (`.abilities-bar.is-hidden`, `index.html:62`) — visible when any ability's `unlockResearch` is completed
    - `#abilities-grid` (`.abilities-grid`, `index.html:64`)
  - `#memo-box` (`.memo-box.is-hidden`, `index.html:68`) — visible when `phase >= 1`
    - `#memo-title` (`index.html:70`) — `"COMPANY MEMO"` or `"FACILITY FEED"`
    - `#memo-count` (`index.html:71`)
    - `#memo-feed` (`.memo-feed`, `role="log"`, `index.html:73`)

#### Right Column & Tab Structure (`#right-column`, `index.html:78`)
Visible when `state.phase >= 1`.
- Tab Bar (`nav.tab-bar[role="tablist"]`, `index.html:79-92`):
  - `#tab-btn-operations` (`.tab-btn.mono.active`, `data-tab="operations"`) — visible at `phase >= 1`
  - `#tab-btn-upgrades` (`.tab-btn.mono.is-hidden`, `data-tab="upgrades"`) — visible at `phase >= 2`
    - `#badge-upgrades` (`.tab-badge.is-hidden`) — count of affordable upgrades/managers
  - `#tab-btn-research` (`.tab-btn.mono.is-hidden`, `data-tab="research"`) — visible at `phase >= 3`
    - `#badge-research` (`.tab-badge.is-hidden`) — `"!"` when a research project can be started
  - `#tab-btn-prestige` (`.tab-btn.mono.is-hidden`, `data-tab="prestige"`) — visible at `phase >= 4 || restructures > 0`
- Tab Panels (`.tab-panel` / `.tab-panel.active`):
  1. `#panel-operations` (`index.html:95`):
     - `#buy-mode-group` (`index.html:98`): `.mode-btn[data-mode="1"]`, `.mode-btn[data-mode="10"]`, `.mode-btn[data-mode="max"]`
     - `#generators-list` (`index.html:104`)
  2. `#panel-upgrades` (`index.html:108`):
     - `#upgrades-summary` (`index.html:111`) — `"X / Y OWNED"`
     - `#managers-list` (`index.html:115`)
     - `#upgrades-list` (`index.html:117`)
  3. `#panel-research` (`index.html:122`):
     - `#research-rp-display` (`index.html:125`) — `"0.0 RP"`
     - `#active-research-box` (`index.html:127`) — dynamically populated with `#active-res-timer` and `#active-res-bar` when researching (`js/game.js:545-551`)
     - `#research-list` (`index.html:130`)
  4. `#panel-prestige` (`index.html:134`):
     - `#prestige-card` (`index.html:135`) — dynamically populated with `#btn-do-prestige` (`js/game.js:621`)

---

### 1.2 Dynamically Rendered Selectors (`js/game.js` & `js/data.js`)

| Component | Container | Card / Item Selector | Action / Sub-element Selectors |
|---|---|---|---|
| **Generators** (`js/game.js:441-474`) | `#generators-list` | `.gen-card[data-gen-id="<id>"]` (`intern`, `bird`, `solenoid`, `pod`, `sublevel`, `conduit`) | `.gen-name`, `.gen-owned`, `.gen-manager-tag`, `[data-role="yield"]`, `[data-role="bar"]`, `.gen-milestone-label`, `[data-role="run"]`, `[data-role="buy"]` (gets `.can-afford`) |
| **Managers** (`js/game.js:491-508`) | `#managers-list` | `.upgrade-card` (`.is-owned` when hired) | `button.btn-buy[data-upg-id="<id>"][data-upg-cost="<cost>"]` (`mgr_intern`, `mgr_bird`, `mgr_solenoid`, `mgr_pod`, `mgr_sublevel`, `mgr_conduit`) |
| **Upgrades** (`js/game.js:517-535`) | `#upgrades-list` | `.upgrade-card` (`.is-owned` when bought) | `button.btn-buy[data-upg-id="<id>"][data-upg-cost="<cost>"]` (`upg_keycap`, `upg_espresso`, `upg_intern_manual`, `upg_bird_oil`, `upg_synergy`, `upg_solenoid_amp`, `upg_compliance`, `upg_tether`) |
| **Research** (`js/game.js:562-583`) | `#research-list` | `.research-item` (`.is-done` when completed) | `button.btn-research[data-res-id="<id>"][data-res-cost="<rpCost>"]` (`res_ergonomics`, `res_workflow`, `res_acoustics`, `res_compliance`, `res_vessel`); active box has `#active-res-timer`, `#active-res-bar` |
| **Abilities** (`js/game.js:590-601`) | `#abilities-grid` | `button.ability-btn[data-ab-id="<id>"]` (`ab_rush`, `ab_surge`, `ab_syphon`) | `.ability-name`, `[data-role="status"]` (`READY`, `ACTIVE Xs`, `CD Xs`); `.is-active` on button |
| **Prestige** (`js/game.js:609-626`) | `#prestige-card` | `.prestige-title`, `.prestige-desc`, `.prestige-stats` | `#btn-do-prestige` (`.btn-prestige`) |
| **Memos** (`js/game.js:632-637`) | `#memo-feed` | `.memo-entry.is-<type>` (`fun`, `system`, `eerie`, `sinister`) | `.memo-time`, `.memo-text` |

---

### 1.3 `localStorage` Key & Schema (`js/state.js:1-38`)

- **Key**: `'idle_button_v2_save'`
- **JSON Schema**:
```json
{
  "money": 0,
  "totalMoneyRun": 0,
  "totalMoneyAllTime": 0,
  "rp": 0,
  "presses": 0,
  "phase": 0,
  "sinisterRevealed": false,
  "soundEnabled": true,
  "buyMode": "1",
  "activeTab": "operations",
  "shares": 0,
  "restructures": 0,
  "generators": {
    "intern": { "owned": 0, "progress": 0, "running": false }
  },
  "upgrades": [],
  "completedResearch": [],
  "activeResearch": null,
  "abilities": {
    "ab_rush": { "activeRemaining": 0, "cooldownRemaining": 0 }
  },
  "triggeredBeats": [],
  "memos": [
    { "time": "12:00:00", "text": "...", "type": "fun" }
  ],
  "lastTick": 1700000000000
}
```
- **Phase thresholds** (`js/game.js:219-225`):
  - `phase 0` → `1`: `presses >= 5`
  - `phase 1` → `2`: `totalMoneyRun >= 25`
  - `phase 2` → `3`: `totalMoneyRun >= 200`
  - `phase 3` → `4` (+ `sinisterRevealed = true`): `completedResearch.includes('res_compliance')`
- **Prestige formula** (`js/game.js:346-349`): `totalMoneyRun >= 10000 ? Math.floor(Math.sqrt(totalMoneyRun / 10000)) : 0`.

---

## 2. Environment & CDP Verification Results

Verified in `/home/antigravity/aholmes95/idle-button`:
- **Node.js**: `v24.22.2` (global `WebSocket` and `fetch` available natively, zero external packages required)
- **Chromium**: `/usr/bin/chromium`
- **Python**: `/usr/bin/python3`

### Verified Commands & Outputs
1. **Chromium headless + ephemeral CDP port (`--remote-debugging-port=0`) + Node 24 `WebSocket` + `fetch`**:
   - Spawned `/usr/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=0 --user-data-dir=<tmpDir> about:blank`
   - Parsed `DevTools listening on ws://127.0.0.1:44919/devtools/browser/...` from `stderr`
   - Fetched `http://127.0.0.1:44919/json/list`, connected `new WebSocket(pageTarget.webSocketDebuggerUrl)`, enabled `Runtime.enable`, evaluated `1 + 2` -> `3`. Exited cleanly (`OK`).
2. **Python ephemeral HTTP server (`python3 -u -m http.server 0 --bind 127.0.0.1`)**:
   - Note: `-u` (unbuffered stdout) is essential so `Serving HTTP on 127.0.0.1 port <N>` flushes immediately when piped.
   - Verified `fetch('http://127.0.0.1:33083/index.html')` returned HTTP `200`.

---

## 3. Zero-Dependency CDP Helper API Design

Suggested module layout under `tests/e2e/lib/`:

### 3.1 `tests/e2e/lib/server.mjs`
Manages ephemeral `python3 -u -m http.server 0 --bind 127.0.0.1` processes.
```js
export async function startStaticServer(rootDir) {
  // Spawns: python3 -u -m http.server 0 --bind 127.0.0.1 (cwd: rootDir)
  // Parses /port (\d+)/ from stdout (with 5s timeout)
  // Returns { port, origin: `http://127.0.0.1:${port}`, url(relPath), stop() }
}
```
- `stop()` sends `SIGKILL` (or `SIGTERM` then `SIGKILL` after 500ms) and awaits process exit so no orphan servers remain.
- Works both for `/home/antigravity/aholmes95/idle-button` (serving `index.html`) and for the standalone artifact directory (serving `idle_button.html`).

### 3.2 `tests/e2e/lib/cdp.mjs`
Low-level Chromium launcher and CDP WebSocket client using Node 24 built-in `WebSocket` and `fetch`.
```js
export async function launchChromium({ headless = true, extraArgs = [] } = {}) {
  // Creates temp dir via fs.mkdtempSync(path.join(os.tmpdir(), 'idle-btn-cdp-'))
  // Spawns /usr/bin/chromium with:
  //   --headless, --no-sandbox, --disable-gpu, --remote-debugging-port=0,
  //   --disable-dev-shm-usage, --no-first-run, --no-default-browser-check,
  //   `--user-data-dir=${userDataDir}`, 'about:blank'
  // Parses DevTools wsUrl from stderr
  // Fetches http://${host}/json/list to find the page target
  // Returns { wsUrl, pageWsUrl, host, close() }
  // close() closes WebSocket, kills Chromium, and rmSync(userDataDir, { recursive: true, force: true })
}

export class CdpClient {
  static async connect(pageWsUrl) { ... }
  async send(method, params = {}) { ... } // Correlates by numeric id, rejects on msg.error
  on(eventName, handler) { ... }         // Subscribes to CDP events (returns unsubscribe fn)
  async close() { ... }
}
```
Key CDP domains to enable on connect:
- `Page.enable`
- `Runtime.enable`
- `DOM.enable` (optional, if needed; `Runtime.evaluate` handles most DOM queries cleanly)

### 3.3 `tests/e2e/lib/harness.mjs`
High-level E2E page/game driver wrapping `CdpClient` + `server.mjs`:
```js
export class E2EHarness {
  // Lifecycle
  static async create({ rootDir, pagePath = '/index.html', initialState = null } = {})
  // - Starts static server for rootDir
  // - Launches Chromium + connects CdpClient
  // - Subscribes to Runtime.consoleAPICalled -> consoleLogs[]
  // - Subscribes to Runtime.exceptionThrown -> pageErrors[]
  // - Subscribes to Page.javascriptDialogOpening -> records dialogs[] & auto-handles (configurable accept/dismiss, default accept for confirm)
  // - If initialState provided: navigates to origin + '/favicon.ico' or blank page at same origin, or uses Page.addScriptToEvaluateOnNewDocument to seed localStorage['idle_button_v2_save'] before game.js boots!
  // - Navigates to server.url(pagePath) and waits for Page.loadEventFired + document.readyState === 'complete'
  async close() // Closes CdpClient, Chromium, and static server (always in finally)

  // Navigation & Storage
  async goto(urlOrPath)
  async reload()
  async seedStorage(stateObj, key = 'idle_button_v2_save')
  async readStorage(key = 'idle_button_v2_save')
  async clearStorage(key = 'idle_button_v2_save')

  // Evaluation & Waiting
  async evaluate(fnOrExpr, ...args) // Uses Runtime.evaluate (returnByValue: true, awaitPromise: true)
  async waitForSelector(selector, { visible = true, timeoutMs = 5000 } = {})
  async waitForCondition(fnOrExpr, { timeoutMs = 5000, intervalMs = 50 } = {})

  // Interaction
  async click(selector)
  // - Waits for selector to be visible & enabled
  // - Scrolls into view & gets boundingClientRect center (x, y)
  // - Dispatches Input.dispatchMouseEvent (mouseMoved -> mousePressed -> mouseReleased, button: 'left', clickCount: 1)
  async type(selector, text)
  // - Clicks/focuses selector, then Input.insertText or keyDown/keyUp per char
  async pressKey(key, code) // Input.dispatchKeyEvent (e.g. Space for main-button)

  // Diagnostics
  getConsoleErrors() // Filters consoleLogs where type === 'error'
  getPageErrors()    // Returns pageErrors[] from Runtime.exceptionThrown
  assertNoErrors()   // Throws if consoleErrors.length > 0 || pageErrors.length > 0
}
```

### Important Implementation Notes for Builders
1. **Seeding `localStorage` cleanly**: `Page.addScriptToEvaluateOnNewDocument` runs *before* `<script type="module" src="js/game.js">` executes `loadState()`, which avoids needing a double-load! Make sure to remove or guard the init script (e.g. `if (!sessionStorage.getItem('__seeded')) { localStorage.setItem(...); sessionStorage.setItem('__seeded', '1'); }`) so subsequent `reload()` tests actually test persisted state rather than overwriting it on every reload.
2. **`window.confirm` on `#btn-reset`**: Listen for `Page.javascriptDialogOpening` and call `Page.handleJavaScriptDialog({ accept: nextConfirmAccept })` so clicking `#btn-reset` never hangs the browser waiting for user input.
3. **Clicking via `Input.dispatchMouseEvent`**: Prefer real mouse events at `getBoundingClientRect()` center over `el.click()` so CSS `:hover`/`:active`, disabled checks, and pointer hit-testing are genuinely exercised.
4. **Standalone `idle_button.html` loading**: Copy or serve from `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2` with `startStaticServer(...)` and `pagePath: '/idle_button.html'`. This gives it a real `http://127.0.0.1:<port>` origin so `localStorage` behaves identically to `index.html`.
