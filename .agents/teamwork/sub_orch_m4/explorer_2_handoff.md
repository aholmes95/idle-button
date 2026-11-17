# Explorer 2 Handoff — Milestone M4 (Floor B4: Field Ops / RPG Auto-Battler & Artifacts)

## 1. `#floor-td` Reference Pattern (HTML, CSS, JS Conventions)

### 1.1 `index.html` Mounting
- **Elevator Button**: `index.html` lines 42–48 (`#floor-btn-td`, `data-floor="td"`, `.elevator-btn.mono.is-locked`, `.floor-code`, `.floor-name`, `.floor-lock`).
- **Floor Container**: `index.html` lines 210–217:
  - `<section class="floor-container is-hidden" id="floor-td" data-floor-panel="td" aria-label="Floor B2: Security Perimeter">`
  - Contains fallback `.floor-placeholder` markup until `renderTD()` replaces `containerEl.innerHTML`.
  - Includes `<button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>`.

### 1.2 `styles.css` Styling & Theme/Responsive Conventions
- **Shared Floor Shell**:
  - `.floor-container` (`styles.css:931-934`), `.floor-placeholder` (`styles.css:936-959`).
- **Theme Variables & `body.is-sinister`**:
  - Root tokens (`styles.css:1-28`): `--bg-void`, `--bg-surface`, `--bg-elevated`, `--border-hairline`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent` (`#f0a43a`), `--accent-dim`, `--accent-glow`, `--good` (`#4ecb71`), `--good-dim`, `--info` (`#4da3ff`), `--info-dim`, `--danger` (`#e05252`), `--danger-dim`.
  - Sinister theme (`styles.css:31-40`): `body.is-sinister` shifts `--bg-void`/`--bg-surface`/`--bg-elevated` darker and switches `--accent` to `#e05252` (crimson).
  - Additional sinister overrides in `styles.css`: `.status-led` (`104-107`), `.currency-value` (`275-277`), `.gen-bar-fill` (`714-716`), `.modal-card` (`985-987`), `.anomaly-floater.is-sinister` (`1184-1189`).
  - Note: `.td-shell` (`styles.css:1201-1481`) uses semantic CSS custom properties (`var(--bg-surface)`, `var(--bg-elevated)`, `var(--accent)`, `var(--good)`, `var(--info)`, `var(--danger)`), so `body.is-sinister` automatically shifts `.td-shell` accent colors without needing separate per-class sinister rules (except where explicit crimson borders/glows are desired, e.g. `.td-shell.td-overcharge-active` at `1211-1214`).
- **TD Layout Classes (`styles.css:1200-1481`)**:
  - `.td-shell`: flex column, `gap: 16px`, `padding: 18px 20px`, `background: var(--bg-surface)`, `border: 1px solid var(--border-hairline)`, `border-radius: var(--radius-lg)`.
  - `.td-header` (`1216-1222`): flex space-between with `.td-header-left` + `.td-integrity-pill` (`1237-1246`).
  - `.td-telemetry` (`1248-1274`): `grid-template-columns: repeat(4, 1fr)`, 4 `.td-stat-box` cards.
  - `.td-controls` (`1276-1281`): flex wrap action row (`gap: 10px`).
  - `.td-lane` (`1283-1341`): elevated status/progress lane reusing `.gen-bar-track` and `.gen-bar-fill` (with `.is-boss` crimson gradient at `1330-1332`).
  - `.td-grid` (`1343-1348`): 2-column split `grid-template-columns: 1.35fr 1fr`.
- **Responsive `@media (max-width: 860px)` (`styles.css:1483-1490`)**:
  - `.td-telemetry { grid-template-columns: repeat(2, 1fr); }` (`1488`)
  - `.td-grid { grid-template-columns: 1fr; }` (`1489`)

