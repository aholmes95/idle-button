# Project: ButtonCorp™ (`idle-button`) Expansion & UI Overhaul

## Architecture
- **Modular Native ES-Module Web App** (zero bundler required for dev; automated single-file standalone HTML build for artifact distribution):
  - `index.html`: Two-column workspace with sticky left Button Station (`#left-column`), Facility Elevator / Portal Bar (`1F: DESK`, `B2: SECURITY`, `B4: FIELD OPS`, `B6: FORGE`), Right Console (`#right-column` with Operations, Upgrades, R&D Lab, Achievements, Restructure/Boardroom), Floor containers (`#floor-td`, `#floor-rpg`, `#floor-merge`), and in-app Modals (Reset, Export/Import, Offline Shift Summary).
  - `styles.css`: Clean industrial dark design system (`--bg-void`, `--bg-surface`, `--bg-elevated`, `--accent`, `body.is-sinister` crimson shift), sticky left column, improved card hierarchy, collapsible owned/completed drawers, anomaly/memo floaters, and dedicated floor layouts.
  - `js/format.js`: Extended number formatting (`K`, `M`, `B`, `T`, `Qa`, `Qi`, `Sx`, `Sp`, `Oc`, `No`, `Dc`, scientific fallback) and time/duration formatters.
  - `js/state.js`: Versioned save schema (`version: 3`, key `idle_button_v3_save` with automatic migration from `idle_button_v2_save`), export/import JSON/base64, offline elapsed time calculation (`lastTick`), and preserved meta-progression (`shares`, `lifetimeShares`, `restructures`, `boardroomPerks`, `achievements`, `unlockedFloors`, `rpg.artifacts`, `merge.peakCatalysts`).
  - `js/data.js`: Static definitions for 10 Generators (Tiers 1–10), expanded Milestones `[10, 25, 50, 100, 150, 200, 300, 500]`, Managers, 24+ Upgrades (including cross-division synergies & click scaling), 12 R&D Projects (2 branches), 4 Active Protocols, 12-node Boardroom Skill Tree, 20+ Achievements, Anomaly/Memo event pool, and expanded Narrative Beats.
  - `js/modifiers.js`: Pure cross-floor bonus aggregator `getCrossFloorBonuses(state)` — single source of truth for multipliers across Core, TD, RPG, and Merge (prevents circular imports).
  - `js/economy.js`: Pure calculation functions for click power, generator cycle payouts/speeds, bulk costs, RP rates, Share multiplier, `pendingShares`, and offline earnings.
  - `js/audio.js`: Web Audio API procedural sound effects (click, unlock, anomaly, wave/combat/merge cues).
  - `js/ui.js`: DOM caching, modal helpers, tab/floor switching, panel rendering, collapsible completed/owned drawers, Golden Memo / Anomaly floater management, and per-frame dynamic UI updates.
  - `js/floors/td.js`: Floor B2 — Security Perimeter (Idle Tower Defense).
  - `js/floors/rpg.js`: Floor B4 — Field Ops (RPG Auto-Battler & Artifacts).
  - `js/floors/merge.js`: Floor B6 — Synthesis Forge (Merge Grid & Catalysts).
  - `js/game.js`: Lean orchestrator: boot, offline catch-up, `requestAnimationFrame` tick loop (driving core + unlocked floors), event binding, and auto-save.
  - `scripts/build-standalone.mjs`: Zero-dependency Node script that bundles `index.html`, `styles.css`, and all `js/**/*.js` modules in dependency order into `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`.

