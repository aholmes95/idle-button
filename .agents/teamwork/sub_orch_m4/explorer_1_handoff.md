# Explorer 1 Handoff — Milestone M4 (Floor B4: Field Ops / RPG Auto-Battler & Artifacts)

## 1. State Schema, Preservation (`doRestructure`), and Save Migration

### `js/state.js`
- **`createInitialState(preserved = {})`** (`js/state.js:9-102`):
  - **`unlockedFloors`** (`js/state.js:10-12`, `27`):
    ```js
    const unlockedFloors = Array.isArray(preserved.unlockedFloors) && preserved.unlockedFloors.length > 0
      ? [...new Set(['desk', ...preserved.unlockedFloors])]
      : ['desk'];
    ```
  - **`state.rpg`** (`js/state.js:78-88`):
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
    > **Note on `rpg.intel`:** Currently `intel` resets to `0` in `createInitialState(preserved)` (`js/state.js:83`) and is not preserved in `doRestructure()`. `td.js` awards `state.rpg.intel += 5 * bossTier` on TD boss clears (`js/floors/td.js:282-285`). If M4 wants `intel` or `rpg` upgrades/stageProgress/battleProgress/etc. persisted or reset on Restructure, keep `state.rpg` compatible with `migrateState` and `doRestructure()`.
  - **`state.merge`** (`js/state.js:91-98`):
    ```js
    merge: {
      grid: Array(16).fill(null),
      spawnerLevel: 1,
      baseTier: 1,
      autoMerge: false,
      catalysts: preserved.merge?.catalysts || 0,
      peakTier: preserved.merge?.peakTier || 0
    }
    ```

- **`migrateState(parsed)`** (`js/state.js:155-267`):
  - `unlockedFloors` (`js/state.js:161-163`): Filters strings, ensures `'desk'` is always present.
  - `activeFloor` (`js/state.js:165`): Defaults to `'desk'` if `parsed.activeFloor` is not in `unlockedFloors`.
  - `rpg` (`js/state.js:242-252`):
    - `sector`: `Math.max(1, sanitizeNonNegNumber(parsedRpg.sector, base.rpg.sector))`
    - `stage`: `Math.max(1, sanitizeNonNegNumber(parsedRpg.stage, base.rpg.stage))`
    - `highestSector`: `Math.max(1, sanitizeNonNegNumber(parsedRpg.highestSector, base.rpg.highestSector))`
    - `credits`: `sanitizeNonNegNumber(parsedRpg.credits, base.rpg.credits)`
    - `intel`: `sanitizeNonNegNumber(parsedRpg.intel, base.rpg.intel)`
    - `shards`: `sanitizeNonNegNumber(parsedRpg.shards, base.rpg.shards)`
    - `squad`: `Array.isArray(parsedRpg.squad) ? sanitizePlainValue(parsedRpg.squad) : []`
    - `artifacts`: `Array.isArray(parsedRpg.artifacts) ? sanitizePlainValue(parsedRpg.artifacts) : []`
    - `equipped`: `Array.isArray(parsedRpg.equipped) ? sanitizePlainValue(parsedRpg.equipped) : []`
    > **Note:** If new fields are added to `state.rpg` (e.g., `stageProgress`, `autoAdvance`, `hpPct`, `totalKills`, etc.), they should be initialized in `createInitialState` and sanitized in `migrateState` using `sanitizeNonNegNumber` / `sanitizePlainValue`.
  - `merge` (`js/state.js:254-263`): Sanitizes `grid`, `spawnerLevel`, `baseTier`, `autoMerge`, `catalysts`, `peakTier`.

### `doRestructure()` Preservation (`js/game.js:288-359`)
- `preserved` object (`js/game.js:297-326`) already preserves:
  - `unlockedFloors: state.unlockedFloors` (`js/game.js:304`)
  - `rpg` (`js/game.js:316-321`):
    ```js
    rpg: {
      highestSector: state.rpg?.highestSector || 1,
      shards: state.rpg?.shards || 0,
      artifacts: state.rpg?.artifacts || [],
      equipped: state.rpg?.equipped || []
    }
    ```
  - `merge` (`js/game.js:322-325`): `catalysts`, `peakTier`.
- After `createInitialState(preserved)` (`js/game.js:327`), `doRestructure()` re-renders all UI and explicitly checks unlocked floors (`js/game.js:354-356`):
  ```js
  if (state.unlockedFloors.includes('td')) {
    renderTD(state, el.floorTd, handlers);
  }
  ```
  - **M4 Action:** Add `if (state.unlockedFloors.includes('rpg')) { renderRPG(state, el.floorRpg, handlers); }` (and similarly in `importSave` at `js/game.js:704-706`, `applyOfflineProgress` at `js/game.js:437-439`, and Boot at `js/game.js:752-754`).

---

## 2. `getCrossFloorBonuses(state)` in `js/modifiers.js`

File: `js/modifiers.js:1-58`