### 1.3 `js/ui.js`, `js/game.js`, and `js/floors/td.js` Rendering/Updating/Binding Pattern
- **`js/ui.js`**:
  - `cacheElements()` (`js/ui.js:36-125`): caches `elevatorBar`, `elevatorBtns`, `floorPanels` (`[data-floor-panel]`), `floorTd: document.getElementById('floor-td')` (`line 53`), `returnDeskBtns` (`[data-return-desk]`).
  - `renderFloorSwitcher(state)` (`js/ui.js:176-199`): updates `.active`, `.is-locked`, `aria-disabled`, `.floor-lock`, and `title` from `FLOORS` in `js/data.js`.
  - `switchFloor(state, floorId)` (`js/ui.js:201-216`): checks `state.unlockedFloors.includes(floorId)`, sets `state.activeFloor`, toggles `.is-hidden` on `el.workspace` (`floorId !== 'desk'`) and `el.floorPanels` (`panel.dataset.floorPanel !== floorId`), calls `renderFloorSwitcher(state)`.
- **`js/floors/td.js`** (Floor Module Contract):
  - Exports simulation helpers + `tickTD(state, dt, bonuses)` (`234-309`), `renderTD(state, containerEl, handlers)` (`319-526`), `updateTDUI(state, containerEl)` (`528-613`), `bindTDEvents(containerEl, getState, onAction)` (`615-654`).
  - **Render Signature Optimization**: `tdComputeRenderSig(state)` (`311-317`) sets `data-td-render-sig` on `.td-shell`. `updateTDUI` checks if the signature changed; if so, it calls `renderTD`, otherwise it performs lightweight DOM text/width/disabled updates via `[data-td-role="..."]` and `[data-td-action="..."]` without thrashing buttons.
  - **Event Delegation**: `bindTDEvents` guards with `containerEl.dataset.tdBound = 'true'` (`616-617`), listens on `containerEl` for `click` -> `e.target.closest('button')`, ignores disabled buttons, and dispatches typed action objects to `onAction(...)` (including `data-return-desk` -> `{ type: 'return-desk' }`).
- **`js/game.js` Wiring**:
  - `buyBoardroomPerk()` (`269-275`): when `perk.unlockFloor === 'td'`, calls `renderTD(state, el.floorTd, handlers)`.
  - `doRestructure()` (`354-356`): re-renders unlocked floor (`if (state.unlockedFloors.includes('td')) renderTD(...)`).
  - `applyOfflineProgress()` (`426-440`): ticks `tickTD(state, offline.elapsedSec * (offline.efficiency || 0.25), bonuses)`, and if unlocked re-renders `renderTD`.
  - `tick(now)` (`558-576`): ticks `tickTD(state, dt, bonuses)` whenever `state.unlockedFloors.includes('td')`; calls `updateTDUI(state, el.floorTd)` only when `state.activeFloor === 'td'`.
  - `handleTDAction(action)` (`587-622`): handles `return-desk` via `switchFloor(state, 'desk')`, dispatches floor mutations, plays `js/audio.js` cues (`playClickSound`, `playUnlockSound`, `playAnomalySound`), calls `renderTD`, `updateDynamicUI`, `saveState`.
  - `bindEvents()` (`626, 632-642, 704-706`) & Boot (`752-754`): calls `bindTDEvents(el.floorTd, () => state, handleTDAction)`, renders on elevator click and save import and boot.

---

## 2. Current State of `#floor-rpg`

- **`index.html`**:
  - `lines 49-55`: Elevator button `#floor-btn-rpg` with `data-floor="rpg"`, `B4` / `FIELD OPS`, `is-locked`, `aria-disabled="true"`.
  - `lines 219-226`:
    ```html
    <section class="floor-container is-hidden" id="floor-rpg" data-floor-panel="rpg" aria-label="Floor B4: Field Ops">
      <div class="floor-placeholder">
        <div class="floor-placeholder-badge mono">B4 // FIELD OPS</div>
        <h2 class="floor-placeholder-title">Field Ops Dispatch Offline</h2>
        <p class="floor-placeholder-desc">Operative squad deployment and artifact recovery sectors are scheduled for Milestone M4. Unlock access via the Boardroom Skill Tree.</p>
        <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
      </div>
    </section>
    ```
