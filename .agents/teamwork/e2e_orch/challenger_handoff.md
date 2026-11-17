# Adversarial Challenger Handoff — E2E Testing Track (`idle-button`)

## Verdict: CONFIRM

All 4 required adversarial probes (plus an additional concurrent-port & corrupt-save probe) **PASSED** against `tests/e2e/helpers/` (`harness.mjs`, `cdp.mjs`, `server.mjs`, `fixtures.mjs`) and `tests/e2e/baseline-smoke.e2e.test.mjs`, with no stray files created in `tests/e2e/`.

---

## Probe Results

### 1. Process / Temp-Dir Cleanup Probe — PASS
- **Direct lifecycle check**: Launched `startStaticServer(REPO_ROOT)`, `launchChromium()`, and `CdpClient.connect()`, verified `userDataDir` (`/tmp/idle-btn-cdp-*`) existed while open, then called `cdp.close()`, `browser.close()`, and `server.stop()`. Verified `userDataDir` was removed (`fs.existsSync(dir) === false`) and Chromium PID was dead (`process.kill(pid, 0)` threw).
- **Full suite check**: Snapshotted `/tmp/idle-btn-cdp-*` and `pgrep -af "idle-btn-cdp|http.server"` before and after running `node --test tests/e2e/baseline-smoke.e2e.test.mjs` (6/6 passed in 8.84s).
  - `DIRS_BEFORE: 2`, `DIRS_AFTER: 2`, `NEW_LEAKED_DIRS: []`
  - `PROCS_BEFORE_LINES: 2`, `PROCS_AFTER_LINES: 2` (background sibling processes; zero leaked processes or temp directories from the suite).

### 2. Error Capture Probe — PASS
- Booted `E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' })` and verified initial `getPageErrors()` and `getConsoleErrors()` were empty and `assertNoErrors()` passed.
- Injected `console.error('probe_err')` and `setTimeout(() => { throw new Error('probe_boom'); }, 10)` via `h.evaluate()`.
- Verified:
  - `getPageErrors()` captured `Error: probe_boom\n    at <anonymous>:3:30`.
  - `getConsoleErrors()` captured `{ type: 'error', text: 'probe_err', ... }`.
  - `assertNoErrors()` threw an `Error` listing both the console error and page error.

### 3. Seed & Reload Persistence Probe — PASS
- Seeded `E2EHarness.create` with `initialState: createV3Save({ money: 42, totalMoneyRun: 42, totalMoneyAllTime: 42, presses: 10, phase: 1, soundEnabled: true })`.
- Verified initial UI rendered `$42.00`.
- Mutated state via UI clicks (`#main-button` twice -> `$44.00`, `#btn-sound` -> `AUDIO: OFF`).
- Called `await h.reload()` and verified `#currency-value` remained `$44.00` and `#btn-sound` remained `AUDIO: OFF` (confirming `addOneShotSeedScript`'s `sessionStorage.__e2e_seeded` guard prevents `Page.addScriptToEvaluateOnNewDocument` from clobbering state on reload).

### 4. Reset Confirm Dialog Probe — PASS
- Seeded `money: 25, phase: 1` and tested `#btn-reset` with `h.setDialogResponse(false)` and `h.setDialogResponse(true)`:
  - Note: The v3 app (`index.html`) uses an in-DOM `#modal-reset` confirmation modal rather than `window.confirm`, so clicking `#btn-reset` opens `#modal-reset` (`#btn-reset-cancel` / `#btn-reset-confirm`) without triggering a native dialog.
  - Explicitly triggered `window.confirm('probe_confirm_false')` after `h.setDialogResponse(false)` and `window.confirm('probe_confirm_true')` after `h.setDialogResponse(true)` via `h.evaluate()`: neither hung, returning `false` and `true` respectively, and `h.dialogs` recorded both `confirm` events.
  - Confirmed `#btn-reset` -> `#btn-reset-confirm` reset `#currency-value` to `$0.00` with 0 errors.

### 5. Bonus Probe: Concurrent Instances & Corrupt Save — PASS
- Launched two `E2EHarness.create()` instances concurrently via `Promise.all`, with one seeded with invalid JSON (`'{corrupt_json_not_valid'`) under `idle_button_v3_save`.
- Verified distinct ephemeral ports (`36581` vs `42313`), graceful fallback to `$0.00` on corrupt save, and `assertNoErrors()` passing on both instances.
