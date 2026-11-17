# Explorer 3 Handoff Report: New Floors Architecture & Test Environment

**Summary**: `idle-button` uses a vanilla ES-module architecture where `js/game.js` (870 lines) handles both simulation math and DOM updates inside a `requestAnimationFrame` loop (`dt` capped at 1s, no offline catch-up). To add the 3 new ButtonCorp™ Floors (Idle Tower Defense, RPG Auto-Battler, Merge Forge) cleanly, we should introduce a Floor/Portal switcher, extract a pure `js/modifiers.js` cross-floor bonus registry, and isolate each floor in `js/floors/{td,rpg,merge}.js`. For testing, Node `v24.22.2` (`node:test` + native ESM), Python `3.11.2` (`http.server`), and headless Chromium `156.0.8078.79` are available locally, though Playwright/Puppeteer are not pre-installed.

---

## 1. Observation

### 1.1 Views, Tabs, and Unlocks (`index.html`, `styles.css`, `js/state.js`, `js/game.js`)
- **DOM Structure (`index.html`)**:
  - `index.html:141` loads `<script type="module" src="js/game.js"></script>`.
  - `index.html:16-32` defines `#top-bar.is-hidden` (brand cluster, `#pill-rp`, `#pill-shares`, audio/reset buttons).
  - `index.html:35-138` defines `main.workspace` with two columns:
    - Left (`section.left-column`, lines 37-75): `#currency-value`, `#main-button`, `#abilities-bar.is-hidden`, `#memo-box.is-hidden`.
    - Right (`section.right-column.is-hidden`, lines 78-137): `<nav class="tab-bar" role="tablist">` with 4 `.tab-btn` buttons (`operations`, `upgrades`, `research`, `prestige`) and 4 `.tab-panel` containers (`#panel-operations`, `#panel-upgrades`, `#panel-research`, `#panel-prestige`).
- **CSS Visibility & Layout (`styles.css`)**:
  - `styles.css:61`: `.is-hidden { display: none !important; }`.
  - `styles.css:153-166`: `.workspace` is 1-column until `.workspace.has-console` switches it to `grid-template-columns: minmax(300px, 380px) 1fr` (collapses to `1fr` below `860px` at `styles.css:737-739`).
  - `styles.css:452-453`: `.tab-panel { display: none; padding: 16px; } .tab-panel.active { display: block; }`.
  - `styles.css:31-40`: `body.is-sinister` overrides CSS custom properties for the late-game palette shift.
- **State Persistence (`js/state.js`)**:
  - `js/state.js:1`: `SAVE_KEY = 'idle_button_v2_save'`.
  - `js/state.js:3-38`: `createInitialState(preserved = {})` initializes flat run state (`money`, `totalMoneyRun`, `rp`, `presses`, `phase`, `activeTab`, `generators`, `upgrades`, `completedResearch`, `activeResearch`, `abilities`, `triggeredBeats`, `memos`, `lastTick`) and preserved prestige fields (`shares`, `restructures`, `totalMoneyAllTime`, `sinisterRevealed`, `soundEnabled`).
  - `js/state.js:40-58`: `loadState()` spreads `createInitialState()` with parsed JSON and explicitly defaults nested objects/arrays.
- **Unlock & Tab Logic (`js/game.js`)**:
  - `js/game.js:46`: `el.tabBtns = document.querySelectorAll('.tab-btn')` (cached once at module load).
  - `js/game.js:216-244`: `checkPhasesAndNarrative()` advances `state.phase` (`0 -> 1` at `presses >= 5`, `1 -> 2` at `totalMoneyRun >= 25`, `2 -> 3` at `totalMoneyRun >= 200`, `3 -> 4` + `sinisterRevealed = true` at `hasResearch('res_compliance')`), checks `NARRATIVE_BEATS`, and re-renders panels on change.
  - `js/game.js:376-386`: `switchTab(tabName)` updates `state.activeTab` and toggles `.active` on `el.tabBtns` and `.tab-panel`.
  - `js/game.js:388-429`: `renderVisibility()` toggles `.is-hidden` on `#top-bar`, `#right-column`, tab buttons, RP/Shares pills, `#abilities-bar`, and calls `switchTab(state.activeTab)`.