### Existing TD Wiring (Reference Pattern)
- **TD → Core** (`js/modifiers.js:25-30`):
  - `highestWave = state.td?.highestWave || 0`
  - `moneyMult *= 1 + 0.10 * highestWave`
  - `rpMult *= 1 + 0.05 * highestWave`
- **Core → TD** (`js/modifiers.js:32-41`):
  - `res_compliance` → `tdDamageMult *= 1.25`
  - `res_cosmic_audit` → `tdDamageMult *= 2`
  - `res_workflow` → `tdFireRateMult *= 1.15`
  - `res_automated_kpi` → `tdScrapMult *= 1.25`
  - `ab_rush` active → `tdDamageMult *= 1.5`
  - `ab_overclock` active → `tdFireRateMult *= 1.5`
  - `perk_synergy_core` (`js/modifiers.js:20-23`) → `tdScrapMult *= 1 + 0.1 * restructures`

### RPG Fields Already in Return Object (`js/modifiers.js:44-57`)
- `getCrossFloorBonuses(state)` already returns stubbed `1` values for:
  - `rpgAtkMult: 1` (`js/modifiers.js:52`)
  - `rpgDefMult: 1` (`js/modifiers.js:53`)
  - `rpgHpMult: 1` (`js/modifiers.js:54`)
- Also returns `clickMult`, `speedMult`, `moneyMult`, `rpMult`, `sharePotencyMult`, `tdDamageMult`, `tdFireRateMult`, `tdScrapMult`, `mergeSpeedMult`.
- **M4 Action (Needs Wiring in `modifiers.js`):**
  1. **RPG → Core / TD:**
     - Equipped **Containment Artifacts** (`state.rpg.equipped` referencing `state.rpg.artifacts` or artifact definitions) and/or `state.rpg.highestSector` should feed into `moneyMult`, `rpMult`, `clickMult`, `speedMult`, `sharePotencyMult`, and/or `tdDamageMult` / `tdFireRateMult` (while keeping `PROJECT.md` rule: no floor module imports another floor module; all cross-floor effects flow through `getCrossFloorBonuses(state)`).
  2. **Core / TD → RPG:**
     - Wire Core research/abilities/perks into `rpgAtkMult`, `rpgDefMult`, `rpgHpMult` (e.g., `res_ergonomics` / `res_compliance` / `res_cosmic_audit` / `ab_rush` / `ab_overclock` / `perk_synergy_core` / `td.highestWave`).
     - Note `state.rpg.intel` is already fed directly by TD boss kills (`js/floors/td.js:282-285`), and `js/floors/rpg.js` can spend `state.rpg.intel` (e.g., for squad tactics/intel boosts/recon) without importing `td.js`.

---

## 3. Floor Module Conventions (`js/floors/td.js` & `js/game.js`)

### `js/floors/td.js` Architecture & Conventions
- **Exports required by `PROJECT.md:94-99`:**
  - `tickTD(state, dt, bonuses)` (`js/floors/td.js:234-309`)
  - `renderTD(state, containerEl, handlers)` (`js/floors/td.js:319-526`)
  - `updateTDUI(state, containerEl)` (`js/floors/td.js:528-613`)
  - `bindTDEvents(containerEl, getState, onAction)` (`js/floors/td.js:615-654`)
- **Pure/Deterministic Simulation (`tickTD`):**
  - Guards: `!state?.td || !Number.isFinite(dt) || dt <= 0` and `!state.unlockedFloors.includes('td')` (`js/floors/td.js:236-237`).
  - Uses `bonuses || getCrossFloorBonuses(state)` (`js/floors/td.js:239`).
  - Deterministic step loop (`while (remDt > 0 && steps < maxSteps)` with `maxSteps = 200`, `js/floors/td.js:244-306`) — no `Math.random()`, safe for both `requestAnimationFrame` (`dt <= 1`) and offline catch-up (`offline.elapsedSec * efficiency`).
  - Returns a structured summary object `{ wavesCleared, bossCleared, clearedWaves }` (`js/floors/td.js:235, 308`) so `game.js` can trigger memos, sounds, achievement checks, and saves.
- **Boss Drops (including Intel):** (`js/floors/td.js:279-292`)
  - Every 5th wave (`w % 5 === 0`):
    - `bossTier = Math.floor(clearedWave / 5)`
    - `intelReward = 5 * bossTier` added to `state.rpg.intel` (`js/floors/td.js:282-285`)
    - First-time milestone (`!state.td.bossMilestonesClaimed.includes(clearedWave)`): awards `2 * bossTier` to `state.shares` and `state.lifetimeShares` (`js/floors/td.js:286-291`).