- **`js/ui.js`**:
  - `cacheElements()` (`line 53`) caches `floorTd` but does **not** yet cache `floorRpg: document.getElementById('floor-rpg')`.
  - `switchFloor()` (`lines 201-216`) already handles showing/hiding `#floor-rpg` via `el.floorPanels` (`[data-floor-panel]`).
- **`styles.css`**:
  - Only generic `.floor-container` (`931-934`) and `.floor-placeholder` (`936-959`) apply to `#floor-rpg` currently; no `.rpg-*` classes exist yet.
- **`js/floors/rpg.js`**:
  - Does not exist yet (`js/floors/` currently contains only `td.js`). Note that `scripts/build-standalone.mjs:16` already lists `'js/floors/rpg.js'` in `MODULE_ORDER`.

---

## 3. How `tests/` Runs `node --test` and Headless Chromium Verification

### 3.1 Unit Tests (`node --test`)
- Uses Node's built-in test runner (`node:test`, `node:assert/strict`), zero external dependencies.
- Example: `node --test tests/floor_td_m3.test.js` (10/10 passing).
- `tests/core_m1.test.js`, `tests/balance_m2.test.js`, `tests/floor_td_m3.test.js` import ES modules directly from `../js/*.js` and test pure state, economy, modifiers, and floor simulation deterministically.

### 3.2 Headless Chromium E2E Tests (`tests/e2e/`)
- **Helpers (`tests/e2e/helpers/`)**:
  - `server.mjs`: `startStaticServer(rootDir)` serves `index.html` or `idle_button.html` on `127.0.0.1` ephemeral port.
  - `cdp.mjs`: `launchChromium()` + `CdpClient` speaks Chrome DevTools Protocol directly over WebSocket.
  - `harness.mjs`: `E2EHarness.create({ rootDir, pagePath, initialState, storageKey, viewport })` launches Chromium, seeds `localStorage` via `addOneShotSeedScript` (before boot, without overwriting on `reload()`), captures console/page errors (`h.assertNoErrors()`), and provides `click`, `type`, `text`, `hasClass`, `waitForSelector`, `waitForCondition`, `readStorage`, `evaluate`, `reload`.
  - `fixtures.mjs`:
    - `REPO_ROOT`, `STANDALONE_DIR` (`/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2`), `STANDALONE_PAGE` (`/idle_button.html`), `V3_SAVE_KEY` (`idle_button_v3_save`).
    - `createV3Save(overrides)` and `createPostRestructureSave(overrides)` provide pure JSON seeds (including `rpg: { sector, stage, highestSector, credits, intel, shards, squad, artifacts, equipped }`).
- **Existing E2E Contracts for `#floor-rpg` (MUST be preserved by M4 UI/DOM!)**:
  1. `tests/e2e/tier1/08-floor-b4-rpg.e2e.test.mjs`:
     - `#floor-btn-rpg` click reveals `#floor-rpg` and hides `#workspace`.
     - Auto-battle advances `rpg.stage > 1` or `rpg.credits > 0` with seeded `squad: [{ name: 'Operative-01', atk: 20, hp: 100, maxHp: 100, def: 5, spd: 1 }]`.
     - `#floor-rpg [data-rpg-upgrade="atk"]` spends `rpg.credits` and increases `squad[0].atk` (support `atk`, `hp`, `def`, `spd`).
     - `#floor-rpg [data-rpg-action="recruit"]` adds operative to `rpg.squad`.
     - `#floor-rpg [data-rpg-action="equip"][data-art-id="<id>"]` equips artifact into `rpg.equipped`.
     - `#floor-rpg [data-rpg-action="salvage"][data-art-id="<id>"]` salvages artifact for `rpg.shards > 0`.
     - `rpg.highestSector` survives Restructure.
  2. `tests/e2e/tier2/04-floors-boundary-cases.e2e.test.mjs`:
     - Test 4: Squad HP reaching 0 recovers gracefully without `NaN` or negative `stage` (`stage >= 1`).
     - Test 6: Salvaging an equipped artifact (`#floor-rpg [data-rpg-action="salvage"][data-art-id="art_eq"]`) is either `disabled` or unequips safely without leaving orphan ID in `rpg.equipped`.
  3. `tests/e2e/tier3/02-cross-floor-buff-synergies.e2e.test.mjs`:
     - Test 2: Equipping `{ id: 'art_click', bonusType: 'clickMult', bonusVal: 1.0 }` via `#floor-rpg [data-rpg-action="equip"][data-art-id="art_click"]` visibly increases `#button-sub` on `1F: DESK`.
  4. `tests/e2e/tier4/02-multi-prestige-all-floors-persistence.e2e.test.mjs`:
     - Uses `#floor-rpg [data-rpg-upgrade="atk"]` and `#floor-rpg [data-rpg-action="equip"][data-art-id="art_run"]`.
  5. `tests/e2e/tier1/11-standalone-parity.e2e.test.mjs`:
     - Verifies `idle_button.html` generated by `node scripts/build-standalone.mjs` loads and switches to `#floor-rpg` with zero errors.