### 1.2 Main Tick Loop (`js/game.js:727-804`)
- `tick(now)` is driven by `requestAnimationFrame(tick)` (`js/game.js:803, 869`).
- `js/game.js:728`: `const dt = Math.min((now - lastFrame) / 1000, 1);` (caps delta at 1 second; `state.lastTick` is saved on `beforeunload` and every 5s, but not currently used for offline progress on boot).
- Inside `tick(now)`:
  1. Ticks `state.abilities` (`activeRemaining`, `cooldownRemaining`) — lines 732-742.
  2. Ticks `GENERATORS` cycle progress, payouts, and RP — lines 744-771.
  3. Ticks `state.activeResearch` elapsed time and completion — lines 773-789.
  4. Calls `checkPhasesAndNarrative()` if a cycle completed or ability expired — lines 791-793.
  5. Calls `updateDynamicUI()` every frame — line 795.
  6. Auto-saves every 5000ms — lines 797-801.

### 1.3 Local Environment Checks
Commands run in `/home/antigravity/aholmes95/idle-button`:
- `git status`: `On branch main`, `Your branch is up to date with 'origin/main'`, untracked `.agents/` only.
- `node -v`: `v24.22.2` (`node:test` built-in test runner verified: `typeof require('node:test') === 'function'`; native ESM import of `./js/state.js` verified: `ESM state ok, phase: 0`).
- `npm -v`: `11.21.2`; `/usr/local/bin/npx` present.
- `npm list -g --depth=0`: `chrome-devtools-mcp@1.10.1`, `corepack@0.36.0`, `npm@11.21.2`.
- `python3 --version`: `Python 3.11.2` (`python3 -m http.server` available).
- `which chromium chromium-browser google-chrome firefox playwright npx`:
  - `/usr/bin/chromium` (`Chromium 156.0.8078.79 built on Debian GNU/Linux 12 (bookworm)`)
  - `/usr/bin/google-chrome` (`Chromium 156.0.8078.79 built on Debian GNU/Linux 12 (bookworm)`)
  - `playwright` not found in PATH; `python3 -c "import playwright"` raised `ModuleNotFoundError: No module named 'playwright'`.
- `chromium --headless --no-sandbox --disable-gpu --dump-dom about:blank`: executed and launched Chromium 156 headless successfully.

---

## 2. Logic Chain

1. **Why `game.js` cannot host the 3 new floors directly**: `js/game.js` is already 870 lines combining multiplier math, tick simulation, DOM caching, and panel rendering. Adding 3 full mini-games (TD, RPG, Merge) to `game.js` would create tight coupling and bloat.
2. **Why a Floor/Portal switcher + `js/floors/*` + `js/modifiers.js` is optimal**:
   - Currently `right-column` has 4 tabs (`operations`, `upgrades`, `research`, `prestige`). Adding 3 more tabs directly into `.tab-bar` crowds the console, whereas a **Floor/Portal Selector** (e.g., Floor 1: Executive Desk, Floor B2: Security Perimeter [TD], Floor B4: Field Ops [RPG], Floor B6: Synthesis Forge [Merge]) keeps the main Button + Console intact on Floor 1 and gives each new game mode a dedicated workspace when selected.
   - Extracting `js/modifiers.js` as a pure-function aggregator (`getCrossFloorBonuses(state)`) breaks circular dependencies: `td.js`, `rpg.js`, `merge.js`, and `game.js` only read from `state` and `modifiers.js`, never importing each other directly.
   - Running `tickTD(state, dt, bonuses)`, `tickRPG(state, dt, bonuses)`, and `tickMerge(state, dt, bonuses)` inside `tick(now)` ensures all unlocked floors progress in the background, while `updateDynamicUI()` only updates DOM for `state.activeFloor`.
3. **Why deterministic math-based simulation matters for TD/RPG/Merge**: `tick(now)` caps `dt` at 1s, and if offline catch-up is added via `state.lastTick`, pure math-based wave/combat/spawner resolution (rather than frame-dependent canvas physics) allows instant offline/background simulation and trivial unit testing in Node `v24.22.2`.
4. **Why `node:test` + `python3 -m http.server` + Chromium 156 fits the environment**: Native ESM + `node:test` requires zero installs to test state, prestige scaling, and floor math. For E2E browser tests, `python3 -m http.server` serves ES modules cleanly (avoiding `file://` CORS blocks), and `/usr/bin/chromium` (v156) can be driven headless via CDP or `playwright-core` / `puppeteer-core` if installed as a devDependency.