- **Rendering & Lightweight Per-Frame Updates:**
  - Uses a structural render signature `tdComputeRenderSig(state)` stored in `data-td-render-sig` (`js/floors/td.js:311-317, 427`).
  - `updateTDUI(state, containerEl)` checks if `.td-shell` is missing or if `tdComputeRenderSig(state)` changed; if so, it calls `renderTD(state, containerEl)` (`js/floors/td.js:530-540`). Otherwise it updates only text/width/disabled/classes via `[data-td-role="..."]` and `[data-td-action="..."]` selectors (`js/floors/td.js:553-612`).
- **Event Delegation (`bindTDEvents`):** (`js/floors/td.js:615-654`)
  - Uses `containerEl.dataset.tdBound = 'true'` to prevent duplicate listeners.
  - Delegates `click` on `e.target.closest('button')`, ignores disabled buttons, handles `[data-return-desk]` -> `{ type: 'return-desk' }`, and `data-td-action` -> `onAction({ type, ... })`.
- **Action Mutator Helpers:** (`js/floors/td.js:158-232`)
  - Exported pure-ish state mutators returning `boolean` (`tdBuyPad`, `tdPlaceTurret`, `tdUpgradeTurret`, `tdSalvageTurret`, `tdTriggerOvercharge`, `tdToggleAutoWave`, `tdAdvanceWave`), making unit testing in Node straightforward without DOM.

### `js/game.js` Integration Points
- **Imports (`js/game.js:70-82`):** Imports `tickTD`, `renderTD`, `updateTDUI`, `bindTDEvents`, and action mutators from `./floors/td.js`.
- **Floor Unlocking (`buyBoardroomPerk` at `js/game.js:260-286`):**
  - `BOARDROOM_PERKS` already defines `perk_floor_arena` (`js/data.js:420-427`, `cost: 30`, `requires: 'perk_floor_defense'`, `unlockFloor: 'rpg'`).
  - `buyBoardroomPerk` pushes `perk.unlockFloor` into `state.unlockedFloors`, calls `renderFloorSwitcher(state)`, and currently only checks `if (perk.unlockFloor === 'td')` (`js/game.js:272-274`). Needs `else if (perk.unlockFloor === 'rpg') renderRPG(state, el.floorRpg, handlers);`.
- **Offline Progress (`applyOfflineProgress` at `js/game.js:421-443`):**
  - Calls `tickTD(state, offline.elapsedSec * (offline.efficiency || 0.25), bonuses)` when `td` is unlocked (`js/game.js:426-429`).
  - Includes `tdCleared > 0` in the condition to show the offline modal (`js/game.js:430`), and re-renders `td` (`js/game.js:437-439`). Needs equivalent `rpg` offline tick + re-render.
- **Main Loop (`tick` at `js/game.js:558-576`):**
  - Ticks TD whenever `state.unlockedFloors.includes('td')` (`js/game.js:559-571`), even if player is on another floor. On significant events (`wavesCleared > 0`), logs boss memos, plays unlock sound, calls `processAchievements()`, `checkPhasesAndNarrative()`, `renderPrestige()`, `saveState(state)`.
  - Calls `updateTDUI(state, el.floorTd)` only when `state.activeFloor === 'td'` (`js/game.js:574-576`).
- **Action Handler (`handleTDAction` at `js/game.js:587-622`):**
  - Handles `return-desk` via `switchFloor(state, 'desk'); saveState(state);`.
  - Dispatches action types to mutators, plays sound, and if `changed`, calls `renderTD`, `updateDynamicUI`, `saveState`.
- **Event Binding (`bindEvents` at `js/game.js:624-642`):**
  - `bindTDEvents(el.floorTd, () => state, handleTDAction)` (`js/game.js:626`).
  - `el.elevatorBtns` click listener (`js/game.js:632-642`): calls `switchFloor(state, floorId)` and `if (floorId === 'td') renderTD(state, el.floorTd, handlers);`.
- **UI Element Caching (`js/ui.js:50-54`):**
  - `el.floorTd: document.getElementById('floor-td')` is cached, while `#floor-rpg` (`index.html:219`) is **not yet cached** in `el` (`el.floorRpg` needs to be added to `cacheElements()` in `js/ui.js`).

---

## 4. `scripts/build-standalone.mjs` Status

- **Already included!** `MODULE_ORDER` (`scripts/build-standalone.mjs:7-19`) already lists:
  ```js
  'js/floors/td.js',
  'js/floors/rpg.js',
  'js/floors/merge.js',
  'js/game.js'
  ```
  Line `16` is `'js/floors/rpg.js'`, and `build()` skips non-existent files (`if (!fs.existsSync(fullPath)) continue;` at line `219`). Once `js/floors/rpg.js` is created, `node scripts/build-standalone.mjs` will automatically bundle it right after `td.js` and before `game.js` with no script edits required.
- Note: `stripModuleSyntax` strips top-level `import` and `export` statements and wraps all modules in a single IIFE (`scripts/build-standalone.mjs:226`), so top-level symbol names across `td.js` and `rpg.js` must not collide (use `rpg`-prefixed or `RPG_`-prefixed names, matching `td`'s `TD_*` / `td*` convention).
