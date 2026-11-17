# Handoff Report — Explorer 1: Codebase, UI & Artifact Architecture

**Core Finding**: `idle-button` (v0.2) is a zero-build native ES-module web app (`index.html` + `styles.css` + 4 JS files under `js/`) with a monolithic 870-line `js/game.js` controller/renderer, a `localStorage` save (`idle_button_v2_save`) lacking schema versioning or offline progress, and a manually synced standalone artifact (`idle_button.html`) that has minor drift from the repo. Extending the game with cleaner UI, deeper scaling, and new portals/floors (Tower Defense, Combat, Merge) requires modularizing `js/game.js`, upgrading the layout/visual hierarchy, extending number formatting past `1e9`, and automating the `idle_button.html` build.

---

## 1. Observation

### 1.1 File & Module Architecture
- **Repository root** (`/home/antigravity/aholmes95/idle-button`):
  - `index.html` (144 lines): Loads Google Fonts (`Inter`, `IBM Plex Mono`, lines 8–10), `styles.css` (line 11), and `<script type="module" src="js/game.js"></script>` (line 141).
  - `README.md` (26 lines): Documents v0.2 features and local server launch (`python3 -m http.server 8080`, line 22).
  - `styles.css` (740 lines): Single stylesheet with CSS custom properties and responsive `@media (max-width: 860px)` rule (line 737).
  - `js/state.js` (76 lines): Exports `createInitialState`, `loadState`, `saveState`, `resetAllState`.
  - `js/data.js` (235 lines): Exports `GENERATORS`, `MILESTONES`, `MANAGERS`, `UPGRADES`, `RESEARCH_PROJECTS`, `ABILITIES`, `NARRATIVE_BEATS`.
  - `js/audio.js` (61 lines): Exports `playClickSound`, `playUnlockSound` using Web Audio API (`AudioContext`).
  - `js/game.js` (870 lines): Entry point. Imports from `./state.js`, `./audio.js`, `./data.js` (lines 1–11). Contains state instance, DOM element cache (`el`, lines 17–61), number formatting (`fmtMoney`, lines 63–67), economy/multiplier formulas (lines 69–193), actions (lines 246–374), full-DOM `render*` functions (lines 388–639), per-frame `updateDynamicUI()` (lines 641–725), `requestAnimationFrame(tick)` loop (lines 727–804), event listeners (lines 807–857), and boot sequence (lines 860–869).
- **Git history** (`git log -n 5 --oneline`):
  - `3206a24 Initial commit: Idle Button v0.1 (Act I)`
  - `a33be50 v0.2: Separate Upgrades tab, AdCap/AdCom divisions & managers, Magic Research lab, active protocols, and corporate-to-sinister narrative`

### 1.2 Save/Load Format & Versioning (`js/state.js`)
- `SAVE_KEY = 'idle_button_v2_save'` (`js/state.js:1`).
- `createInitialState(preserved = {})` (`js/state.js:3–38`) returns a plain JSON-serializable object with:
  - Scalars: `money`, `totalMoneyRun`, `totalMoneyAllTime`, `rp`, `presses`, `phase`, `sinisterRevealed`, `soundEnabled`, `buyMode`, `activeTab`, `shares`, `restructures`, `lastTick`.
  - Collections: `generators: {}`, `upgrades: []`, `completedResearch: []`, `activeResearch: null`, `abilities: {}`, `triggeredBeats: []`, `memos: []`.
- `loadState()` (`js/state.js:40–58`) parses JSON from `localStorage.getItem(SAVE_KEY)` and shallow-merges `{ ...createInitialState(), ...parsed, ... }` with fallback `{}`/`[]` for nested objects/arrays.
- **No `version` field** exists in the save object; no migration logic exists for older keys.
- `lastTick` is updated every 5000ms (`js/game.js:797–801`) and on `beforeunload` (`js/game.js:854–857`), **but `loadState()` / boot never computes offline elapsed time**.

