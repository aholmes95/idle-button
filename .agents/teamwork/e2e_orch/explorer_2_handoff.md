# Explorer 2 Handoff: 4-Tier Opaque-Box E2E Test Suite Design & Baseline Smoke Spec

**Target Suite Location**: `/home/antigravity/aholmes95/idle-button/tests/e2e/`  
**Runner**: `node --test` (Node `v24.22.2` native ESM + `node:assert/strict`)  
**Browser Driver**: Zero-dependency Node WebSocket CDP client (`tests/e2e/helpers/cdp.mjs`) driving `/usr/bin/chromium` (Chromium `156.0.8078.79`, `--headless --no-sandbox --disable-gpu --remote-debugging-port=0`) against `python3 -m http.server` (or `node` static server) for dev mode, plus `file://` / local HTTP serving for standalone `idle_button.html`.

---

## 1. Suite Directory Layout & Helpers

```text
/home/antigravity/aholmes95/idle-button/tests/e2e/
├── helpers/
│   ├── server.mjs               # Ephemeral HTTP static server (port 0) serving repo root & standalone artifact
│   ├── cdp.mjs                  # Raw WebSocket CDP client + Chromium launcher (launchBrowser, newPage, click, type, eval, waitForSelector, getConsoleErrors)
│   └── fixtures.mjs             # Opaque-box localStorage seed builders (v2 save, v3 mid-run, v3 post-restructure, v3 late-game) & time-advance helpers
├── baseline-smoke.e2e.test.mjs  # Immediate v0.2 baseline + standalone idle_button.html smoke suite
├── tier1/
│   ├── 01-button-and-phases.e2e.test.mjs
│   ├── 02-generators-managers-buymode.e2e.test.mjs
│   ├── 03-upgrades-and-drawer.e2e.test.mjs
│   ├── 04-research-and-protocols.e2e.test.mjs
│   ├── 05-restructure-and-boardroom.e2e.test.mjs
│   ├── 06-achievements-and-anomalies.e2e.test.mjs
│   ├── 07-floor-b2-td.e2e.test.mjs
│   ├── 08-floor-b4-rpg.e2e.test.mjs
│   ├── 09-floor-b6-merge.e2e.test.mjs
│   ├── 10-persistence-audio-modals.e2e.test.mjs
│   └── 11-standalone-parity.e2e.test.mjs
├── tier2/
│   ├── 01-economy-and-formatting-boundaries.e2e.test.mjs
│   ├── 02-save-migration-and-import-boundaries.e2e.test.mjs
│   ├── 03-prestige-and-unlock-boundaries.e2e.test.mjs
│   ├── 04-floors-boundary-cases.e2e.test.mjs
│   └── 05-ui-modal-and-rapid-input-boundaries.e2e.test.mjs
├── tier3/
│   ├── 01-prestige-boardroom-floor-unlocks.e2e.test.mjs
│   ├── 02-cross-floor-buff-synergies.e2e.test.mjs
│   ├── 03-sinister-theme-and-anomalies.e2e.test.mjs
│   └── 04-upgrades-milestones-protocols.e2e.test.mjs
└── tier4/
    ├── 01-run0-to-restructure1-playthrough.e2e.test.mjs
    └── 02-multi-prestige-all-floors-persistence.e2e.test.mjs
```

### Opaque-Box Principles
- **No internal module imports** (`js/economy.js`, `js/modifiers.js`, etc. are NEVER imported by E2E tests).
- All assertions observe **DOM state**, **computed styles**, **localStorage (`idle_button_v3_save` / `idle_button_v2_save`)**, **clipboard/export strings**, and **zero `console.error` / `pageerror`**.
- **State seeding** (when testing mid/late-game features) is done strictly through the public persistence boundary (`localStorage.setItem` before page load or via the UI Import Save modal), never by calling internal JS functions.

---

## 2. `baseline-smoke.e2e.test.mjs` (Immediate v0.2 Verification)

Purpose: Verify the CDP harness, static server, and current v0.2 baseline (`index.html` + `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`) end-to-end before M1–M5 land.