---

## 4. Proposed Field Ops UI Structure & `tests/floor_rpg_m4.test.js` Test Plan

### 4.1 Clean Field Ops UI Structure (`#floor-rpg`)
Mirror `.td-shell` (`styles.css:1201-1481`) with `.rpg-*` classes and `data-rpg-render-sig` + `data-rpg-role` / `data-rpg-action` / `data-rpg-upgrade` attributes:

```html
<div class="rpg-shell" data-rpg-render-sig="...">
  <!-- Header -->
  <div class="rpg-header">
    <div class="rpg-header-left">
      <span class="card-badge is-accent mono">B4 // FIELD OPS</span>
      <h2 class="rpg-title">Field Ops Dispatch</h2>
      <span class="rpg-potency-pill mono" data-rpg-role="potency">
        Sector Clearance: +X% Share Potency &amp; +Y% Artifact Salvage
      </span>
    </div>
    <div class="rpg-header-actions">
      <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
    </div>
  </div>

  <!-- 4-Column Telemetry Strip -->
  <div class="rpg-telemetry">
    <div class="rpg-stat-box"><!-- SECTOR / STAGE (e.g. S1 • 1/10 [BOSS]) --></div>
    <div class="rpg-stat-box"><!-- HIGHEST SECTOR --></div>
    <div class="rpg-stat-box"><!-- CREDITS / INTEL / SHARDS --></div>
    <div class="rpg-stat-box"><!-- SQUAD POWER (ATK / DEF / SPD) --></div>
  </div>

  <!-- Combat Lane (Enemy + Squad HP Bars) -->
  <div class="rpg-lane">
    <!-- Enemy badge (BOSS / HOSTILE), Enemy Name, Enemy HP text + .gen-bar-track > .gen-bar-fill (.is-boss) -->
    <!-- Squad HP summary + .gen-bar-track > .gen-bar-fill.is-squad + Recovery indicator if wiped -->
  </div>

  <!-- Controls Row -->
  <div class="rpg-controls">
    <!-- Recruit Operative: button[data-rpg-action="recruit"] -->
    <!-- Upgrade buttons: button[data-rpg-upgrade="atk"|"hp"|"def"|"spd"] -->
    <!-- Optional Sector select / Retreat / Auto-Advance toggle -->
  </div>

  <!-- 2-Column Main Grid (.rpg-grid: 1.15fr 1fr, collapses to 1fr @media max-width: 860px) -->
  <div class="rpg-grid">
    <section class="rpg-section">
      <!-- Active Squad Cards (1–3 Operatives, individual HP bar, ATK/HP/DEF/SPD) -->
    </section>
    <section class="rpg-section">
      <!-- Containment Artifacts Vault (Equipped slots X/3 + Inventory cards with
           button[data-rpg-action="equip"][data-art-id="..."] and
           button[data-rpg-action="salvage"][data-art-id="..."] ) -->
    </section>
  </div>
</div>
```