### 1.3 UI Layout & CSS Design System (`index.html`, `styles.css`)
- **Color Palette (`styles.css:1–40`)**:
  - Default theme: `--bg-void: #0f1115`, `--bg-surface: #171a20`, `--bg-elevated: #1f242c`, `--border-hairline: #2a303a`, `--border-strong: #39424f`, `--text-primary: #edf0f4`, `--text-secondary: #98a2b0`, `--text-muted: #636d7a`, `--accent: #f0a43a`, `--good: #4ecb71`, `--info: #4da3ff`, `--danger: #e05252`.
  - Sinister theme (`body.is-sinister`, toggled at `res_compliance` completion): shifts backgrounds to `#0b0a0c` / `#131115` / `#1b181f` and replaces `--accent` with `--danger` (`#e05252`).
- **Typography**: `--font-sans: 'Inter', ...`, `--font-mono: 'IBM Plex Mono', ...` with `font-variant-numeric: tabular-nums` (`.mono`, lines 56–59).
- **Layout & Navigation**:
  - `.app-shell` (`max-width: 1220px`, `padding: 18px 22px 32px`, lines 64–71).
  - `.top-bar` (`index.html:16–32`): Brand cluster (`.status-led`, `BUTTONCORP™`, `.phase-tag`), `.top-stats` (`RP` and `SHARES` pills), `.top-controls` (`AUDIO: ON`, `RESET` text buttons). Hidden until `phase >= 1`.
  - `.workspace` (`index.html:35–138`, `styles.css:153–166`): Centered 1-column at `phase === 0`; switches to `.workspace.has-console` (`grid-template-columns: minmax(300px, 380px) 1fr; align-items: start;`) at `phase >= 1`. Collapses to `1fr` at `@media (max-width: 860px)`.
  - Left column: `.currency-card` → `.button-housing` (210×210px with 4 screws, 142px circular `.main-button`, `.floating-layer`) → `.abilities-bar` → `.memo-box` (`max-height: 220px` scroll).
  - Right column: `.tab-bar` (`OPERATIONS`, `UPGRADES` with count badge, `R&D LAB` with `!` badge, `RESTRUCTURE`) → `.tab-panel`s.