| # | Test Case | Target | Actions & Opaque-Box Assertions |
|---|---|---|---|
| 1 | Initial boot & clean console | `index.html` | Load page; assert `#currency-value` === `$0.00`, `#main-button` visible, `#top-bar` & `#right-column` have `.is-hidden`, 0 `pageerror` / `console.error`. |
| 2 | Button click & Phase 1 unlock | `index.html` | Click `#main-button` 5 times; assert `#currency-value` === `$5.00`, `#top-bar` & `#right-column` & `#memo-box` lose `.is-hidden`, `#workspace.has-console` applied, `#memo-feed` has welcome memo. |
| 3 | Buy Coffee-Fueled Intern & run cycle | `index.html` | Click `#main-button` 5 more times (`$10.00`), buy `intern` in `#generators-list`, click run/start cycle button, wait `2.2s`; assert `#currency-value` increases by `+$2.00` (`$2.00`). |
| 4 | Audio toggle & persistence across reload | `index.html` | Click `#btn-sound`; assert text changes `AUDIO: ON` -> `AUDIO: OFF`; verify `localStorage.getItem('idle_button_v2_save')` parses JSON with `soundEnabled: false`; reload page and assert `AUDIO: OFF` persists. |
| 5 | Standalone `idle_button.html` parity smoke | `idle_button.html` | Serve standalone HTML; load, click `#main-button` 5 times, assert `$5.00`, `#right-column` visible, 0 `pageerror` / `console.error` (verifying no external ES module network failures). |

---

## 3. Tier 1: Feature Coverage (`>= 5` Test Cases per Feature)

Every feature in `PROJECT.md § Feature Inventory` is covered with at least 5 distinct opaque-box test cases:

### 3.1 Button Clicking (5 cases)
1. **Initial click payout**: Single click on `#main-button` increments `#currency-value` from `$0.00` to `$1.00` and increments press count.
2. **Floating feedback element**: Clicking `#main-button` spawns a transient floating text node inside `#floating-layer` showing `+$1.00`.
3. **Click power upgrade scaling**: Purchasing `upg_keycap` (`+$1.00`) and `upg_espresso` (`2x`) updates `#button-sub` and subsequent click increments by `$4.00`.
4. **Click-%-of-$/sec scaling**: With passive `$/sec > 0` and `upg_tether` (`+2% of $/sec per click`), clicking adds base click + `2%` of current `$/sec`.
5. **Keyboard accessibility**: Focusing `#main-button` and pressing `Enter` / `Space` triggers a click and increments currency.

### 3.2 Phase Unlocks (5 cases)
1. **Phase 0 -> 1**: At 5 presses, `#top-bar`, `#right-column`, `#memo-box`, `#currency-label`, and `#button-sub` become visible; `#phase-tag` updates.
2. **Phase 1 -> 2**: Reaching `totalMoneyRun >= 25` removes `.is-hidden` from `#tab-btn-upgrades` and `#currency-rates`.
3. **Phase 2 -> 3**: Reaching `totalMoneyRun >= 200` removes `.is-hidden` from `#tab-btn-research`, `#pill-rp`, `#rate-rp`, and `#rate-rp-sep`.
4. **Phase 3 -> 4 (Sinister Reveal)**: Completing `res_compliance` unlocks `#tab-btn-prestige`, `#pill-shares`, and adds `body.is-sinister`.
5. **Phase monotonicity**: Spending money down to `$0.00` after unlocking Phase 2/3 never re-hides unlocked tabs.

### 3.3 Generators, Managers & Buy Modes `x1`/`x10`/`MAX` (6 cases)
1. **Buy Mode `x1`**: Purchasing `intern` at `$10.00` increments owned count by `1` and deducts `$10.00`.
2. **Buy Mode `x10`**: Switching `#buy-mode-group` to `x10` updates displayed cost to geometric sum of 10 units and buys 10 at once when affordable.
3. **Buy Mode `MAX`**: Switching to `MAX` with `$100.00` calculates max affordable units, displays count + cost, and buys exact max on click.
4. **Manual vs. Manager automation**: Unmanaged generator stops after 1 cycle until clicked; hiring its Manager (`mgr_intern`) auto-restarts cycles continuously.
5. **Milestones (`[10, 25, 50, 100, 150, 200, 300, 500]`)**: Crossing milestone `10` on a generator visibly updates milestone indicator and doubles/boosts cycle speed/payout.
6. **Tiers 7–10 progression**: Seeding mid/late-run funds renders and allows purchasing `Tiers 7–10` (*Resonance Array*, *Mnemonic Archive*, *Borehole Singularity*, *The Board*).