---

## 3. Caveats

- **Standalone Artifact Sync**: Per `ORIGINAL_REQUEST.md:16`, `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` is a standalone HTML artifact. If ES modules are split into `js/floors/*.js`, any build/sync step for `idle_button.html` must inline or bundle those new modules as well.
- **DOM Caching at Boot**: `js/game.js:46` caches `el.tabBtns` once at startup. If floor/portal buttons or dynamic tabs are added, ensure they are either present in static `index.html` at boot or bound via event delegation.
- **No Pre-installed Playwright/Puppeteer**: While Chromium 156 is installed, neither `playwright` nor `puppeteer` is pre-installed globally or in Python. E2E automation will need either `playwright-core` / `puppeteer-core` pointing at `/usr/bin/chromium`, or a small Node WebSocket CDP script, or `chrome-devtools-mcp`.

---

## 4. Conclusion: Proposed Architecture for the 3 New Floors

### 4.1 Modular File Structure
```text
index.html              # Add Floor/Portal nav bar + #floor-td, #floor-rpg, #floor-merge containers
styles.css              # Floor switcher, TD grid, RPG arena/loot, Merge grid styles
js/
├── state.js            # Add state.activeFloor, state.floorsUnlocked, state.td, state.rpg, state.merge + v2->v3 migration
├── data.js             # Core generators/upgrades/research + floor unlock thresholds
├── modifiers.js        # NEW: Pure cross-floor bonus aggregator getCrossFloorBonuses(state)
├── audio.js            # Existing WebAudio synth (add optional combat/merge/wave cues)
├── game.js             # Core orchestrator: boot, rAF tick() calling core + floors, floor switching
└── floors/
    ├── td.js           # NEW: Floor A (Security Perimeter — Idle Tower Defense)
    ├── rpg.js          # NEW: Floor B (Field Ops — RPG Auto-Battler & Loot)
    └── merge.js        # NEW: Floor C (Synthesis Forge — Merge Grid & Catalysts)
```

### 4.2 Progressive Unlock & Floor Navigation
- **Floor 1 (`desk`)**: Existing 2-column Button + Operations/Upgrades/R&D/Restructure console. Always unlocked.
- **Floor A (`td` — Sub-Level B2: Security Perimeter)**: Unlocks mid-run (e.g., `state.phase >= 3` and `totalMoneyRun >= 2500` or completing Research `res_perimeter`).
- **Floor B (`rpg` — Sub-Level B4: Field Ops)**: Unlocks after `td.highestWave >= 5` or `restructures >= 1` + Research `res_field_ops`.
- **Floor C (`merge` — Sub-Level B6: Synthesis Forge)**: Unlocks after `rpg.highestSector >= 2` or Research `res_synthesis`.
- **UI Switching**: Add a compact **Facility Elevator / Portal Bar** inside `#top-bar` (or immediately below it) with buttons `[1F: DESK]`, `[B2: SECURITY]`, `[B4: FIELD OPS]`, `[B6: FORGE]`. Selecting a floor toggles `.active` on `#floor-<id>` and sets `state.activeFloor`.

### 4.3 Floor Designs & Cross-Floor Resource/Buff Loops

