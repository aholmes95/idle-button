# Explorer 2 Handoff — UI, Styling & Test Infrastructure for Milestone M3 (Floor B2: Security Perimeter)

## 1. `index.html` Findings

- **Elevator / Portal Bar** ([`index.html`](file:///home/antigravity/aholmes95/idle-button/index.html#L35-L63)):
  - `<nav class="elevator-bar is-hidden" id="elevator-bar" aria-label="Facility Floors">` (revealed at `phase >= 1`).
  - `B2: SECURITY` button is `#floor-btn-td` (`data-floor="td"`, starts with `is-locked`, `aria-disabled="true"`, and `<span class="floor-lock">LOCKED</span>`).
  - `1F: DESK` button is `#floor-btn-desk` (`data-floor="desk"`).
- **Floor B2 Container** ([`index.html`](file:///home/antigravity/aholmes95/idle-button/index.html#L209-L217)):
  - `<section class="floor-container is-hidden" id="floor-td" data-floor-panel="td" aria-label="Floor B2: Security Perimeter">`
  - Currently contains a `.floor-placeholder` with badge `B2 // SECURITY PERIMETER`, title, description, and `<button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>`.
  - **Note**: `tests/e2e/tier2/04-floors-boundary-cases.e2e.test.mjs#L109` clicks `#floor-td [data-return-desk]`, so any rendered `#floor-td` dashboard MUST preserve a `[data-return-desk]` button (and if rendered dynamically inside `#floor-td`, either keep a static header with `[data-return-desk]` outside the dynamic mount or re-bind/use event delegation so `[data-return-desk]` always works).
- **Modals** ([`index.html`](file:///home/antigravity/aholmes95/idle-button/index.html#L238-L292)):
  - `#modal-reset` (`#btn-reset-confirm`), `#modal-save` (`#save-export-text`, `#save-import-text`, `#btn-save-import`), `#modal-offline` (`#offline-summary-body`). All use `.modal-backdrop.is-hidden` and `[data-close-modal]`.
- **Script Tag & Standalone Bundling** ([`index.html`](file:///home/antigravity/aholmes95/idle-button/index.html#L294), [`scripts/build-standalone.mjs`](file:///home/antigravity/aholmes95/idle-button/scripts/build-standalone.mjs#L7-L19)):
  - Dev uses `<script type="module" src="js/game.js"></script>`.
  - `scripts/build-standalone.mjs` concatenates modules in `MODULE_ORDER`: `format.js` → `data.js` → `state.js` → `modifiers.js` → `economy.js` → `audio.js` → `ui.js` → `floors/td.js` → `floors/rpg.js` → `floors/merge.js` → `game.js`, stripping `import`/`export` into a single IIFE.
  - **Critical Bundler Constraint**: Because `js/ui.js` appears *before* `js/floors/td.js` in `MODULE_ORDER`, `js/ui.js` MUST NOT evaluate references to `td.js` symbols at top-level module initialization time (calling `renderTD` / `updateTDUI` inside functions in `ui.js` is safe because function declarations are hoisted in the IIFE, OR `game.js` can call `renderTD`/`updateTDUI` directly since `game.js` is last in `MODULE_ORDER`). Also ensure no top-level identifier collisions between `td.js` and other modules inside the shared IIFE scope.

---

## 2. `styles.css` Findings

- **Design Tokens** ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L1-L40)):
  - `:root`: `--bg-void: #0f1115`, `--bg-surface: #171a20`, `--bg-elevated: #1f242c`, `--border-hairline: #2a303a`, `--border-strong: #39424f`, `--text-primary: #edf0f4`, `--text-secondary: #98a2b0`, `--text-muted: #636d7a`, `--accent: #f0a43a`, `--accent-dim`, `--accent-glow`, `--good: #4ecb71`, `--good-dim`, `--info: #4da3ff`, `--info-dim`, `--danger: #e05252`, `--danger-dim`, `--font-sans`, `--font-mono`, `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 18px`.
  - `body.is-sinister` ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L31-L40)): shifts background tokens darker (`#0b0a0c` / `#131115` / `#1b181f`) and flips `--accent` to `#e05252` (crimson). Using CSS variables (`var(--accent)`, `var(--bg-surface)`, `var(--bg-elevated)`, `var(--border-hairline)`) ensures `#floor-td` automatically adapts to `body.is-sinister` without duplicate theme overrides.
- **Reusable Card, Button & Progress Bar Classes**:
  - `.floor-container` ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L931-L934)): `width: 100%; animation: fadeIn 0.25s ease-out;`
  - `.panel-toolbar`, `.toolbar-title`, `.toolbar-meta` ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L576-L591))
  - `.card-head`, `.card-badge` (`is-accent`, `is-info`, `is-good`, `is-danger`) ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L612-L637))
  - `.gen-bar-track`, `.gen-bar-fill` ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L697-L716)): 10px pill track + gradient fill (automatically turns crimson under `body.is-sinister`).
  - `.btn-buy` + `.can-afford`, `.icon-btn`, `.btn-accent`, `.btn-danger` ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L134-L150), [`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L731-L753), [`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L1050-L1072)).