### 3.4 Upgrades & Owned Drawer (5 cases)
1. **Upgrades tab badge**: When an affordable upgrade becomes available, `#badge-upgrades` shows accurate count > 0.
2. **Purchase moves card to Owned drawer**: Buying an upgrade removes it from the available grid and places it inside the collapsible Owned drawer.
3. **Owned drawer toggle**: Clicking the Owned drawer header expands/collapses owned upgrade cards and updates `#upgrades-summary` (`X / Y OWNED`).
4. **Division-specific multiplier**: Buying `upg_intern_manual` (`2x Intern payout`) doubles Intern cycle payout without altering Drinking Bird base payout.
5. **Cross-division synergy upgrade**: Buying a synergy upgrade increases output of all active divisions and updates `#rate-money`.

### 3.5 R&D Lab — 2 Branches (5 cases)
1. **Branch rendering**: `#panel-research` displays both *Corporate Efficiency* and *Containment/Anomaly* R&D branches (12 total projects).
2. **Prerequisite gating**: Locked downstream projects show prerequisite requirement and cannot be started until parent project completes.
3. **Start & progress timer**: Starting `res_ergonomics` deducts RP, populates `#active-research-box` with progress bar, and completes after duration.
4. **Completed drawer**: Completed research moves to collapsible Completed R&D drawer and applies permanent run reward.
5. **Concurrent research guard**: While a project is active in `#active-research-box`, starting a second project is disabled.

### 3.6 Active Protocols — 4 Protocols (5 cases)
1. **Unlock gating**: `#abilities-bar` stays hidden until `res_ergonomics` completes, then reveals `ab_rush`; `ab_surge`, `ab_syphon`, and `ab_overclock` unlock via their respective R&D projects.
2. **Synergy Rush (`ab_rush`)**: Activating applies `2x` output for 15s, displays active countdown, then enters 35s cooldown.
3. **Power Surge (`ab_surge`)**: Activating immediately grants `15s` of passive `$/sec` and enters 45s cooldown.
4. **Deep Syphon (`ab_syphon`)**: Activating applies `3x` click power & `2x` RP gain for 20s, then enters 60s cooldown.
5. **4th Protocol (`ab_overclock`)**: Activating triggers its Containment/Overclock buff and enters cooldown without colliding with other protocol timers.

### 3.7 Restructure & Boardroom Perks — 12 Perks (6 cases)
1. **Pending shares preview**: `#panel-prestige` displays `pendingShares` calculated from `runMoney` (`pow(runMoney / 25000, 0.42)`).
2. **Restructure execution**: Confirming Restructure resets `money`, `generators`, `upgrades`, `completedResearch` while incrementing `restructures`, `shares`, and `lifetimeShares`.
3. **Boardroom Skill Tree rendering**: All 12 Boardroom perk nodes render with cost, status (locked/available/owned), and dependency lines.
4. **Purchasing root & dependent perks**: Buying a root perk deducts `shares` (preserving `lifetimeShares`) and unlocks child perk nodes.
5. **Starting boost / Auto-manager perks**: Starting a new run after buying Boardroom starting-cash / auto-manager perks applies them immediately at run start.
6. **Floor Portal unlock perks**: Buying Floor B2 / B4 / B6 Boardroom unlock perks enables the corresponding floor in the Facility Elevator bar.