**Required `js/ui.js` & `js/game.js` Additions**:
- `js/ui.js`: Add `floorRpg: document.getElementById('floor-rpg')` to `cacheElements()`.
- `js/game.js`:
  - Import `tickRPG, renderRPG, updateRPGUI, bindRPGEvents, ...` from `./floors/rpg.js`.
  - Call `bindRPGEvents(el.floorRpg, () => state, handleRPGAction)` in `bindEvents()`.
  - Call `renderRPG(state, el.floorRpg, handlers)` on boot (if unlocked), on `perk_floor_rpg` unlock, on `doRestructure()`, on `applyOfflineProgress()`, on `importSave()`, and on `#floor-btn-rpg` click.
  - Tick `tickRPG(state, dt, bonuses)` in `tick(now)` when `state.unlockedFloors.includes('rpg')`, and call `updateRPGUI(state, el.floorRpg)` when `state.activeFloor === 'rpg'`.
  - Tick `tickRPG` in `applyOfflineProgress()` at offline efficiency.
- `styles.css`: Add `.rpg-*` section following `.td-*`, using CSS variables so `body.is-sinister` applies seamlessly, and add `.rpg-telemetry { grid-template-columns: repeat(2, 1fr); }` and `.rpg-grid { grid-template-columns: 1fr; }` inside `@media (max-width: 860px)`.

### 4.2 `tests/floor_rpg_m4.test.js` Test Plan
Mirror `tests/floor_td_m3.test.js` using `node:test` + `node:assert/strict`:
1. **State Initialization & Migration (`M4 State & Modifiers Integration`)**:
   - `createInitialState()` initializes `rpg` with valid defaults (`sector: 1`, `stage: 1`, `highestSector: 0`, `credits: 0`, `intel: 0`, `shards: 0`, `squad` with starter operative or recruitable, `artifacts: []`, `equipped: []`).
   - `migrateState()` sanitizes partial/corrupt `rpg` payloads (clamps `sector >= 1`, `stage >= 1`, `squad` finite stats, removes orphan IDs in `equipped`).
   - `getCrossFloorBonuses(state)` incorporates equipped artifact bonuses (`clickMult`, `moneyMult`, `rpMult`, `tdDamageMult`, `rpgAtkMult`, etc.) and `highestSector` Share potency bonus.
2. **Squad Management & Upgrades (`M4 Squad, Upgrades & Recruitment`)**:
   - `rpgUpgradeSquad(state, stat)` for `'atk' | 'hp' | 'def' | 'spd'` deducts `rpg.credits`, boosts all squad operatives, and rejects when credits are insufficient.
   - `rpgRecruitOperative(state)` adds an operative up to max squad size (3), deducts cost (`credits` / `intel`), and rejects when full or unaffordable.
3. **Auto-Battler Simulation & Recovery (`M4 Sector Combat, Bosses & Wipe Recovery`)**:
   - `tickRPG(state, dt, bonuses)` advances stage combat deterministically, awards `rpg.credits` and `rpg.intel` on stage/sector clear, and spawns Sector Boss on stage 10.
   - Boss clear increments `highestSector`, advances `sector`, and rolls/drops a Containment Artifact into `rpg.artifacts`.
   - Squad wipe (`hp <= 0`) recovers gracefully without `NaN` or `stage < 1`, resetting/retreating cleanly and restoring squad HP.
   - Offline catch-up simulation (`tickRPG` with large `dt`) remains bounded and deterministic.
4. **Artifacts Equip, Salvage & Upgrade (`M4 Artifacts & Shards`)**:
   - `rpgEquipArtifact(state, artId)` equips up to max slots (3) and unequipping removes cleanly.
   - `rpgSalvageArtifact(state, artId)` removes artifact and awards `rpg.shards`; salvaging an equipped artifact is either blocked or cleanly unequips first (no orphan ID in `rpg.equipped`).
   - `rpgUpgradeArtifact(state, artId)` (if implemented) spends `rpg.shards` to boost artifact `bonusVal`.
5. **Data & Content Integration**:
   - Verifies RPG achievements (`ach_rpg_*`), narrative beats, and clean `FLOORS` unlock hint for `'rpg'` in `js/data.js`.