- **Responsive Rules** ([`styles.css`](file:///home/antigravity/aholmes95/idle-button/styles.css#L1200-L1205)):
  - `@media (max-width: 860px)` collapses `.workspace.has-console` to `1fr`, unsticks `.left-column`, and wraps `.top-bar`. New TD grids (e.g. 2-column dashboard or 4-column turret pad grid) should stack cleanly to `1fr` / `repeat(2, 1fr)` under `@media (max-width: 860px)`.

---

## 3. `js/ui.js` & `js/game.js` Findings

- **DOM Caching (`cacheElements()`)** ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L36-L124)):
  - Caches `elevatorBar`, `elevatorBtns`, `floorPanels` (`[data-floor-panel]`), `returnDeskBtns` (`[data-return-desk]`), etc. Add `floorTd: document.getElementById('floor-td')` to `el`.
- **Floor Switching & Visibility**:
  - `renderFloorSwitcher(state)` ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L175-L198)): toggles `.active`, `.is-locked`, `aria-disabled`, `.floor-lock.is-hidden`, and `title` using `state.unlockedFloors` and `FLOORS`.
  - `switchFloor(state, floorId)` ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L200-L215)): verifies `unlocked.includes(floorId)`, sets `state.activeFloor = floorId`, toggles `#workspace.is-hidden` (`floorId !== 'desk'`), toggles `[data-floor-panel]` visibility, and calls `renderFloorSwitcher(state)`.
  - `renderVisibility(state)` ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L217-L263)): calls `switchTab(state, state.activeTab)` and `switchFloor(state, state.activeFloor || 'desk')`.