### 3.8 Achievements — 20+ Achievements (5 cases)
1. **Achievements panel visibility & count**: Achievements panel lists 20+ achievement cards with locked/unlocked states and global multiplier summary (`+5%` compounding each).
2. **Presses / Money achievement trigger**: Crossing threshold unlocks achievement, increments unlocked count, and increases global multiplier.
3. **Floor / Restructure achievement trigger**: Completing first Restructure or Floor milestone unlocks corresponding achievement.
4. **Persistence across Restructure**: Achievements remain unlocked after Restructure and continue granting `+5%` compounding global bonus.
5. **Toast/notification**: Unlocking an achievement triggers visible notification/memo feedback without blocking input.

### 3.9 Anomalies / Memos (5 cases)
1. **Memo feed ordering & count**: `#memo-count` increments and `#memo-feed` displays new narrative beats (including Tiers 7–10 and Restructure 2/3/5 beats).
2. **Golden Memo (pre-sinister)**: Spawning an anomaly before `sinisterRevealed` renders an amber clickable floater.
3. **Containment Anomaly (post-sinister)**: Spawning an anomaly when `body.is-sinister` is active renders a crimson clickable floater.
4. **Clicking anomaly grants reward**: Clicking the floater removes it, increments `anomaliesCaught`, and grants immediate burst/buff + memo log.
5. **Auto-despawn**: Ignoring an anomaly floater causes it to expire cleanly after its timeout without leaving orphan DOM nodes.

### 3.10 Floor B2: Security Perimeter — TD (6 cases)
1. **Elevator navigation**: Unlocking B2 enables `B2: SECURITY` in the Elevator bar; clicking switches `#floor-td` to `.active` and hides `1F: DESK`.
2. **Turret pad purchase & placement**: Buying a turret pad with `$` and placing each of the 4 turret types (*Redaction Laser*, *NDA Slow-Field*, *Shredder Cannon*, *Compliance Tesla*).
3. **Turret upgrade with Security Scrap**: Upgrading a placed turret spends `td.scrap` and increases displayed DPS/level.
4. **Wave progression & Boss wave**: Tick loop advances `waveProgress`, clears waves, grants `td.scrap`, and spawns Boss every 5 waves (granting RPG Intel).
5. **Emergency Overcharge**: Activating Overcharge spends `$` and temporarily boosts turret output.
6. **Containment Integrity output**: Advancing `td.highestWave` increases global `$/sec` & `RP/sec` bonus reflected on `1F: DESK`.

### 3.11 Floor B4: Field Ops — RPG (6 cases)
1. **Elevator navigation**: Unlocking B4 enables `B4: FIELD OPS` and mounts `#floor-rpg`.
2. **Squad auto-battle & Sector stages**: Operative squad battles through 10-stage Sectors with Sector Bosses; HP/progress bars update smoothly.
3. **Stat upgrades with Bounty Credits**: Spending `rpg.credits` upgrades `ATK`, `HP`, `DEF`, `SPD` and updates squad power display.
4. **Squad slot expansion**: Unlocking 2nd/3rd operative slots via R&D adds operatives to the active squad.
5. **Artifact drop, equip & salvage**: Defeating enemies/bosses drops Containment Artifacts; equipping boosts Click/TD/RP stats, salvaging yields `rpg.shards`.
6. **Sector Clear persistence**: Highest Sector cleared unlocks Merge tier caps and boosts Share potency.

### 3.12 Floor B6: Synthesis Forge — Merge (6 cases)
1. **Elevator navigation**: Unlocking B6 enables `B6: FORGE` and mounts `#floor-merge`.
2. **Grid rendering & Actuator Core spawn**: Displays 4×4 (or 5×4) grid; timer auto-spawns T1 Actuator Core (and instant-buy button spawns core for `$`).
3. **Manual merge (`T1 + T1 -> T2`)**: Selecting/clicking two matching-tier cores merges them into `T(n+1)` and updates `merge.peakTier`.
4. **Spawner & Base Tier upgrades**: Spending `$` / `RP` upgrades `spawnerLevel` (faster spawn) and `baseTier` (higher spawned tier).
5. **Auto-Merge toggle**: Enabling `autoMerge` automatically combines matching pairs on the grid during tick.
6. **Grid Aura & Forge Catalysts**: Active cores on grid contribute passive `% $/sec`, `% TD DMG`, `% RPG ATK`; reaching Peak Tier milestones grants permanent `merge.catalysts` surviving Restructure.