| Floor / Portal | Core Loop & Mechanics | Inputs (From Other Floors) | Outputs (To Other Floors & Prestige) |
| :--- | :--- | :--- | :--- |
| **A: Security Perimeter** (`js/floors/td.js`) | 6–8 turret pads defending the Conduit against waves of *Regulators, Auditors, Unionizers, Whistleblowers, Rogue AIs*. Turrets (*Redaction Laser, NDA Slow-Field, Shredder Cannon, Compliance Tesla*) level up with **Security Scrap**. Auto-wave advance + Boss every 5 waves. Pure DPS-vs-HP tick math supports background/offline clearing. | **Core `$`**: Buy extra turret slots & emergency overcharges.<br>**RPG**: Artifacts boost Turret DMG/Crit.<br>**Merge**: Catalysts boost fire rate. | **Containment Integrity** (`highestWave` milestone): Passive **Global `$/sec` & `RP/sec` multiplier**.<br>**Boss Drops**: Grants **Intel** (for RPG) & rare **Shares** milestones. |
| **B: Field Ops / Sectors** (`js/floors/rpg.js`) | Auto-battler squad (1–3 corporate operatives) clearing 10-stage Sectors with Sector Bosses. Stats: `ATK, HP, DEF, SPD` upgraded with **Bounty Credits**. Enemies/Bosses drop **Containment Artifacts** (equip slots + salvage into **Upgrade Shards**). | **Core R&D**: Unlocks 2nd/3rd squad slots.<br>**TD**: Security Scrap / Integrity boosts Squad DEF.<br>**Merge**: Catalysts amplify Artifact stats. | **Equipped Artifacts**: Direct multipliers to **Click Power**, **Turret DMG**, and **RP/sec**.<br>**Sector Clears**: Unlocks Merge tier caps & boosts **Share potency**. |
| **C: Synthesis Forge** (`js/floors/merge.js`) | 4×4 (expandable to 5×4) grid. **Actuator Cores** auto-spawn on a timer (or instant-buy with `$`). Click-to-select or drag-to-merge matching Tiers (`T1 + T1 -> T2`, up to `T10+`). Upgradable spawn rate, base tier, and late-game **Auto-Merge** toggle. | **Core `$ / RP`**: Upgrades spawner speed & starting tier.<br>**TD/RPG Bosses**: Drop **Catalyst Cells** that spawn high-tier cores directly. | **Grid Aura**: Each active core on the grid grants passive `% $/sec`, `% TD DMG`, or `% RPG ATK`.<br>**Peak Tier Milestones**: Unlocks permanent **Forge Catalysts** persisting across Restructure. |

### 4.4 Prestige (`Restructure`) Integration
- `doRestructure()` in `js/game.js:351-374` should:
  - Reset run-level progress (`money`, `generators`, `upgrades`, `td.wave`, `td.turrets`, `rpg.stage`, `merge.grid`).
  - **Preserve** permanent cross-floor meta-progression: `shares`, `restructures`, unlocked floor flags (`floorsUnlocked`), `rpg.artifacts` (or unlocked artifact blueprints), and `merge.peakTierCatalysts`.
  - Apply `shares` bonus across **all** floors (e.g., `+25% $/sec`, `+10% TD DMG`, `+10% RPG Stats`, `+5% Merge Speed` per Share), giving the player a strong reason to prestige.

### 4.5 Recommended Test Strategy for This Environment
1. **Unit & Simulation Tests (`node --test`)**: Write ESM tests in `tests/*.test.js` importing `js/state.js`, `js/modifiers.js`, and pure tick functions from `js/floors/*.js` to verify multiplier stacking, wave clearing, combat math, merge transitions, and prestige reset preservation.
2. **E2E Browser Tests**: Serve the repo via `python3 -m http.server 4173` and drive `/usr/bin/chromium --headless --no-sandbox --disable-gpu` (via `playwright-core` / `puppeteer-core` or raw Node CDP) to verify floor unlocks, tab/floor switching, `localStorage` persistence, and zero console errors.

---

## 5. Verification Method

To independently verify all claims in this report:
1. **Inspect source structure**:
   - `index.html:16-141` (tabs, hidden sections, module script)
   - `styles.css:31-40, 61, 153-166, 452-453` (sinister theme, `.is-hidden`, `.workspace.has-console`, `.tab-panel.active`)
   - `js/state.js:1-75` (`SAVE_KEY`, `createInitialState`, `loadState`)
   - `js/game.js:46, 216-244, 351-429, 727-804` (`el.tabBtns`, `checkPhasesAndNarrative`, `doRestructure`, `switchTab`, `renderVisibility`, `tick`)
2. **Verify local test environment**:
   ```bash
   cd /home/antigravity/aholmes95/idle-button
   git status
   node -v
   node --input-type=module -e "import { createInitialState } from './js/state.js'; console.log(createInitialState().phase);"
   python3 --version
   chromium --headless --no-sandbox --disable-gpu --dump-dom about:blank
   ```
3. **Invalidation conditions**: Any refactor that switches to a bundler (Vite/Webpack) or upgrades `SAVE_KEY` beyond `idle_button_v2_save` will change the exact line references above.
