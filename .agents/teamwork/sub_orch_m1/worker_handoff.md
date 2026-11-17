# M1 Implementation Worker Handoff — ButtonCorp™ (`idle-button`)

## Summary of Changes

### 1. JS Modularization
- **Created `js/format.js`**: Pure formatting utilities (`fmtNumber`, `fmtMoney`, `fmtDuration`, `fmtTime`) supporting `K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc` suffixes up to `1e33` and scientific notation fallback at `>= 1e36`.
- **Updated `js/data.js`**: Preserved v0.2 balance data for M1 and added `FLOORS` metadata (`desk`, `td`, `rpg`, `merge`) for the Facility Elevator / Portal Bar.
- **Updated `js/state.js`**: Upgraded save schema to `version: 3` (`SAVE_KEY = 'idle_button_v3_save'`), implemented automatic migration from `idle_button_v2_save`, Node-safe storage handling, `createInitialState(preserved)` with all M1/v3 fields (`activeFloor`, `unlockedFloors`, `lifetimeShares`, `boardroomPerks`, `achievements`, `anomaliesCaught`, `td`, `rpg`, `merge`), `exportSave`, `importSave` (JSON/base64 + validation), and `resetAllState`.
- **Created `js/modifiers.js`**: Implemented `getCrossFloorBonuses(state)` returning all 12 cross-floor multiplier keys (`moneyMult`, `rpMult`, `clickMult`, `speedMult`, `tdDamageMult`, `tdFireRateMult`, `tdScrapMult`, `rpgAtkMult`, `rpgDefMult`, `rpgHpMult`, `mergeSpeedMult`, `sharePotencyMult`) defaulting to `1` in M1.
- **Created `js/economy.js`**: Extracted pure calculation functions (`hasUpgrade`, `hasResearch`, `isAbilityActive`, `getShareMultiplier`, `getGlobalMultiplier`, `getSpeedMultiplier`, `getGenMilestoneMult`, `getGenPayout`, `getGenCycleTime`, `getPassiveMoneyRate`, `getPassiveRpRate`, `getClickValue`, `getBulkCost`, `getMaxAffordable`, `getBuyInfo`, `getPendingShares`, `MAX_OFFLINE_SECONDS`, `calculateOfflineEarnings`).
- **Created `js/ui.js`**: Extracted DOM caching, modal helpers (`openModal`, `closeModal`, `closeAllModals`, `showOfflineModal`, `showExportImportModal`), tab/floor switching (`switchTab`, `switchFloor`, `renderFloorSwitcher`), panel rendering with tier/category badges and collapsible Owned/Completed drawers, per-frame `updateDynamicUI`, SVG button charge ring feedback (`pulseButtonRing`, `decayButtonRing`), floating numbers, and LED pulse.
- **Refactored `js/game.js`**: Lean orchestrator handling boot, offline catch-up (>60s away), `requestAnimationFrame` tick loop, action handlers, event binding (including Escape/Spacebar modal-safe handling), auto-save, and `beforeunload` save.

### 2. UI & Visual Overhaul
- **`index.html`**: Added `SAVE` button in `#top-bar`, Facility Elevator / Portal Bar (`#elevator-bar`), SVG charge ring (`#button-ring-fill`) inside `#button-housing`, collapsible `<details class="owned-drawer">` drawers in Upgrades (`#upgrades-owned-drawer`) and R&D (`#research-completed-drawer`), floor mount containers (`#floor-td`, `#floor-rpg`, `#floor-merge`) with `RETURN TO 1F: DESK`, and in-app modals (`#modal-reset`, `#modal-save`, `#modal-offline`).
- **`styles.css`**: Expanded `.app-shell` to `1400px`, made `.left-column` sticky (`position: sticky; top: 18px;`) when console is active on desktop while preserving `@media (max-width: 860px)` responsiveness, polished `.currency-card`, `.button-charge-ring`, `.card-badge`, `.owned-drawer`, `.elevator-bar`, `.modal-*`, and `body.is-sinister` crimson theme styles.

### 3. Standalone Artifact Sync
- **Created `scripts/build-standalone.mjs`**: Zero-dependency Node ESM script that bundles `index.html`, `styles.css`, and `js/**/*.js` in topological order using a string/comment-safe state machine (`stripModuleSyntax`) into `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`.

### 4. Unit & Smoke Tests
- **Created `tests/core_m1.test.js`**: 12 unit tests covering `format.js`, `state.js` (v3 defaults, meta preservation, v2->v3 migration, export/import), `modifiers.js`, and `economy.js` (including offline earnings and 24h cap).

---

## Verification Commands & Exact Outputs