### 3.13 Save, Export, Import, Reset, Offline Catch-up (6 cases)
1. **Auto-save to `idle_button_v3_save`**: State changes persist to `localStorage` under `idle_button_v3_save` with `version: 3`.
2. **Export Save modal**: Opening Export modal produces non-empty JSON/base64 string representing current state.
3. **Import Save modal**: Pasting a valid exported string into Import modal restores money, generators, floors, and meta-progression.
4. **In-app Reset modal**: Clicking `#btn-reset` opens in-app Reset modal (no `window.confirm`); confirming wipes save and resets to Phase 0.
5. **Offline Shift Summary modal**: Loading a save with `lastTick` 30 minutes in the past displays the Offline Shift Summary modal with elapsed time and offline earnings.
6. **v2 -> v3 automatic migration**: Loading with only `idle_button_v2_save` present migrates data cleanly to `idle_button_v3_save` without data loss.

### 3.14 Audio Toggle (5 cases)
1. **Default state**: Audio button initializes to `AUDIO: ON` (`soundEnabled: true`).
2. **Toggle off/on**: Clicking `#btn-sound` toggles text `AUDIO: ON` <-> `AUDIO: OFF`.
3. **Persistence**: Toggled audio state persists across full page reload.
4. **Preserved across Restructure**: Performing Restructure preserves `soundEnabled: false`.
5. **No WebAudio uncaught errors**: Clicking button, buying generators, and triggering anomalies with Audio ON/OFF produces zero `pageerror` in headless Chromium.

### 3.15 Standalone HTML Parity (5 cases)
1. **Self-contained bundle**: `idle_button.html` loads over `file://` or HTTP with zero failed network requests for `.js` or `.css`.
2. **Full UI parity**: `#top-bar`, Elevator bar, `#right-column` tabs, and Modals match `index.html` structure.
3. **All 3 floors functional**: Seeding unlocked floors in `idle_button.html` renders `#floor-td`, `#floor-rpg`, `#floor-merge` cleanly.
4. **Export/Import interoperability**: Save exported from `index.html` imports cleanly into `idle_button.html` and vice versa.
5. **Zero console errors**: Full smoke interaction in `idle_button.html` yields 0 `console.error` and 0 `pageerror`.

---

## 4. Tier 2: Boundary & Corner Cases (`>= 5` Test Cases per Feature)

Tier 2 exercises edge values, invalid inputs, disabled states, overflow formatting, and race/boundary conditions across every feature area:

1. **Insufficient Funds & Affordability Boundaries (6 cases)**:
   - Clicking `Buy x1` / `Buy x10` / `Buy MAX` when `money < cost` does nothing (`owned` unchanged, `money` unchanged).
   - Purchasing Manager, Upgrade, Research, Boardroom Perk, Turret, or Forge Spawner with exact `money === cost` (`0.00` remainder) succeeds cleanly.
   - `Buy MAX` when `money === 0` disables button and displays `x0` or next unit cost without `NaN`.
   - Emergency Overcharge on TD with insufficient `$` is blocked.
   - RPG stat upgrade with `credits === cost - 1` is blocked.
   - Merge instant-spawn when grid is full (`16/16` or `20/20`) is blocked without deducting `$`.

2. **Number & Duration Formatting Overflow Boundaries (6 cases)**:
   - Values at exact suffix thresholds: `999.99`, `1e3` (`K`), `1e6` (`M`), `1e9` (`B`), `1e12` (`T`), `1e15` (`Qa`), `1e18` (`Qi`), `1e21` (`Sx`), `1e24` (`Sp`), `1e27` (`Oc`), `1e30` (`No`), `1e33` (`Dc`).
   - Beyond `Dc` (`>= 1e36`): falls back to clean scientific notation (e.g., `1.00e36`), never `Infinity` or `NaN`.
   - Negative or `-0` edge values format safely as `$0.00` without `-$0.00`.
   - Duration formatter boundaries: `0s`, `59s`, `60s` (`1m 0s`), `3600s` (`1h 0m`), `86400s` (`1d 0h`).
   - Very large `pendingShares` calculation does not overflow to `Infinity`.
   - Long-running offline `dt` (e.g., `30 days` capped to max offline window) formats cleanly in Offline Shift Summary modal.

