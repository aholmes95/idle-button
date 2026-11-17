# Explorer 1 Handoff Report — Milestone M3 (Floor B2: Security Perimeter)

## 1. Codebase Investigation Findings

### 1.1 `js/state.js`
- **Save Keys & Version**:
  - `SAVE_KEY = 'idle_button_v3_save'` ([js/state.js:1](file:///home/antigravity/aholmes95/idle-button/js/state.js#L1))
  - `LEGACY_V2_KEY = 'idle_button_v2_save'` ([js/state.js:2](file:///home/antigravity/aholmes95/idle-button/js/state.js#L2))
  - `SAVE_VERSION = 3` ([js/state.js:3](file:///home/antigravity/aholmes95/idle-button/js/state.js#L3))
- **`createInitialState(preserved = {})`** ([js/state.js:9-97](file:///home/antigravity/aholmes95/idle-button/js/state.js#L9-L97)):
  - `unlockedFloors` ([L10-12](file:///home/antigravity/aholmes95/idle-button/js/state.js#L10-L12)): `['desk', ...preserved.unlockedFloors]` deduplicated.
  - `activeFloor: 'desk'` ([L26](file:///home/antigravity/aholmes95/idle-button/js/state.js#L26)).
  - `td` shape ([L63-70](file:///home/antigravity/aholmes95/idle-button/js/state.js#L63-L70)):
    ```js
    td: {
      wave: 1,
      highestWave: preserved.td?.highestWave || 0,
      scrap: 0,
      overcharge: 0,
      turrets: [],
      waveProgress: 0
    }
    ```
  - `rpg` shape ([L73-83](file:///home/antigravity/aholmes95/idle-button/js/state.js#L73-L83)):
    ```js
    rpg: {
      sector: 1,
      stage: 1,
      highestSector: preserved.rpg?.highestSector || 1,
      credits: 0,
      intel: 0,
      shards: preserved.rpg?.shards || 0,
      squad: [],
      artifacts: Array.isArray(preserved.rpg?.artifacts) ? [...preserved.rpg.artifacts] : [],
      equipped: Array.isArray(preserved.rpg?.equipped) ? [...preserved.rpg.equipped] : []
    }
    ```
  - `preserved` fields currently consumed in `createInitialState`:
    - `unlockedFloors`, `totalMoneyAllTime`, `sinisterRevealed`, `soundEnabled`, `shares`, `lifetimeShares`, `restructures`, `boardroomPerks`, `achievements`, `anomaliesCaught`, `td.highestWave`, `rpg.{highestSector, shards, artifacts, equipped}`, `merge.{catalysts, peakTier}`.
- **`migrateState(parsed)`** ([js/state.js:150-257](file:///home/antigravity/aholmes95/idle-button/js/state.js#L150-L257)):
  - Sanitizes `td` ([L223-230](file:///home/antigravity/aholmes95/idle-button/js/state.js#L223-L230)):
    - `wave`: `Math.max(1, sanitizeNonNegNumber(parsedTd.wave, base.td.wave))`
    - `highestWave`, `scrap`, `overcharge`, `waveProgress`: `sanitizeNonNegNumber(...)`
    - `turrets`: `Array.isArray(parsedTd.turrets) ? sanitizePlainValue(parsedTd.turrets) : []`
  - Strips `__proto__`, `constructor`, `prototype` via `FORBIDDEN_KEYS` ([L99](file:///home/antigravity/aholmes95/idle-button/js/state.js#L99), [L132](file:///home/antigravity/aholmes95/idle-button/js/state.js#L132)).
- **`loadState(storage)`** ([js/state.js:259-276](file:///home/antigravity/aholmes95/idle-button/js/state.js#L259-L276)):
  - Reads `SAVE_KEY`, falls back to `LEGACY_V2_KEY` (migrates & saves to `SAVE_KEY`), else `createInitialState()`.

### 1.2 `js/modifiers.js`
- **`getCrossFloorBonuses(state)`** ([js/modifiers.js:1-35](file:///home/antigravity/aholmes95/idle-button/js/modifiers.js#L1-L35)):
  - Currently computes `moneyMult` from:
    - `state.achievements.length`: `Math.pow(1.05, achCount)` ([L10-13](file:///home/antigravity/aholmes95/idle-button/js/modifiers.js#L10-L13))
    - `perk_synergy_core` + `state.restructures`: `Math.pow(1.5, restructures)` ([L14-18](file:///home/antigravity/aholmes95/idle-button/js/modifiers.js#L14-L18))
  - Returns 12 keys:
    `{ moneyMult, rpMult, clickMult, speedMult, tdDamageMult, tdFireRateMult, tdScrapMult, rpgAtkMult, rpgDefMult, rpgHpMult, mergeSpeedMult, sharePotencyMult }`
  - Note: `tests/core_m1.test.js` asserts that calling `getCrossFloorBonuses(createInitialState())` returns all 12 keys equal to `1`.

### 1.3 `js/data.js`
- **`perk_floor_defense`** ([js/data.js:410-418](file:///home/antigravity/aholmes95/idle-button/js/data.js#L410-L418)):
  - `id: 'perk_floor_defense'`, `name: 'Unlock: B2 Security Perimeter'`, `cost: 15`, `requires: 'perk_synergy_core'`, `category: 'floors'`, `unlockFloor: 'td'`.
- **`FLOORS`** ([js/data.js:589-622](file:///home/antigravity/aholmes95/idle-button/js/data.js#L589-L622)):
  - Entry for `td` at [L598-605](file:///home/antigravity/aholmes95/idle-button/js/data.js#L598-L605): `id: 'td'`, `code: 'B2'`, `name: 'SECURITY'`, `label: 'B2: SECURITY'`, `title: 'Security Perimeter'`, `unlockHint: 'Idle Tower Defense — Unlock via Boardroom Skill Tree (M3)'`.
- **`RESEARCH_PROJECTS`** ([js/data.js:179-300](file:///home/antigravity/aholmes95/idle-button/js/data.js#L179-L300)):
  - 12 projects across `'efficiency'` (6) and `'containment'` (6). Note `tests/balance_m2.test.js` checks `RESEARCH_PROJECTS.length >= 12` and `ACHIEVEMENTS` checks `completedResearch.length >= RESEARCH_PROJECTS.length` ([L463](file:///home/antigravity/aholmes95/idle-button/js/data.js#L463)).
- **`NARRATIVE_BEATS`** ([js/data.js:466-587](file:///home/antigravity/aholmes95/idle-button/js/data.js#L466-L587)):
  - 20 beats; no TD-specific beats yet.

### 1.4 `js/game.js`
- **Boot / Init** ([js/game.js:650-658](file:///home/antigravity/aholmes95/idle-button/js/game.js#L650-L658)):
  - `cacheElements()`, `bindEvents()`, `processAchievements()`, `checkPhasesAndNarrative()`, `renderAll(state, handlers)`, `applyOfflineProgress()`, `updateDynamicUI(state)`, `requestAnimationFrame(tick)`.
- **Handlers** ([js/game.js:78-86](file:///home/antigravity/aholmes95/idle-button/js/game.js#L78-L86)):
  - `handlers` object passed to `render*` functions.
- **Floor Unlocking**:
  - `buyBoardroomPerk(perkId)` ([js/game.js:247-270](file:///home/antigravity/aholmes95/idle-button/js/game.js#L247-L270)) checks `perk.unlockFloor`, pushes to `state.unlockedFloors`, calls `renderFloorSwitcher(state)`, and adds a system memo.
  - `checkPhasesAndNarrative()` ([js/game.js:107-136](file:///home/antigravity/aholmes95/idle-button/js/game.js#L107-L136)) evaluates phases 1–4 and `NARRATIVE_BEATS`, then re-renders visibility, floor switcher, and panels if `changed`.
- **`doRestructure()`** ([js/game.js:272-333](file:///home/antigravity/aholmes95/idle-button/js/game.js#L272-L333)):
  - Builds `preserved` ([L281-303](file:///home/antigravity/aholmes95/idle-button/js/game.js#L281-L303)) with `td: { highestWave: state.td?.highestWave || 0 }`, calls `createInitialState(preserved)`, applies starting perks, re-renders all, saves.
- **`applyOfflineProgress()`** ([js/game.js:395-409](file:///home/antigravity/aholmes95/idle-button/js/game.js#L395-L409)):
  - Calls `calculateOfflineEarnings(state, Date.now(), bonuses)` from `js/economy.js` and shows `showOfflineModal(offline)` if `elapsedSec > 60`.
- **`tick(now)`** ([js/game.js:411-533](file:///home/antigravity/aholmes95/idle-button/js/game.js#L411-L533)):
  - Computes `dt = Math.min((now - lastFrame) / 1000, 1)` and `bonuses = getCrossFloorBonuses(state)`.
  - Ticks `anomalyBuffs`, `perk_auto_mgr`, `abilities`, `generators`, `activeResearch`, anomaly floaters, `processAchievements()`, `checkPhasesAndNarrative()`, `updateDynamicUI(state)`, periodic save every 5s.
  - Does not yet tick any floor modules.

### 1.5 `js/floors/td.js` & `scripts/build-standalone.mjs`
- `js/floors/td.js` **does not exist yet** (`ENOENT`).
- `scripts/build-standalone.mjs` ([L7-19](file:///home/antigravity/aholmes95/idle-button/scripts/build-standalone.mjs#L7-L19)) already lists `'js/floors/td.js'` in `MODULE_ORDER` (right after `js/ui.js` and before `js/game.js`).
- **CRITICAL BUNDLING CONSTRAINT**: `stripModuleSyntax` ([L25-210](file:///home/antigravity/aholmes95/idle-button/scripts/build-standalone.mjs#L25-L210)) strips `import`/`export` statements and concatenates all modules into a **single IIFE** (`(() => { 'use strict'; ... })()`). Therefore:
  - **All top-level identifiers (`const`, `let`, `function`, `class`) in `js/floors/td.js` share the same scope as `format.js`, `data.js`, `state.js`, `modifiers.js`, `economy.js`, `audio.js`, `ui.js`, and `game.js`!**
  - `js/floors/td.js` must NOT declare top-level names that collide with existing globals (e.g., `el`, `state`, `handlers`, `fmtMoney`, `fmtNumber`, `GENERATORS`, `ABILITIES`, `tick`, `addMemo`, etc.). Prefix TD-specific constants/helpers cleanly (e.g., `TD_TURRETS`, `TD_ENEMIES`, `TD_PAD_COSTS`, `tdGetTurretStats`, etc.).
  - Also, `js/floors/td.js` is placed **before** `js/game.js` and **after** `js/ui.js` in `MODULE_ORDER`, so it can safely reference exports from `format.js`, `data.js`, `modifiers.js`, `economy.js`, `audio.js`, and `ui.js`, and `game.js` can import from `./floors/td.js`.

---

## 2. Concrete Design Recommendations

### 2.1 `js/state.js`
Extend `state.td` in both `createInitialState(preserved)` and `migrateState(parsed)`:
```js
td: {
  wave: 1,
  highestWave: preserved.td?.highestWave || 0,
  scrap: 0,
  overcharge: 0,
  unlockedPads: Math.max(4, preserved.td?.unlockedPads || 4), // 4 initial pads, expandable up to 8 with $
  autoWave: preserved.td?.autoWave !== undefined ? preserved.td.autoWave : true,
  bossMilestonesClaimed: Array.isArray(preserved.td?.bossMilestonesClaimed)
    ? [...preserved.td.bossMilestonesClaimed]
    : [],
  turrets: [], // Array of { padIndex: number, type: string, level: number }
  waveProgress: 0
}
```
- In `migrateState(parsed)`, sanitize `unlockedPads` (`Math.min(8, Math.max(4, sanitizeNonNegNumber(...)))`), `autoWave` (`typeof ... === 'boolean'`), and `bossMilestonesClaimed` (array of positive integers).
- Consider also preserving `rpg.intel` in `doRestructure()` (or keeping `intel` as a meta-currency earned from TD bosses so it's ready when Floor B4 is unlocked in M4).

### 2.2 `js/modifiers.js`
- **TD Output -> Core**:
  - `const highestWave = state.td?.highestWave || 0;`
  - When `highestWave > 0`:
    - **Containment Integrity**: `moneyMult *= 1 + 0.10 * highestWave` (+10% global `$/sec` per highest wave cleared/reached, or `highestWave` where wave 1 = 0 bonus until wave 1 is cleared -> track `highestWave` as highest *cleared* or `Math.max(0, highestWave - 1)` if `highestWave` starts at 0). Keeping `highestWave` starting at `0` (incremented on wave clear) guarantees `getCrossFloorBonuses(createInitialState())` still returns `1` for all 12 keys!
    - `rpMult *= 1 + 0.05 * highestWave` (+5% `RP/sec` per highest wave).
- **TD Inputs**:
  - `tdDamageMult`: e.g. `1` base, boosted by `res_compliance` (`1.25x`), `res_cosmic_audit` (`2x`), or `ab_rush` (`1.5x`) if desired, while defaulting to `1` on initial state.
  - `tdFireRateMult`: e.g. `1` base, boosted by `ab_overclock` (`1.5x`) or `res_workflow` (`1.15x`).
  - `tdScrapMult`: e.g. `1` base, boosted by `perk_synergy_core` (`1 + 0.1 * restructures`).

### 2.3 `js/floors/td.js`
Export the 4 contract functions:
1. `tickTD(state, dt, bonuses)` — pure deterministic simulation:
   - Only runs when `state.unlockedFloors.includes('td')` (and `dt > 0`).
   - Decrement `state.td.overcharge = Math.max(0, state.td.overcharge - dt)`.
   - Compute total turret DPS, slow factor (from NDA Slow-Field), AoE bonus (from Shredder Cannon), chain/burst bonus (from Compliance Tesla), multiplied by `bonuses.tdDamageMult`, `bonuses.tdFireRateMult`, and Overcharge (`2.5x` when `overcharge > 0`).
   - Compute wave HP & enemy count/speed based on `state.td.wave` (Boss every 5th wave: `wave % 5 === 0` has higher HP, slower advance, and boss title).
   - Advance `waveProgress` deterministically: effective DPS vs wave HP (`progressDelta = (effectiveDps * dt) / waveTotalHp`, slowed/amplified by NDA Slow-Field). If `turrets.length === 0`, `waveProgress` does not advance (or advances at minimal base security drone DPS? Better: `0` DPS when no turrets, or 1 free starter pad/turret or cheap 0-scrap first turret so player can start immediately with initial scrap or `$`!). **Important**: Give players either `scrap: 25` on first TD unlock OR make Tier 1 turret cost `0` scrap for the first turret / convertible from `$` so the player is never soft-locked at 0 scrap!
   - When `waveProgress >= 1`:
     - Handle multi-wave clears if `dt` is large (e.g., offline catch-up) via a bounded loop or per-wave step.
     - Award `scrap` (`waveScrap * bonuses.tdScrapMult`), update `highestWave = Math.max(highestWave, wave)`.
     - If `wave % 5 === 0` (Boss wave cleared):
       - Grant `state.rpg.intel += bossIntelReward` (e.g., `5 * (wave / 5)`).
       - If `!state.td.bossMilestonesClaimed.includes(wave)`: push `wave`, grant milestone Executive Shares (`+2 * (wave / 5)` to `state.shares` and `state.lifetimeShares`).
     - If `state.td.autoWave` is `true`, advance `state.td.wave += 1` and reset `waveProgress = 0` (carrying over excess or resetting cleanly). If `autoWave` is `false`, clamp `waveProgress = 1` (wave ready/cleared, waiting for manual "Next Wave" click) or pause at wave boundary.
2. `renderTD(state, containerEl, handlers)` — builds `#floor-td` DOM:
   - Header bar: Floor badge `B2 // SECURITY PERIMETER`, Wave & Boss indicator, Scrap counter, Containment Integrity bonus summary (`+X% $/s`, `+Y% RP/s`), and `RETURN TO 1F: DESK` button (`[data-return-desk]`).
   - Perimeter Radar / Lane visualizer: Enemy threat card (archetype name, Boss tag if `wave % 5 === 0`, HP/Progress bar, effective DPS readout).
   - Turret Pad Grid (up to 8 pads): unlocked pads show deployed turret (type, level, DPS, Upgrade/Salvage buttons) or empty pad with Build selector (4 turret types); locked pads show `$` cost to unlock (`Buy Pad`).
   - Controls bar: `PERIMETER OVERCHARGE` button (costs `$`, activates 15s of 2.5x turret output), `AUTO-WAVE: ON/OFF` toggle, and `ADVANCE WAVE` button (when `autoWave` is off).
3. `updateTDUI(state, containerEl)` — lightweight per-frame updates:
   - Updates wave number, progress bar width/text, scrap count, overcharge timer/button state, pad affordability/button disabled states, and Containment Integrity bonus readout without rebuilding the DOM.
4. `bindTDEvents(containerEl, getState, onAction)` — event delegation on `containerEl` (`#floor-td`):
   - Handles `[data-td-action="build"]`, `upgrade`, `salvage`, `unlock-pad`, `overcharge`, `toggle-autowave`, `next-wave`, and `[data-return-desk]`.

### 2.4 `js/data.js`
- Update `FLOORS` `td` `unlockHint` to remove `(M3)` tag and describe the Boardroom unlock cleanly.
- Add TD achievements (e.g. `ach_td_wave_5`: Clear Wave 5, `ach_td_wave_20`: Clear Wave 20) — verify `balance_m2.test.js` only checks `ACHIEVEMENTS.length >= 20` (it does!).
- Add TD narrative beats in `NARRATIVE_BEATS` (unlocking B2, clearing first Boss wave 5).

### 2.5 `js/game.js`
- Import `tickTD, renderTD, updateTDUI, bindTDEvents` from `./floors/td.js`.
- In `tick(now)`:
  - If `state.unlockedFloors.includes('td')`, call `const tdEvents = tickTD(state, dt, bonuses)`. If `tdEvents?.bossCleared`, log memo + play sound + `processAchievements()`.
  - If `state.activeFloor === 'td'`, call `updateTDUI(state, el.floorTd)` (or `document.getElementById('floor-td')`).
- In `doRestructure()`:
  - Preserve `td: { highestWave: state.td?.highestWave || 0, unlockedPads: state.td?.unlockedPads || 4, autoWave: state.td?.autoWave ?? true, bossMilestonesClaimed: state.td?.bossMilestonesClaimed || [] }`.
- In `buyBoardroomPerk(perkId)` / `switchFloor`:
  - When `td` is unlocked, give starter `scrap` (e.g. `25`) if `state.td.scrap === 0 && state.td.turrets.length === 0`, and call `renderTD` when switching to `'td'` or on `renderAll`.
- In `applyOfflineProgress()`:
  - If `state.unlockedFloors.includes('td')` and `offline.elapsedSec > 0`, simulate `tickTD(state, Math.min(offline.elapsedSec, 3600) * offline.efficiency, bonuses)` (or step in chunks) so TD progresses offline too.
- In `bindEvents()` / boot:
  - Call `bindTDEvents(document.getElementById('floor-td'), () => state, handleTDAction)` and wire `[data-return-desk]` cleanly.