## Code Layout
```text
/home/antigravity/aholmes95/idle-button/
├── index.html
├── styles.css
├── README.md
├── PROJECT.md
├── TEST_INFRA.md               (created by E2E Testing Track)
├── TEST_READY.md               (created by E2E Testing Track)
├── scripts/
│   └── build-standalone.mjs
├── js/
│   ├── format.js
│   ├── state.js
│   ├── data.js
│   ├── modifiers.js
│   ├── economy.js
│   ├── audio.js
│   ├── ui.js
│   ├── game.js
│   └── floors/
│       ├── td.js
│       ├── rpg.js
│       └── merge.js
└── tests/                      (unit & E2E tests)

Standalone Artifact (kept in sync via scripts/build-standalone.mjs):
/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Modular JS Architecture | Split monolithic `game.js` into `format.js`, `state.js`, `modifiers.js`, `economy.js`, `ui.js`, `game.js` | M1 | Survey 1, 3 |
| 2 | UI & Visual Overhaul | Sticky left column, wider shell, polished button station, card hierarchy, collapsible owned/completed drawers | M1 | Survey 1 |
| 3 | Facility Floor/Portal Switcher | Elevator bar (`1F: DESK`, `B2: SECURITY`, `B4: FIELD OPS`, `B6: FORGE`) + floor mount points | M1 | Survey 1, 3 |
| 4 | Save v3, Migration, Export/Import & Modals | `idle_button_v3_save` with v2 migration, offline progress catch-up, Export/Import, in-app Reset modal | M1 | Survey 1, 2 |
| 5 | Extended Number Formatting | `fmtMoney` / `fmtNumber` supporting `K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc` | M1, M2 | Survey 1, 2 |
| 6 | Standalone Artifact Sync Script | `scripts/build-standalone.mjs` to deterministically build `idle_button.html` | M1 | Survey 1, 3 |
| 7 | Multi-Prestige Shares & Pacing Rebalance | `pow(runMoney / 25000, 0.42)` shares, `lifetimeShares`, multiplicative `restructures` scaling | M2 | Survey 2 |
| 8 | Boardroom Skill Tree (12 Perks) | Spendable Shares tree with starting boosts, auto-managers, offline boost, and Floor Portal unlocks | M2 | Survey 2 |
| 9 | Expanded Generators (Tiers 7–10) & Milestones | Resonance Array, Mnemonic Archive, Borehole Singularity, The Board + milestones up to 500 | M2 | Survey 2 |
| 10 | Expanded Upgrades (24+) & Synergies | Division multipliers, click-%-of-$/sec scaling, cross-division synergies | M2 | Survey 2 |
| 11 | Expanded R&D (12 Projects, 2 Branches) & 4th Protocol | Corporate Efficiency & Containment/Anomaly branches + `ab_overclock` | M2 | Survey 2 |
| 12 | Achievements System (20+ Achievements) | Persistent achievements with `+5%` compounding global bonus each | M2 | Survey 2 |
| 13 | Golden Memo / Containment Anomaly Events | Periodic clickable targets (amber pre-sinister, crimson post-sinister) with buffs/bursts | M2 | Survey 2 |
| 14 | Expanded Cosmic-Horror Narrative | New narrative beats for Tiers 7–10, Restructures 2/3/5, and Anomaly events | M2 | Survey 2 |
| 15 | Floor B2: Security Perimeter (Idle Tower Defense) | Turret pads, 4 turret types, enemy waves + bosses, Scrap currency, Containment Integrity & Intel outputs | M3 | Survey 3 |
| 16 | Floor B4: Field Ops (RPG Auto-Battler) | 1–3 operative squad, 10-stage Sectors + bosses, stat upgrades, Containment Artifacts & salvage | M4 | Survey 3 |
| 17 | Floor B6: Synthesis Forge (Merge Grid) | 4×4/5×4 grid, Actuator Core spawning & merging (T1–T10+), Auto-Merge, Grid Aura & Forge Catalysts | M5 | Survey 3 |
| 18 | Full E2E Suite Pass & Tier 5 Hardening | Pass Tiers 1–4 E2E tests, run Tier 5 adversarial hardening, verify synced `idle_button.html` | M6 | Survey 1, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Architecture, State v3, Modifiers & UI Overhaul | Modularize JS, overhaul HTML/CSS layout & modals, Floor switcher shell, `build-standalone.mjs` | none | DONE (Iter 2: 14/14 tests, Chromium verified) |
| M2 | Rebalanced Economy, Multi-Prestige Boardroom & Content Expansion | Multi-prestige math, Boardroom tree, Tiers 7–10, 24+ upgrades, 12 R&D, 20+ achievements, Anomalies, narrative | M1 | DONE (23/23 unit, 6/6 smoke, Chromium verified) |
| M3 | Floor B2: Security Perimeter (Idle Tower Defense) | `js/floors/td.js` + UI + cross-floor bonuses & tests | M1, M2 | DONE (33/33 unit, 12/12 E2E, Chromium verified) |
| M4 | Floor B4: Field Ops (RPG Auto-Battler & Artifacts) | `js/floors/rpg.js` + UI + cross-floor bonuses & tests | M1, M2 | IN_PROGRESS |
| M5 | Floor B6: Synthesis Forge (Merge Grid & Catalysts) | `js/floors/merge.js` + UI + cross-floor bonuses & tests | M1, M2 | PLANNED |
| M6 | Final Milestone: E2E Pass (Tiers 1–4) & Tier 5 Hardening | Pass all E2E tests, Tier 5 adversarial hardening, final `idle_button.html` sync & verification | M3, M4, M5 | PLANNED |

## Interface Contracts

### `js/state.js` ↔ All Modules
- `SAVE_KEY = 'idle_button_v3_save'` (migrates `idle_button_v2_save` if present).
- `createInitialState(preserved)`: includes `version: 3`, `activeFloor: 'desk'`, `unlockedFloors: ['desk']`, `lifetimeShares`, `boardroomPerks: []`, `achievements: []`, `anomaliesCaught: 0`, `td: { wave, highestWave, scrap, overcharge, turrets, waveProgress }`, `rpg: { sector, stage, highestSector, credits, intel, shards, squad, artifacts, equipped }`, `merge: { grid, spawnerLevel, baseTier, autoMerge, catalysts, peakTier }`.
- `loadState()`, `saveState(state)`, `exportSave(state)`, `importSave(str)`, `resetAllState()`.

### `js/modifiers.js` ↔ `economy.js`, `floors/{td,rpg,merge}.js`
- `getCrossFloorBonuses(state)` returns pure object:
  `{ moneyMult, rpMult, clickMult, speedMult, tdDamageMult, tdFireRateMult, tdScrapMult, rpgAtkMult, rpgDefMult, rpgHpMult, mergeSpeedMult, sharePotencyMult }`.
- No floor module may import another floor module; all cross-floor effects flow through `getCrossFloorBonuses(state)` and `state`.

### `js/floors/{td,rpg,merge}.js` ↔ `js/game.js` & `js/ui.js`
- Each floor module exports:
  - `tick<Floor>(state, dt, bonuses)` — deterministic simulation step (safe for both `rAF` and offline catch-up / Node unit tests).
  - `render<Floor>(state, containerEl, handlers)` — full/structural render when active.
  - `update<Floor>UI(state, containerEl)` — lightweight per-frame dynamic updates.
  - `bind<Floor>Events(containerEl, getState, onAction)` — event delegation on the floor container.

### `scripts/build-standalone.mjs` ↔ Standalone Artifact
- Reads `index.html`, `styles.css`, and `js/**/*.js` in topological order, strips `import`/`export` syntax, wraps in an IIFE, and writes `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`.
- Must be run and verified at the end of every milestone.
