# Explorer 1 Handoff: M1 JS Modularization, Standalone Build & Unit Tests

## 1. Symbol Mapping (`js/game.js` → Target Modules)

### `js/format.js` (New)
Pure formatting utilities (no DOM, no state):
- `SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']` (covers up to `1e33`, `>= 1e36` uses scientific notation).
- `fmtNumber(value, decimals = 2)`:
  - Handles non-finite (`!Number.isFinite(value)` → `'0'`), negative sign prefix (`-`).
  - `< 1000`: `value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })` (or integer if whole).
  - `1e3` to `< 1e36`: `tier = Math.floor(Math.log10(abs) / 3)`, scaled `(abs / 10 ** (tier * 3)).toFixed(decimals) + SUFFIXES[tier]`.
  - `>= 1e36`: `abs.toExponential(2)`.
- `fmtMoney(value)`:
  - Handles negative sign (`-$...`).
  - `< 1000`: `'$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
  - `>= 1000`: `'$' + fmtNumber(abs, 2)`.
- `fmtDuration(seconds)` (also export alias `fmtTime = fmtDuration`):
  - Clamps `< 0` to `0`.
  - `< 60`: `${Math.floor(s)}s`.
  - `< 3600`: `${m}m ${String(sec).padStart(2, '0')}s`.
  - `< 86400`: `${h}h ${String(m).padStart(2, '0')}m`.
  - `>= 86400`: `${d}d ${h}h`.

### `js/data.js` (Keep v0.2 balance intact for M1)
Retain all existing exports (`GENERATORS`, `MILESTONES`, `MANAGERS`, `UPGRADES`, `RESEARCH_PROJECTS`, `ABILITIES`, `NARRATIVE_BEATS`) unchanged for M1 (M2 will expand & rebalance).
Add floor metadata constant for the M1 Elevator / Portal Bar:
- `FLOORS = [`
  `{ id: 'desk', label: '1F: DESK', title: 'Executive Desk', unlockHint: 'Always open' },`
  `{ id: 'td', label: 'B2: SECURITY', title: 'Security Perimeter', unlockHint: 'Boardroom Perk (M3)' },`
  `{ id: 'rpg', label: 'B4: FIELD OPS', title: 'Field Ops', unlockHint: 'Boardroom Perk (M4)' },`
  `{ id: 'merge', label: 'B6: FORGE', title: 'Synthesis Forge', unlockHint: 'Boardroom Perk (M5)' }`
  `]`

### `js/state.js` (Upgrade to v3)
- `export const SAVE_KEY = 'idle_button_v3_save';`
- `export const LEGACY_V2_KEY = 'idle_button_v2_save';`
- `export const SAVE_VERSION = 3;`
- `createInitialState(preserved = {})`:
  - Preserves all v2 fields (`money: 0`, `totalMoneyRun: 0`, `totalMoneyAllTime`, `rp: 0`, `presses: 0`, `phase: 0`, `sinisterRevealed`, `soundEnabled`, `buyMode: '1'`, `activeTab: 'operations'`, `shares`, `restructures`, `generators: {}`, `upgrades: []`, `completedResearch: []`, `activeResearch: null`, `abilities: {}`, `triggeredBeats: []`, `memos: []`, `lastTick: Date.now()`).
  - Adds v3 fields per `PROJECT.md § Interface Contracts`:
    - `version: 3`
    - `activeFloor: 'desk'`
    - `unlockedFloors: preserved.unlockedFloors ? [...preserved.unlockedFloors] : ['desk']`
    - `lifetimeShares: preserved.lifetimeShares ?? preserved.shares ?? 0`
    - `boardroomPerks: preserved.boardroomPerks ? [...preserved.boardroomPerks] : []`
    - `achievements: preserved.achievements ? [...preserved.achievements] : []`
    - `anomaliesCaught: preserved.anomaliesCaught || 0`
    - `td: { wave: 1, highestWave: preserved.td?.highestWave || 0, scrap: 0, overcharge: 0, turrets: [], waveProgress: 0 }`
    - `rpg: { sector: 1, stage: 1, highestSector: preserved.rpg?.highestSector || 1, credits: 0, intel: 0, shards: preserved.rpg?.shards || 0, squad: [], artifacts: preserved.rpg?.artifacts ? [...preserved.rpg.artifacts] : [], equipped: preserved.rpg?.equipped ? [...preserved.rpg.equipped] : [] }`
    - `merge: { grid: Array(16).fill(null), spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: preserved.merge?.catalysts || 0, peakTier: preserved.merge?.peakTier || 0 }`
- `migrateState(parsed)`:
  - Normalizes v2 (no `version` or `version < 3`) or partial v3 objects onto `createInitialState()`.
  - Sets `version: 3`, `lifetimeShares: parsed.lifetimeShares ?? parsed.shares ?? 0`, deep-merges `td`, `rpg`, `merge` defaults, ensures `unlockedFloors` includes `'desk'`.
- `loadState(storage = defaultStorage())`:
  - Reads `SAVE_KEY`; if missing, checks `LEGACY_V2_KEY`, migrates via `migrateState`, and persists to `SAVE_KEY`.
  - Safe in Node.js (checks `typeof localStorage !== 'undefined'` when no custom `storage` is passed).
- `saveState(state, storage = defaultStorage())`
- `resetAllState(storage = defaultStorage())`: removes `SAVE_KEY` (and `LEGACY_V2_KEY`? Note: keep or remove `LEGACY_V2_KEY` so reset doesn't re-migrate v2 on reload — **remove both `SAVE_KEY` and `LEGACY_V2_KEY`** on explicit full reset!).
- `exportSave(state)`:
  - Returns UTF-8 safe base64 string of `JSON.stringify(state)` (using `btoa(unescape(encodeURIComponent(json)))` in browser or `Buffer.from(json, 'utf8').toString('base64')` in Node).
- `importSave(str)`:
  - Validates `typeof str === 'string'` and non-empty trimmed string.
  - Accepts either raw JSON (`trimmed.startsWith('{')`) or base64-encoded JSON.
  - Validates parsed object is non-null plain object and contains core save markers (`typeof parsed.money === 'number' && typeof parsed.presses === 'number'`).
  - Returns `{ ok: true, state: migrateState(parsed) }` on success or `{ ok: false, error: '<reason>' }` on failure.

### `js/modifiers.js` (New)
Single source of truth for cross-floor multipliers (zero imports from `floors/*` or `economy.js` to avoid circular dependencies):
- `export function getCrossFloorBonuses(state)`:
  Returns:
  ```js
  {
    moneyMult: 1,
    rpMult: 1,
    clickMult: 1,
    speedMult: 1,
    tdDamageMult: 1,
    tdFireRateMult: 1,
    tdScrapMult: 1,
    rpgAtkMult: 1,
    rpgDefMult: 1,
    rpgHpMult: 1,
    mergeSpeedMult: 1,
    sharePotencyMult: 1
  }
  ```
  (All `1` in M1; M2–M5 will add Boardroom, Achievement, TD, RPG, and Merge contributions here.)

### `js/economy.js` (New — extracted from `js/game.js` lines 69–193, 346–349)
Pure functions taking `(state, ...)` and optional `bonuses = getCrossFloorBonuses(state)`:
- `hasUpgrade(state, id)` (from `game.js:69`)
- `hasResearch(state, id)` (from `game.js:73`)
- `isAbilityActive(state, id)` (from `game.js:77`)
- `getShareMultiplier(state, bonuses)` (from `game.js:81`, multiplies per-share bonus by `bonuses.sharePotencyMult`)
- `getGlobalMultiplier(state, bonuses)` (from `game.js:86`, multiplies by `bonuses.moneyMult`)
- `getSpeedMultiplier(state, bonuses)` (from `game.js:96`, multiplies by `bonuses.speedMult`)
- `getGenMilestoneMult(owned)` (from `game.js:102`)
- `getGenPayout(state, gen, bonuses)` (from `game.js:110`)
- `getGenCycleTime(state, gen, bonuses)` (from `game.js:120`)
- `getPassiveMoneyRate(state, bonuses)` (from `game.js:124`)
- `getPassiveRpRate(state, bonuses)` (from `game.js:135`, multiplies by `bonuses.rpMult`)
- `getClickValue(state, bonuses)` (from `game.js:148`, multiplies base click by `bonuses.clickMult`)
- `getBulkCost(gen, owned, count)` (from `game.js:161`)
- `getMaxAffordable(gen, owned, money)` (from `game.js:168`)
- `getBuyInfo(state, gen)` (from `game.js:180`)
- `getPendingShares(state)` (from `game.js:346`, keep `Math.floor(Math.sqrt(state.totalMoneyRun / 10000))` for M1)
- `MAX_OFFLINE_SECONDS = 24 * 60 * 60` (`86400`)
- `calculateOfflineEarnings(state, nowMs = Date.now(), bonuses = getCrossFloorBonuses(state))`:
  - `rawElapsed = Math.max(0, (nowMs - (state.lastTick || nowMs)) / 1000)`
  - `elapsedSec = Math.min(rawElapsed, MAX_OFFLINE_SECONDS)`
  - `moneyEarned = getPassiveMoneyRate(state, bonuses) * elapsedSec`
  - `rpEarned = getPassiveRpRate(state, bonuses) * elapsedSec`
  - Returns `{ elapsedSec, moneyEarned, rpEarned, capped: rawElapsed > MAX_OFFLINE_SECONDS }`.

### `js/audio.js` (Existing)
Keep `playClickSound(enabled, pitchOffset)` and `playUnlockSound(enabled)` as-is.

### `js/ui.js` (New — extracted from `js/game.js` lines 17–61, 201–214, 376–725)
DOM caching, rendering, modals, floor/tab switching, and per-frame updates:
- `cacheElements()` / `el`: caches all existing elements plus new M1 UI elements (elevator/floor switcher buttons, floor panels `#floor-desk`, `#floor-td`, `#floor-rpg`, `#floor-merge`, collapsible owned/completed drawers, and modals: Reset, Export/Import, Offline Shift Summary).
- `spawnFloat(amount)` (from `game.js:201`, uses `fmtMoney`)
- `pulseLed()` (from `game.js:210`)
- `switchTab(state, tabName)` (from `game.js:376`)
- `switchFloor(state, floorId)` (new: toggles active floor button & `.floor-panel.active`, guards against locked floors)
- `renderFloorSwitcher(state)` (new: updates locked/unlocked state on `1F: DESK`, `B2: SECURITY`, `B4: FIELD OPS`, `B6: FORGE`)
- `renderVisibility(state)` (from `game.js:388`)
- `renderGenerators(state, handlers)` (from `game.js:431`)
- `renderUpgrades(state, handlers)` (from `game.js:477`, separates available vs owned into collapsible drawer)
- `renderResearch(state, handlers)` (from `game.js:541`, separates available vs completed into collapsible drawer)
- `renderAbilities(state, handlers)` (from `game.js:586`)
- `renderPrestige(state, handlers)` (from `game.js:604`)
- `renderMemos(state)` (from `game.js:629`)
- `renderAll(state, handlers)`: convenience wrapper calling all render functions.
- `updateDynamicUI(state)` (from `game.js:641`)
- Modal helpers: `openModal(id)`, `closeModal(id)`, `showOfflineModal({ elapsedSec, moneyEarned, rpEarned })`, `showExportImportModal(state, onImport)`.

### `js/game.js` (Lean Orchestrator)
Imports from `state.js`, `data.js`, `modifiers.js`, `economy.js`, `audio.js`, `ui.js`.
Contains only:
- Module state (`let state = loadState()`, `lastFrame`, `lastSave`)
- `addMemo(text, type)`
- `checkPhasesAndNarrative()`
- Action handlers (`handlePress`, `buyGenerator`, `runGenerator`, `buyUpgradeOrManager`, `startResearch`, `triggerAbility`, `doRestructure`)
- `applyOfflineProgress()` on boot: if `offline.elapsedSec > 60 && (offline.moneyEarned > 0 || offline.rpEarned > 0)`, credits `money`, `totalMoneyRun`, `totalMoneyAllTime`, `rp`, calls `checkPhasesAndNarrative()`, and opens Offline Shift Summary modal.
- `tick(now)` (`rAF` loop: abilities, generators, active research, `updateDynamicUI`, 5s autosave)
- Event binding (button press, spacebar, tab/floor switch, buy mode, sound toggle, reset modal confirm, export/import modal, `beforeunload` save).

---

## 2. `scripts/build-standalone.mjs` Design

Zero-dependency Node ESM script (`node scripts/build-standalone.mjs`):
- **Topological module order**:
  1. `js/format.js`
  2. `js/data.js`
  3. `js/state.js`
  4. `js/modifiers.js`
  5. `js/economy.js`
  6. `js/audio.js`
  7. `js/ui.js`
  8. Optional if present: `js/floors/td.js`, `js/floors/rpg.js`, `js/floors/merge.js`
  9. `js/game.js`
- **String/Comment-Safe `stripModuleSyntax(code)`**:
  - Character-by-character state machine (`NORMAL`, `SINGLE_QUOTE`, `DOUBLE_QUOTE`, `TEMPLATE`, `LINE_COMMENT`, `BLOCK_COMMENT`) so `import`/`export` words inside string literals, template literals, or comments are never corrupted.
  - In `NORMAL` state at statement boundaries:
    - Removes `import ... from '...';` (single or multiline) and `import '...';`.
    - Removes `export { ... };` blocks.
    - Strips `export default ` and `export ` before `function`, `async function`, `const`, `let`, `var`, `class`.
  - Escapes `</script>` → `<\/script>` in JS output.
- **IIFE & HTML Injection**:
  - Wraps combined JS in `(() => {\n'use strict';\n...\n})();`.
  - Reads `index.html` and `styles.css`.
  - Replaces `<link rel="stylesheet" href="styles.css" />` (or `href="styles.css"`) with `<style>\n${css}\n</style>`.
  - Replaces `<script type="module" src="js/game.js"></script>` with `<script>\n${bundledJs}\n</script>`.
  - Writes `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (creating parent directory if needed).

---

## 3. `tests/core_m1.test.js` Design (`node --test`)

Uses `node:test` (`describe`, `it`) and `node:assert/strict`:
1. **`format.js`**:
   - `fmtMoney`: `$0.00`, `$12.50`, `$999.99`, `$1.50K`, `$2.50M`, `$1.00B`, `$1.00T`, `$1.00Qa`, `$1.00Dc`, scientific fallback at `1e36`, negative values.
   - `fmtNumber`: small integers, decimals, `K`..`Dc` suffixes, scientific fallback, `NaN`/`Infinity` safety.
   - `fmtDuration`: `0s`, `45s`, `1m 30s`, `1h 01m`, `1d 2h`.
2. **`state.js`**:
   - `createInitialState()`: verifies `version: 3`, `activeFloor: 'desk'`, `unlockedFloors: ['desk']`, `boardroomPerks: []`, `achievements: []`, `anomaliesCaught: 0`, and `td`, `rpg`, `merge` structures.
   - `createInitialState(preserved)`: verifies preservation of `shares`, `lifetimeShares`, `restructures`, `boardroomPerks`, `achievements`, `unlockedFloors`, `rpg.artifacts`, `merge.catalysts`.
   - v2 → v3 migration: `loadState(mockStorage)` with `idle_button_v2_save` upgrades to `version: 3`, sets `lifetimeShares` from `shares`, populates `td`/`rpg`/`merge`.
   - `exportSave` / `importSave`: base64 round-trip, raw JSON import, and rejection (`ok: false`) for empty strings, malformed JSON, invalid base64, and unrelated JSON objects (`{ foo: 'bar' }`).
3. **`modifiers.js`**:
   - `getCrossFloorBonuses(state)`: verifies all 12 keys exist and equal `1` in M1.
4. **`economy.js`**:
   - `getClickValue`: base `$1`, `upg_keycap`, `upg_espresso`, `res_ergonomics`, `shares`, `ab_rush`, `ab_syphon`, `upg_tether` (+2% of passive $/sec).
   - `getBulkCost` & `getMaxAffordable`: geometric series accuracy, `0` when unaffordable, `500` max cap.
   - `getGenPayout`, `getGenCycleTime`, `getPassiveMoneyRate`, `getPassiveRpRate` (`0` when `phase < 3`, positive when `phase >= 3` with manager).
   - `getShareMultiplier` & `getPendingShares`.
   - `calculateOfflineEarnings`: `0` elapsed, normal elapsed (e.g. 120s), and 24h cap (`86400s`) when `lastTick` is 48h ago.
