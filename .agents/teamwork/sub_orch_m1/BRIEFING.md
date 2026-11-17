# Briefing — Milestone M1: Core Architecture, State v3, Modifiers & UI Overhaul

## Parent & Context
- **Parent Orchestrator**: `92400dedc922e66f33c790a33b542756`
- **Repository**: `/home/antigravity/aholmes95/idle-button`
- **Standalone Artifact**: `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`
- **Source of Truth**: `ORIGINAL_REQUEST.md` & `PROJECT.md`

## M1 Objectives
1. **Modularize JS**:
   - `js/format.js`: `fmtMoney`, `fmtNumber` (`K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc` + scientific fallback), time/duration formatters.
   - `js/state.js`: `version: 3`, `SAVE_KEY = 'idle_button_v3_save'`, auto-migration from `idle_button_v2_save`, `exportSave`/`importSave`, `activeFloor`, `unlockedFloors`, `lifetimeShares`, `boardroomPerks`, `achievements`, `anomaliesCaught`, stubbed `td`, `rpg`, `merge` state objects per `PROJECT.md § Interface Contracts`.
   - `js/modifiers.js`: `getCrossFloorBonuses(state)` returning `{ moneyMult, rpMult, clickMult, speedMult, tdDamageMult, tdFireRateMult, tdScrapMult, rpgAtkMult, rpgDefMult, rpgHpMult, mergeSpeedMult, sharePotencyMult }`.
   - `js/economy.js`: pure calculation functions for click power, generator payouts/speeds, bulk costs, RP rates, share multiplier, `pendingShares`, offline earnings calculation.
   - `js/ui.js`: DOM caching, modal helpers, tab/floor switching, panel rendering, collapsible owned/completed drawers, per-frame `updateDynamicUI`.
   - `js/game.js`: lean orchestrator (boot, offline catch-up modal/summary, `rAF` tick loop, event binding, auto-save, `beforeunload` save).
2. **UI & Visual Overhaul** (`index.html`, `styles.css`):
   - Sticky `.left-column` on desktop (`position: sticky; top: 18px`), wider `.app-shell` (`1360px`–`1440px`), preserve `@media (max-width: 860px)` responsiveness.
   - Visual polish of Button Station (tactile housing, SVG/CSS progress/charge ring or pulse feedback, cleaner floating numbers) and Cards (clearer typography, icons/badges, visual hierarchy).
   - Collapsible "Owned / Completed" drawer in Upgrades and R&D panels.
   - Facility Elevator / Portal Bar (`1F: DESK`, `B2: SECURITY`, `B4: FIELD OPS`, `B6: FORGE`) with locked states & tooltips, plus mount containers `#floor-td`, `#floor-rpg`, `#floor-merge`.
   - In-app Reset confirmation modal (replacing `confirm()`), Save Export/Import modal, Offline Shift Summary modal/banner (>60s away).
   - Preserve and enhance `body.is-sinister` crimson theme shift.
3. **Standalone Artifact Sync**:
   - `scripts/build-standalone.mjs` (zero-dependency Node script) bundling `index.html`, `styles.css`, `js/**/*.js` in dependency order into `idle_button.html`.
   - Verify `idle_button.html` works standalone in headless Chromium with zero console errors.
4. **Unit & Smoke Tests**:
   - `tests/core_m1.test.js` (`node --test`) verifying `format.js`, `state.js` v2->v3 migration & export/import, `modifiers.js`, `economy.js`, offline calculation.
   - Verify `index.html` (via `python3 -m http.server`) and `idle_button.html` in headless Chromium (`/usr/bin/chromium --headless --no-sandbox --disable-gpu`).
