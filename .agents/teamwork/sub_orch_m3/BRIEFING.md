# Milestone M3 Briefing: Floor B2 — Security Perimeter (Idle Tower Defense)

## Goal
Implement **Floor B2: Security Perimeter** (`js/floors/td.js`), integrate it into the core game loop (`js/game.js`, `js/ui.js`, `js/state.js`, `js/data.js`, `js/modifiers.js`), build its UI & styling (`index.html`, `styles.css`), add comprehensive unit tests (`tests/floor_td_m3.test.js`), sync the standalone artifact (`scripts/build-standalone.mjs`), and verify both `index.html` and `idle_button.html` in headless Chromium.

## Key Requirements
1. **Floor Module (`js/floors/td.js`)**:
   - Export `tickTD(state, dt, bonuses)`, `renderTD(state, containerEl, handlers)`, `updateTDUI(state, containerEl)`, `bindTDEvents(containerEl, getState, onAction)` per `PROJECT.md § Interface Contracts`.
   - 6–8 turret pads defending the ButtonCorp™ Reactor / Conduit against waves of Regulators, Auditors, Unionizers, Whistleblowers, and Rogue AIs (with a Boss every 5 waves).
   - 4 deployable & upgradable turret types:
     - **Redaction Laser** (high single-target DPS)
     - **NDA Slow-Field** (slows wave advance / amplifies damage taken)
     - **Shredder Cannon** (AoE / splash DPS)
     - **Compliance Tesla** (chain/burst DPS)
   - Currencies & controls:
     - **Security Scrap** (`state.td.scrap`): earned from killing enemies/waves, spent to build/upgrade turrets.
     - Core `$` integration: buy extra turret pad slots & trigger emergency **Perimeter Overcharge**.
     - **Auto-Wave Advance** toggle.
     - Deterministic DPS-vs-HP tick math so waves clear smoothly in the background and during offline catch-up.
2. **Unlocking Floor B2**:
   - Unlockable via Boardroom Perk `perk_floor_defense`, AND also via R&D project or phase/money milestone if desired (ensure `state.unlockedFloors` includes `'td'` cleanly when unlocked, and `renderVisibility` enables the `B2: SECURITY` elevator button).
3. **Cross-Floor Loops (`js/modifiers.js`, `js/game.js`, `js/state.js`, `js/ui.js`)**:
   - **Outputs**: `highestWave` -> **Containment Integrity** passive global `$/sec` & `RP/sec` multiplier in `getCrossFloorBonuses(state)`; Boss wave clears grant **Intel** (`state.rpg.intel`) and milestone **Executive Shares** (first time clearing wave 5, 10, 15, 20, etc.).
   - **Inputs**: Reads `bonuses.tdDamageMult`, `bonuses.tdFireRateMult`, `bonuses.tdScrapMult` from `getCrossFloorBonuses(state)`.
   - **Restructure Integration**: On `doRestructure()`, reset run-level `td.wave`, `td.waveProgress`, `td.turrets` (while preserving `td.highestWave`, unlocked pad count/blueprints or milestone flags cleanly).
4. **UI & Visuals (`index.html`, `styles.css`, `js/floors/td.js`)**:
   - Atmospheric **Security Perimeter** dashboard inside `#floor-td`: Perimeter Integrity / Wave / Boss HP bar, visual lane/radar of incoming threats & active turret pads, Turret Build/Upgrade cards, Overcharge & Auto-Wave controls, Cross-Floor Integrity Bonus summary.
   - Clean in both default and `body.is-sinister` themes, desktop and mobile (`@media (max-width: 860px)`).
5. **Tests & Standalone Sync**:
   - `tests/floor_td_m3.test.js` (`node --test`).
   - `node scripts/build-standalone.mjs` to sync `idle_button.html`.
   - Headless Chromium verification on both `index.html` and `idle_button.html` with 0 console/page errors.
