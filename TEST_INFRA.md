# ButtonCorp™ (`idle-button`) — E2E Testing Infrastructure (`TEST_INFRA.md`)

## 1. Environment & Tooling
- **Runtime**: Node.js `v24.22.2` (native `node:test`, `node:assert/strict`, global `WebSocket`, global `fetch` — zero `npm` dependencies).
- **Static Server**: `python3 -u -m http.server 0 --bind 127.0.0.1` (Python `3.11.2`, ephemeral OS-assigned port `0`, unbuffered `-u` stdout).
- **Browser**: `/usr/bin/chromium` (`Chromium 156.0.8078.79`, launched with `--headless --no-sandbox --disable-gpu --remote-debugging-port=0 --disable-dev-shm-usage --no-first-run --no-default-browser-check --mute-audio` and an ephemeral `--user-data-dir`).

---

## 2. Zero-Dependency CDP Harness Architecture (`tests/e2e/helpers/`)

```text
tests/e2e/helpers/
├── server.mjs     # Ephemeral Python static HTTP server (port 0, clean SIGTERM/SIGKILL stop)
├── cdp.mjs        # Headless Chromium launcher + raw WebSocket CdpClient
├── harness.mjs    # High-level E2EHarness page/game driver
└── fixtures.mjs   # Opaque-box localStorage JSON seed builders & path constants
```

### `server.mjs`
- `startStaticServer(rootDir)` spawns `python3 -u -m http.server 0 --bind 127.0.0.1` with `cwd: rootDir`, parses the assigned port from stdout, and returns `{ port, origin, url(relPath), stop() }`.
- `stop()` terminates the process cleanly (`SIGTERM` with `SIGKILL` fallback) so no orphan HTTP servers remain.

### `cdp.mjs`
- `launchChromium({ headless, extraArgs })` creates an ephemeral `os.tmpdir()` profile directory, launches `/usr/bin/chromium`, parses the `DevTools listening on ws://...` URL, discovers the page target via `/json/list`, and returns `{ wsUrl, pageWsUrl, host, close() }`.
- `CdpClient.connect(pageWsUrl)` connects using Node 24's native `WebSocket`, enables `Page` and `Runtime`, correlates request/response IDs, and dispatches CDP events (`on(eventName, handler)`).

### `harness.mjs`
- `E2EHarness.create({ rootDir, pagePath, initialState, storageKey, initialStorage, viewport })` orchestrates server + Chromium + `CdpClient`.
- **One-shot seeding**: Uses `Page.addScriptToEvaluateOnNewDocument` guarded by `sessionStorage.getItem('__e2e_seeded')` so `localStorage` is populated *before* `game.js` boots, without overwriting state on subsequent `reload()` calls.
- **Real user input**:
  - `click(selector)` scrolls into view, verifies enabled/visible, and dispatches `Input.dispatchMouseEvent` (`mouseMoved` -> `mousePressed` -> `mouseReleased`).
  - `type(selector, text)` focuses and dispatches `Input.insertText`.
  - `pressKey(key, code)` dispatches `Input.dispatchKeyEvent`.
- **Dialogs & Viewport**: Handles `Page.javascriptDialogOpening` via `Page.handleJavaScriptDialog` (`setDialogResponse(accept)`) and supports `setViewport(width, height)`.
- **Diagnostics**: Captures `Runtime.consoleAPICalled` and `Runtime.exceptionThrown`; exposes `getConsoleErrors()`, `getPageErrors()`, and `assertNoErrors()`.

### `fixtures.mjs`
- Pure JSON seed builders (`createV2Save`, `createV3Save`, `createMidRunSave`, `createPostRestructureSave`, `createOfflineSave`) and path constants (`REPO_ROOT`, `STANDALONE_DIR`, `STANDALONE_PAGE`, `V2_SAVE_KEY`, `V3_SAVE_KEY`).

---

## 3. Opaque-Box Testing Contract
1. **No internal module imports**: E2E tests **never** import `js/**` modules (`js/economy.js`, `js/modifiers.js`, `js/state.js`, etc.).
2. **Public boundary only**: All interactions occur through real DOM clicks, keyboard events, modals, and `localStorage` (`idle_button_v3_save` / `idle_button_v2_save`).
3. **Zero-error invariant**: Every test asserts `h.assertNoErrors()` (zero `console.error` and zero uncaught `pageerror` exceptions).