### a) Unit Tests
Command:
```bash
node --test tests/core_m1.test.js
```
Output:
```text
▶ format.js
  ✔ formats money across small, suffix, negative, and scientific ranges (17.386626ms)
  ✔ formats numbers and handles non-finite inputs safely (0.337214ms)
  ✔ formats durations cleanly (0.209124ms)
✔ format.js (18.933236ms)
▶ state.js
  ✔ creates initial v3 state with all required fields (1.090271ms)
  ✔ preserves meta-progression across restructures (0.202267ms)
  ✔ migrates v2 save to v3 automatically and persists to v3 key (0.559237ms)
  ✔ round-trips exportSave and importSave and rejects malformed payloads (0.576941ms)
✔ state.js (2.785161ms)
▶ modifiers.js
  ✔ returns all 12 cross-floor bonus keys defaulting to 1 in M1 (1.157586ms)
✔ modifiers.js (1.340794ms)
▶ economy.js
  ✔ calculates click value with upgrades, research, shares, abilities, and tether (0.393099ms)
  ✔ calculates bulk costs and max affordable accurately (0.272112ms)
  ✔ calculates generator payouts, cycle times, passive rates, and shares (0.3582ms)
  ✔ calculates offline earnings and caps at 24 hours (0.270403ms)
✔ economy.js (1.506414ms)
ℹ tests 12
ℹ suites 4
ℹ pass 12
ℹ fail 0
```

### b) Standalone Build
Command:
```bash
node scripts/build-standalone.mjs
```
Output:
```text
Built standalone artifact: /home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html (104710 bytes)
```

### c) Headless Chromium Checks (`index.html` & `idle_button.html`)
Launched `python3 -m http.server 8765 --bind 127.0.0.1` and `/usr/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9222` and verified both URLs via CDP:
Output:
```text
index.html {"val0":"$0.00","val6":"$6.00","topHidden":false,"elevHidden":false,"rightHidden":false,"saveModalOpen":true,"exportLen":1340,"resetModalOpen":true} errors: 0
idle_button.html {"val0":"$0.00","val6":"$6.00","topHidden":false,"elevHidden":false,"rightHidden":false,"saveModalOpen":true,"exportLen":1340,"resetModalOpen":true} errors: 0
ALL HEADLESS CHROMIUM CHECKS PASSED
```

---

## Iteration 2 — Challenger Findings Remediation

### Changes Made
1. **`js/state.js` (`importSave` numeric validation)**:
   - Updated `importSave` to reject negative, `NaN`, or non-finite values on required fields (`money`, `presses`) and any provided numeric scalar fields (`NUMERIC_SCALAR_FIELDS`: `money`, `totalMoneyRun`, `totalMoneyAllTime`, `rp`, `presses`, `shares`, `lifetimeShares`, `restructures`, `anomaliesCaught`, `phase`, `lastTick`).
2. **`js/state.js` (`migrateState` key whitelist & sanitization)**:
   - Removed `...parsed` / `...parsedTd` / `...parsedRpg` / `...parsedMerge` object spreads.
   - Explicitly whitelisted and copied only known schema keys from `createInitialState()`.
   - Added `sanitizeNonNegNumber`, `sanitizePlainValue`, and `sanitizeRecordMap` to clamp/sanitize corrupted negative or non-finite numbers and strip `__proto__`, `constructor`, `prototype`, and unknown keys across top-level state and nested objects/arrays (`generators`, `abilities`, `td`, `rpg`, `merge`).
3. **`tests/core_m1.test.js` (Regression Tests)**:
   - Added unit tests verifying `importSave` rejects negative/`NaN`/`Infinity`/`null` numeric fields and verifying `importSave` + `migrateState` strip `__proto__`/`constructor`/`prototype`/unknown keys without prototype pollution while clamping corrupted numbers.

### Iteration 2 Verification Commands & Exact Outputs

#### a) Unit Tests
Command:
```bash
node --test tests/core_m1.test.js
```
Output:
```text
▶ format.js
  ✔ formats money across small, suffix, negative, and scientific ranges (99.433476ms)
  ✔ formats numbers and handles non-finite inputs safely (8.268268ms)
  ✔ formats durations cleanly (0.277288ms)
✔ format.js (114.927206ms)
▶ state.js
  ✔ creates initial v3 state with all required fields (5.418413ms)
  ✔ preserves meta-progression across restructures (1.429397ms)
  ✔ migrates v2 save to v3 automatically and persists to v3 key (2.138721ms)
  ✔ round-trips exportSave and importSave and rejects malformed payloads (3.75122ms)
  ✔ rejects negative, NaN, and non-finite numeric fields in importSave (0.322999ms)
  ✔ strips __proto__, constructor, prototype, and unknown keys and sanitizes corrupted numbers (0.768408ms)
✔ state.js (15.092644ms)
▶ modifiers.js
  ✔ returns all 12 cross-floor bonus keys defaulting to 1 in M1 (0.373821ms)
✔ modifiers.js (0.63135ms)
▶ economy.js
  ✔ calculates click value with upgrades, research, shares, abilities, and tether (2.506996ms)
  ✔ calculates bulk costs and max affordable accurately (0.263257ms)
  ✔ calculates generator payouts, cycle times, passive rates, and shares (0.344519ms)
  ✔ calculates offline earnings and caps at 24 hours (1.972156ms)
✔ economy.js (5.813554ms)
ℹ tests 14
ℹ suites 4
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 499.749116
```

#### b) Standalone Build
Command:
```bash
node scripts/build-standalone.mjs
```
Output:
```text
Built standalone artifact: /home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html (108958 bytes)
```

#### c) Headless Chromium Check (`idle_button.html`)
Command: CDP check against `file:///home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` using `/usr/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9231`.
Output:
```text
{"hasButton":true,"topHidden":false,"saveModalOpen":true,"exportLen":0,"jsErrors":[]}
```