- **Render & Frame Loop**:
  - `renderAll(state, handlers)` ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L614-L624)): full structural re-render on boot, restructure, reset, and save import.
  - `updateDynamicUI(state)` ([`js/ui.js`](file:///home/antigravity/aholmes95/idle-button/js/ui.js#L626-L714)): runs every `requestAnimationFrame` in `tick()` ([`js/game.js`](file:///home/antigravity/aholmes95/idle-button/js/game.js#L524)). Lightweight DOM updates only (textContent, widths, disabled states).
  - Event delegation pattern: `bindEvents()` in `js/game.js` ([`js/game.js`](file:///home/antigravity/aholmes95/idle-button/js/game.js#L535-L648)) binds static listeners once at boot. Floor modules should bind delegated click listeners once on `#floor-td` via `bindTDEvents(containerEl, getState, onAction)`.

---

## 4. `tests/` & `TEST_INFRA.md` Findings

- **Unit Tests (`node --test`)**:
  - `tests/core_m1.test.js` (14 tests) and `tests/balance_m2.test.js` (9 tests) — all 23 currently pass in ~210ms.
  - Pure Node ES-module tests importing directly from `../js/*.js` with `node:test` and `node:assert/strict`.
- **Headless Chromium E2E Infrastructure** (`TEST_INFRA.md`, `tests/e2e/helpers/`):
  - Zero-dependency CDP harness (`tests/e2e/helpers/{server,cdp,harness,fixtures}.mjs`) using `python3 -u -m http.server 0` and `/usr/bin/chromium`.
  - Runs via `node --test tests/e2e/...`. Asserts 0 console errors and 0 page errors (`h.assertNoErrors()`), and tests both `index.html` and standalone `idle_button.html`.
- **Existing E2E Contracts Already Written for Floor B2 (`#floor-td`)** — **MUST BE SATISFIED**:
  1. [`tests/e2e/tier1/07-floor-b2-td.e2e.test.mjs`](file:///home/antigravity/aholmes95/idle-button/tests/e2e/tier1/07-floor-b2-td.e2e.test.mjs):
     - `#floor-btn-td` switches to `#floor-td` and hides `#workspace`.
     - Loop over `['laser', 'slow', 'cannon', 'tesla']`: clicks `#floor-td [data-td-action="buy-pad"]` followed immediately by `#floor-td [data-td-turret-type="${turretType}"]`, expecting `save.td.turrets.length >= 4`.
       - **Implication**: Clicking `[data-td-action="buy-pad"]` must unlock/add a pad (and auto-select or target the next empty pad), and `[data-td-turret-type="laser|slow|cannon|tesla"]` must be immediately clickable build buttons that place the turret onto the selected/first empty pad!
     - `#floor-td [data-td-action="upgrade-turret"][data-turret-idx="0"]`: upgrades `td.turrets[0].level` from 1 → 2 and deducts `td.scrap`.
     - Wave progression: with `wave: 5, highestWave: 4, waveProgress: 0.9` and 2 level-5 turrets, clears wave 5 within 10s, increments `td.highestWave >= 5`, and grants `td.scrap > 0`.
     - `#floor-td [data-td-action="overcharge"]`: spends `$` and sets `td.overcharge > 0`.
     - Advancing `td.highestWave` increases `#rate-money` on `1F: DESK`.
  2. [`tests/e2e/tier2/01-economy-and-formatting-boundaries.e2e.test.mjs#L55-L71`](file:///home/antigravity/aholmes95/idle-button/tests/e2e/tier2/01-economy-and-formatting-boundaries.e2e.test.mjs#L55-L71):
     - When `money: 0`, `#floor-td [data-td-action="overcharge"].disabled === true`.
  3. [`tests/e2e/tier2/04-floors-boundary-cases.e2e.test.mjs#L50-L73`](file:///home/antigravity/aholmes95/idle-button/tests/e2e/tier2/04-floors-boundary-cases.e2e.test.mjs#L50-L73):
     - When `td.scrap: 0`, `#floor-td [data-td-action="upgrade-turret"][data-turret-idx="0"].disabled === true`.
     - `#floor-td [data-return-desk]` returns to `#workspace` and hides `#floor-td`.
  4. [`tests/e2e/tier3/02-cross-floor-buff-synergies.e2e.test.mjs#L7-L36`](file:///home/antigravity/aholmes95/idle-button/tests/e2e/tier3/02-cross-floor-buff-synergies.e2e.test.mjs#L7-L36):
     - `td.highestWave: 20` vs `0` increases `#rate-money` on `1F: DESK`.
  5. [`tests/e2e/tier4/02-multi-prestige-all-floors-persistence.e2e.test.mjs#L38-L39`](file:///home/antigravity/aholmes95/idle-button/tests/e2e/tier4/02-multi-prestige-all-floors-persistence.e2e.test.mjs#L38-L39):
     - Clicks `#floor-td [data-td-action="buy-pad"]` then `#floor-td [data-td-turret-type="laser"]`, and verifies `td.turrets.length >= 1` survives Export/Import.

---

## 5. Concrete Design Recommendations

### A. `#floor-td` Layout & DOM Structure
Replace the placeholder inside `#floor-td` (or have `renderTD` populate `#floor-td` while preserving `[data-return-desk]`):
1. **Header Strip (`.td-header`)**:
   - Badge `B2 // SECURITY PERIMETER`, title `Containment Perimeter`, Cross-Floor Integrity pill (`+${pct}% $/s & RP/s`), and `<button class="icon-btn mono" type="button" data-return-desk>RETURN TO 1F: DESK</button>`.
2. **Telemetry & Controls Bar (`.td-telemetry`)**:
   - Wave counter (`WAVE N` + `BOSS` badge every 5th wave), Highest Wave (`BEST: N`), Security Scrap (`td.scrap`), Total Perimeter DPS, and Active Overcharge indicator.
   - Controls:
     - `data-td-action="buy-pad"` (`BUY PAD ($...)`, disabled if at max pads or `money < padCost`).
     - `data-td-action="overcharge"` (`OVERCHARGE ($...)`, disabled if `money < overchargeCost` or already active).
     - `data-td-action="toggle-auto"` (`AUTO-WAVE: ON/OFF`).
3. **Perimeter Threat Lane / Radar (`.td-lane`)**:
   - Enemy label (`Regulators`, `Auditors`, `Unionizers`, `Whistleblowers`, `Rogue AI [BOSS]`), HP / Wave Progress bar (`.gen-bar-track` > `.gen-bar-fill` with `data-td-role="wave-bar"`), and threat distance/slow status.
4. **Main 2-Column TD Grid (`.td-grid`)**:
   - **Left: Turret Pads Grid (`.td-pads-grid`)**: renders unlocked pads (`0..pads-1`) as cards. Occupied pads show turret name, level, DPS, and `<button data-td-action="upgrade-turret" data-turret-idx="${idx}">UPGRADE (${scrapCost} SCRAP)</button>` (plus optional sell/reconfigure). Empty pads show `EMPTY PAD #${idx + 1}` and can be clicked to select (`data-td-action="select-pad" data-pad-idx="${idx}"`).
   - **Right: Turret Armory / Build Palette (`.td-armory`)**: 4 cards/buttons for `laser`, `slow`, `cannon`, `tesla` with `data-td-turret-type="laser|slow|cannon|tesla"`, showing base DPS/effect and Scrap cost (first pad or placement can be free or low scrap cost so `07-floor-b2-td.e2e.test.mjs` test #2 succeeds immediately after buying a pad with `scrap: 0`!).
     - **Important**: In `07-floor-b2-td.e2e.test.mjs` test #2, `seed` has `td.scrap: 0` and `money: 1e7`, buys 4 pads, and places all 4 turret types (`laser`, `slow`, `cannon`, `tesla`)! Therefore, **placing a base Lv.1 turret on an empty pad MUST either cost `0` Scrap (or cost `$` / be included in the pad cost), while upgrading (`Lv.1 -> Lv.2+`) costs `td.scrap`!** Make sure `buy-pad` + `[data-td-turret-type]` works seamlessly with `scrap: 0`.

### B. `js/ui.js` & `js/game.js` Hooks
- In `js/ui.js`:
  - Add `floorTd: document.getElementById('floor-td')` in `cacheElements()`.
  - Keep `switchFloor(state, floorId)` returning `true` when switched; `game.js` can call `renderTD(state, tdHandlers)` when switching to `'td'` or in `renderAll`.
  - Or `ui.js` can export `el` and `game.js` calls `renderTD(state, handlers)` in `renderAll` wrapper / `switchFloor` callback and `updateTDUI(state, el.floorTd)` inside `tick()` when `state.activeFloor === 'td'`. Calling `td.js` from `game.js` avoids any `build-standalone.mjs` ordering issues since `game.js` is last in `MODULE_ORDER`!
- In `js/game.js`:
  - Call `bindTDEvents(el.floorTd, () => state, onTDAction)` once in `bindEvents()`.
  - In `tick(now)`: call `tickTD(state, dt, bonuses)` whenever `state.unlockedFloors.includes('td')` (even when on `1F: DESK`, so waves progress in the background), and call `updateTDUI(state, el.floorTd)` when `state.activeFloor === 'td'`.
  - When `tickTD` triggers a Boss clear or structural change (new wave/boss reward/scrap milestone), save state / refresh `renderTD` if active, and update `updateDynamicUI(state)` so `#rate-money` and `#rate-rp` reflect Containment Integrity immediately.
  - In `applyOfflineProgress()`: optionally step `tickTD` or grant offline TD wave/scrap progress safely.

### C. `styles.css` Additions
- Add `.td-shell`, `.td-header`, `.td-telemetry`, `.td-lane`, `.td-grid` (`grid-template-columns: 1.35fr 1fr; gap: 16px`), `.td-pads-grid` (`repeat(auto-fill, minmax(190px, 1fr))`), `.td-pad-card` (`.is-empty`, `.is-selected`, `.is-occupied`), `.td-armory-list`, and `.td-overcharge-active` glow using existing `--bg-surface`, `--bg-elevated`, `--border-hairline`, `--accent`, `--info`, `--good`, `--danger`.
- Under `@media (max-width: 860px)`: collapse `.td-grid` to `1fr` and `.td-telemetry` to `repeat(2, 1fr)`.

### D. `tests/floor_td_m3.test.js` & Chromium Verification
- **Unit tests (`tests/floor_td_m3.test.js`)**:
  - Test `tickTD(state, dt, bonuses)` deterministic wave clearing, Boss every 5 waves, Scrap gain, Overcharge decay & multiplier, Auto-Wave toggle, NDA Slow-Field effect, and `highestWave` progression.
  - Test pad purchase, placing all 4 turret types (`laser`, `slow`, `cannon`, `tesla`), upgrading with `scrap` (and rejection when `scrap < cost`).
  - Test `getCrossFloorBonuses(state)` Containment Integrity (`moneyMult`, `rpMult`) scaling with `td.highestWave`, Boss Intel (`rpg.intel`) & milestone Shares, and `doRestructure()` resetting run-level TD fields while preserving `highestWave`.
- **Chromium E2E verification**:
  - Run `node --test tests/core_m1.test.js tests/balance_m2.test.js tests/floor_td_m3.test.js`
  - Run `node scripts/build-standalone.mjs`
  - Run `node --test tests/e2e/baseline-smoke.e2e.test.mjs tests/e2e/tier1/07-floor-b2-td.e2e.test.mjs tests/e2e/tier2/01-economy-and-formatting-boundaries.e2e.test.mjs tests/e2e/tier2/04-floors-boundary-cases.e2e.test.mjs tests/e2e/tier3/02-cross-floor-buff-synergies.e2e.test.mjs`