---

## 4. Standalone Artifact Parity Target
- **Target**: `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`
- Served over `http://127.0.0.1:<port>/idle_button.html` via `startStaticServer(STANDALONE_DIR)` so `localStorage` behaves identically to `index.html`.
- Covered in `tests/e2e/baseline-smoke.e2e.test.mjs` and `tests/e2e/tier1/11-standalone-parity.e2e.test.mjs`.

---

## 5. How to Run Commands

```bash
# 1. Baseline Smoke (current v0.2 + standalone idle_button.html)
node --test tests/e2e/baseline-smoke.e2e.test.mjs

# 2. Syntax check all E2E test & helper files
find tests/e2e -name '*.mjs' -print0 | xargs -0 -n1 node --check

# 3. Per-Tier E2E Suites
node --test tests/e2e/tier1/*.e2e.test.mjs
node --test tests/e2e/tier2/*.e2e.test.mjs
node --test tests/e2e/tier3/*.e2e.test.mjs
node --test tests/e2e/tier4/*.e2e.test.mjs

# 4. Full E2E Suite
node --test tests/e2e/baseline-smoke.e2e.test.mjs tests/e2e/tier1/*.e2e.test.mjs tests/e2e/tier2/*.e2e.test.mjs tests/e2e/tier3/*.e2e.test.mjs tests/e2e/tier4/*.e2e.test.mjs
```

---

## 6. 4-Tier Coverage Matrix Mapped to `PROJECT.md § Feature Inventory`

| Feature # | `PROJECT.md` Feature | Milestone | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|---|---|
| 1 | Modular JS Architecture | M1 | `baseline-smoke`, `tier1/01..10` | `tier2/01..05` | `tier3/01..04` | `tier4/01, 02` |
| 2 | UI & Visual Overhaul | M1 | `tier1/01, 03, 10` | `tier2/05` | `tier3/03` | `tier4/01` |
| 3 | Facility Floor/Portal Switcher | M1 | `tier1/05, 07, 08, 09` | `tier2/03, 04, 05` | `tier3/01, 02` | `tier4/02` |
| 4 | Save v3, Migration, Export/Import & Modals | M1 | `tier1/10` | `tier2/02, 05` | — | `tier4/02` |
| 5 | Extended Number Formatting | M1, M2 | `tier1/02` | `tier2/01` | — | — |
| 6 | Standalone Artifact Sync (`idle_button.html`) | M1 | `baseline-smoke`, `tier1/11` | — | — | — |
| 7 | Multi-Prestige Shares & Pacing | M2 | `tier1/05` | `tier2/01, 03` | `tier3/01` | `tier4/01, 02` |
| 8 | Boardroom Skill Tree (12 Perks) | M2 | `tier1/05` | `tier2/03` | `tier3/01` | `tier4/02` |
| 9 | Expanded Generators (T7–10) & Milestones | M2 | `tier1/02` | `tier2/01` | `tier3/04` | `tier4/01` |
| 10 | Expanded Upgrades (24+) & Synergies | M2 | `tier1/01, 03` | `tier2/01` | `tier3/04` | `tier4/01` |
| 11 | Expanded R&D (12 Projects) & 4th Protocol | M2 | `tier1/04` | `tier2/03` | `tier3/03, 04` | `tier4/01` |
| 12 | Achievements System (20+) | M2 | `tier1/06` | — | `tier3/01` | `tier4/02` |
| 13 | Golden Memo / Containment Anomalies | M2 | `tier1/06` | — | `tier3/03` | — |
| 14 | Expanded Cosmic-Horror Narrative | M2 | `tier1/01, 06` | — | `tier3/03` | `tier4/01` |
| 15 | Floor B2: Security Perimeter (TD) | M3 | `tier1/07` | `tier2/01, 04` | `tier3/02` | `tier4/02` |
| 16 | Floor B4: Field Ops (RPG) | M4 | `tier1/08` | `tier2/01, 04` | `tier3/02` | `tier4/02` |
| 17 | Floor B6: Synthesis Forge (Merge) | M5 | `tier1/09` | `tier2/01, 04` | `tier3/02` | `tier4/02` |
| 18 | Full E2E Suite Pass & Tier 5 Hardening | M6 | All Tier 1 | All Tier 2 | All Tier 3 | All Tier 4 |