3. **Save, Migration & Import/Export Boundaries (7 cases)**:
   - Empty string `""` in Import Save modal shows validation error and leaves current state untouched.
   - Whitespace-only or corrupt JSON `"{bad json"` in Import Save modal is rejected gracefully.
   - Malformed base64 / wrong schema object (`{"foo": "bar"}`) in Import Save modal is rejected without crashing.
   - `localStorage` containing corrupt JSON at `idle_button_v3_save` falls back to clean initial state on boot.
   - `v2 -> v3` migration with partial/missing fields (e.g., missing `abilities` or `memos`) populates v3 defaults (`unlockedFloors: ['desk']`, `td`, `rpg`, `merge`) without `undefined` errors.
   - `v2 -> v3` migration preserves `shares`, `restructures`, `totalMoneyAllTime`, `sinisterRevealed`, `soundEnabled`.
   - Offline catch-up with `lastTick` in the future (`lastTick > Date.now()`) clamps `dt` to `0` and does NOT grant negative money or show negative duration.

4. **Locked Floor, Research & Prestige Boundaries (6 cases)**:
   - Attempting to click locked `B2`, `B4`, `B6` buttons in Elevator bar keeps `activeFloor === 'desk'`.
   - Seeding `activeFloor: 'td'` when `'td'` is NOT in `unlockedFloors` falls back to `'desk'` on load.
   - `0-share` Restructure: When `pendingShares === 0`, Restructure button is disabled and cannot trigger prestige.
   - Starting R&D project when `rp < rpCost` is blocked.
   - Purchasing a Boardroom perk whose parent node is unowned is blocked even if `shares >= perk.cost`.
   - Activating an Active Protocol while on cooldown (`cooldownRemaining > 0`) is ignored.

5. **UI, Modal & Rapid Input Boundaries (6 cases)**:
   - Opening Reset modal and clicking **Cancel** (or pressing `Escape`) closes modal and preserves `localStorage` and current money.
   - Opening Export/Import modal and clicking **Close/Cancel** leaves state unchanged.
   - Rapid-clicking `#main-button` 50 times in a tight loop registers all 50 presses accurately with zero lost increments or DOM freeze.
   - Rapidly switching tabs (`operations` -> `upgrades` -> `research` -> `prestige`) and floors (`desk` -> `td` -> `rpg` -> `merge`) leaves exactly one `.active` panel/floor.
   - Clicking the same Merge tile twice deselects it rather than self-merging `T1 + T1` into `T2`.
   - Narrow mobile viewport (`375x812`) renders single-column layout without horizontal overflow (`scrollWidth <= clientWidth`).

---

## 5. Tier 3: Cross-Feature Combinations (Pairwise Interactions)

1. **`01-prestige-boardroom-floor-unlocks.e2e.test.mjs`**:
   - Restructure -> earn Shares -> buy Boardroom Floor B2/B4/B6 unlock perks -> verify Elevator buttons unlock -> verify starting-cash & auto-manager perks active on new run -> verify `achievements` & `soundEnabled` preserved.
2. **`02-cross-floor-buff-synergies.e2e.test.mjs`**:
   - **TD -> Core & RPG**: Advance TD `highestWave` -> verify Core `$/sec` & `RP/sec` increase AND RPG Squad DEF increases.
   - **RPG -> Core & TD & Merge**: Equip RPG Containment Artifact -> verify Click power, TD Turret DMG, and RP/sec increase; clear Sector -> verify Merge tier cap & Share potency increase.
   - **Merge -> Core & TD & RPG**: Place high-tier Actuator Cores on Merge grid -> verify Grid Aura boosts Core `$/sec`, TD DMG, and RPG ATK; reach Peak Tier milestone -> verify Forge Catalyst persists across Restructure.