### 1.4 Standalone Artifact (`idle_button.html`)
- Path: `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (836 lines, 61,903 bytes).
- Structure: Single self-contained HTML file with all CSS inlined in `<style>` (lines 7–186) and all JS concatenated/condensed into a single `<script>(() => { ... })();</script>` IIFE (lines 294–833) so it runs without an HTTP server or ES module imports.
- **Drift vs. Repo**:
  1. Omits Google Fonts `<link>` tags (`index.html:8–10`), falling back to system fonts.
  2. Omits `id="app-shell"`, `id="button-housing"`, and `id="buy-mode-group"` present in `index.html`.
  3. Omits `window.addEventListener('beforeunload', ...)` (`js/game.js:854–857`), risking up to 5s of lost progress on tab close.
  4. Uses slightly renamed local functions (`playClick`/`playUnlock` vs `playClickSound`/`playUnlockSound`).

---

## 2. Logic Chain

1. **Monolithic `js/game.js` blocks multi-system expansion**: Because `js/game.js` (870 lines) directly owns DOM refs, math formulas, rendering, and the `rAF` loop, adding 3 new game modes (Tower Defense, Combat, Merge) plus deeper content into `game.js` would create severe coupling and merge conflicts. Splitting into domain modules (e.g., `js/economy.js`, `js/ui.js`, and feature modules `js/portals/defense.js`, `js/portals/combat.js`, `js/portals/merge.js`) is needed.
2. **UI layout & visual weaknesses to address in the overhaul**:
   - **Scrolling & sticky focus**: `.left-column` is not `position: sticky`, so tall right-column lists scroll the main button and currency readout off-screen.
   - **Flat visual hierarchy**: Division cards, upgrade cards, and research items all share identical `--bg-elevated` boxes with thin borders, no icons/emblems, no progress-ring or visual feedback on the button housing, and no clear separation between active/available vs. completed/owned items (owned upgrades and completed research remain inline at `opacity: 0.72` / `0.6`, cluttering lists as content grows).
   - **Navigation scalability**: A single flat `.tab-bar` cannot cleanly house 4 core management tabs *plus* 3 new game modes (Tower Defense, Battle/Combat, Merge). Grouping into primary **Facility Floors / Portals** (e.g., Corporate Floor vs. Sub-Level Portals) or a clean sidebar/top-level mode switcher will keep navigation uncluttered.
   - **Number formatting ceiling**: `fmtMoney` (`js/game.js:63–67`) only formats `M` (`1e6`) and `B` (`1e9`). Extending game scaling to Trillions+ will display raw unformatted huge numbers unless `T`, `Qa`, `Qi`, `Sx`, `Sp`, `Oc`, or scientific notation is added.
   - **Save robustness**: `state.js` lacks a `version` field and offline-progress calculation despite already saving `lastTick`. Adding `version` + migration + offline earnings summary + export/import (and replacing `confirm()` on Reset with an in-app modal) will make the UI cleaner and safer.
3. **Artifact sync drift**: Manual copy-pasting into `idle_button.html` already caused 4 small divergences. A deterministic build script (e.g., `scripts/build-standalone.mjs` or `scripts/build_standalone.py`) that reads `index.html`, inlines `styles.css`, strips ES `import`/`export` statements from JS modules in dependency order, wraps them in an IIFE, and writes `idle_button.html` eliminates drift permanently.

---

## 3. Caveats

- Inspected `idle_button.html` at lines 1–120, 170–420, and 760–836 (representative head, HTML body, data/state/audio, and tick/boot); did not read lines 421–759 line-by-line, though `wc -l` (835 lines) and matching structure confirm it is a condensed copy of `js/game.js` v0.2.
- Did not execute the app in a headless browser during this read-only survey.

---

## 4. Conclusion

1. **Refactor JS into clean ES modules** before or alongside adding new features: keep `js/data/` (or modular data files), `js/state.js` (add `version: 3`, migration from `idle_button_v2_save`, and offline-time calculation using `lastTick`), `js/audio.js`, `js/format.js` (extended suffixes beyond `B`), `js/ui/` (or `js/render.js` + modal/toast helpers), and dedicated modules for new portals/floors (Tower Defense, Combat, Merge), orchestrated by a lean `js/game.js` loop.
2. **Overhaul the UI & CSS**:
   - Make `.left-column` sticky on desktop (`position: sticky; top: 18px`) and widen `.app-shell` slightly (e.g. `1360px`–`1440px`) to support richer portal views.
   - Upgrade the visual polish of the button station (tactile ring/glow, combo/charge indicator, cleaner floating numbers) and cards (clearer typography, icons/badges, collapsible or separate "Completed/Owned" drawer to eliminate list clutter).
   - Introduce a two-tier navigation or **Floor / Portal Switcher** (e.g., `Main Floor` [Operations / Upgrades / R&D / Restructure] + unlockable `Portals / Sub-Levels` [Containment Defense, Breach Combat, Synthesis/Merge]) so new gameplay modes don't crowd the management tabs.
   - Replace `confirm()` reset with an in-app modal and add Save Export/Import.
3. **Automate `idle_button.html` generation** with a zero-dependency build script in the repo (e.g., `scripts/build-standalone.mjs` or `.py`) so every repo change can be synced to `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` in one command without drift.

---

## 5. Verification Method

- Inspect all referenced files directly:
  - `index.html`, `styles.css`, `js/state.js`, `js/data.js`, `js/audio.js`, `js/game.js`, `README.md`
  - `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`
- Verify git state: `git -C /home/antigravity/aholmes95/idle-button log -n 5 --oneline` (latest commit `a33be50`).
- **Invalidation condition**: Any new commits on `main` or edits to `idle_button.html` after `2026-11-17T16:37:00Z` would supersede these observations.