3. **`03-sinister-theme-and-anomalies.e2e.test.mjs`**:
   - Pre-sinister (`phase < 4`) anomaly spawns amber Golden Memo; completing `res_compliance` switches `body.is-sinister`, reveals Restructure, and subsequent anomaly spawns crimson Containment Anomaly; clicking anomaly during active `ab_rush` stacks buffs cleanly.
4. **`04-upgrades-milestones-protocols.e2e.test.mjs`**:
   - Combine generator Milestone (`10` / `25` / `50`) + division Upgrade + `Corporate Synergy` + `ab_rush` (`2x`) + `ab_syphon` (`3x click`, `2x RP`); verify multiplicative stacking reflected in `#rate-money`, `#rate-rp`, `#button-sub`, and `ab_surge` instant payout (`15s * boosted $/sec`).

---

## 6. Tier 4: Real-World Application Scenarios (End-to-End Playthroughs)

1. **`01-run0-to-restructure1-playthrough.e2e.test.mjs`**:
   - Full Run 0 progression from `$0.00`: click button -> unlock Phase 1 -> buy Interns & Shift Lead -> unlock Upgrades & buy click/division upgrades -> unlock R&D Lab -> complete `res_ergonomics`..`res_compliance` -> trigger Sinister Reveal -> accumulate `pendingShares >= 1` -> execute Restructure 1 -> verify clean Run 1 start with Share multiplier active.
2. **`02-multi-prestige-all-floors-persistence.e2e.test.mjs`**:
   - Multi-prestige playthrough: Restructure 1 -> purchase Boardroom perks unlocking B2 (TD), B4 (RPG), B6 (Merge) -> play B2 (place & upgrade turrets, clear waves, earn Scrap/Intel) -> play B4 (upgrade squad, clear stages, equip/salvage Artifact) -> play B6 (spawn & merge cores, toggle Auto-Merge, earn Catalyst) -> Export Save -> Reset -> Import Save -> Reload browser -> verify all 3 floors, artifacts, catalysts, achievements, and Boardroom perks remain intact.

---

## 7. Outline of `TEST_INFRA.md` and `TEST_READY.md`

### `TEST_INFRA.md` Structure (placed at `/home/antigravity/aholmes95/idle-button/TEST_INFRA.md`)
1. **Environment & Prerequisites**: Node `v24.22.2` (`node:test`), Python `3.11.2`, `/usr/bin/chromium` (`156.0.8078.79`), zero external npm packages required.
2. **Architecture of the E2E Harness**:
   - `tests/e2e/helpers/server.mjs`: Ephemeral HTTP server for repo root & standalone artifact.
   - `tests/e2e/helpers/cdp.mjs`: Raw WebSocket CDP client (target discovery, `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent` / `DOM.querySelector`, console/pageerror capture).
   - `tests/e2e/helpers/fixtures.mjs`: Opaque-box `localStorage` state seeders (v2, v3) and deterministic time/tick helpers.
3. **Running the Tests**:
   - Baseline smoke: `node --test tests/e2e/baseline-smoke.e2e.test.mjs`
   - Per-tier commands (`tier1/`, `tier2/`, `tier3/`, `tier4/`)
   - Full suite: `node --test tests/e2e/**/*.e2e.test.mjs`
4. **Troubleshooting & CI Notes**: `--no-sandbox --disable-gpu`, port-0 ephemeral binding, screenshot/DOM dump on failure.

### `TEST_READY.md` Structure (placed at `/home/antigravity/aholmes95/idle-button/TEST_READY.md`)
1. **Status Summary**: Harness readiness (`READY`), baseline smoke pass status (`baseline-smoke.e2e.test.mjs` verified against v0.2 + `idle_button.html`), and Tier 1–4 suite status (`SPECIFIED / SCAFFOLDED`, awaiting M1–M5 implementation milestones).
2. **Test Inventory Matrix**: Table mapping every `PROJECT.md` Feature (#1–#18) to its Tier 1, Tier 2, Tier 3, and Tier 4 test files and test counts.
3. **Milestone Gate Checklist**: Which E2E suites become runnable at M1, M2, M3, M4, M5, and M6.
4. **Known Constraints**: Opaque-box contract (no internal JS imports), standalone `idle_button.html` sync requirement after each milestone.
