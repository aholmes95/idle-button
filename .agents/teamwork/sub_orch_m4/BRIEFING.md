# Milestone M4 Briefing: Floor B4 — Field Ops (RPG Auto-Battler & Artifacts)

## Mission
Implement Floor B4 (`js/floors/rpg.js`), integrate its cross-floor loops (`js/modifiers.js`, `js/state.js`, `js/game.js`, `js/ui.js`), build the Field Ops UI (`index.html`, `styles.css`, `js/floors/rpg.js`), add comprehensive Node ESM tests (`tests/floor_rpg_m4.test.js`), sync `idle_button.html` via `node scripts/build-standalone.mjs`, and verify both `index.html` and `idle_button.html` in headless Chromium with 0 console/page errors.

## Key References
- `ORIGINAL_REQUEST.md`: `/home/antigravity/aholmes95/idle-button/.agents/teamwork/ORIGINAL_REQUEST.md`
- `PROJECT.md`: `/home/antigravity/aholmes95/idle-button/PROJECT.md`
- `Survey 3`: `/home/antigravity/aholmes95/idle-button/.agents/teamwork/teamwork_preview_explorer_survey_3/handoff.md`

## Architecture & Interface Contracts
- `js/floors/rpg.js` must export:
  - `tickRPG(state, dt, bonuses)`
  - `renderRPG(state, containerEl, handlers)`
  - `updateRPGUI(state, containerEl)`
  - `bindRPGEvents(containerEl, getState, onAction)`
- No floor module may import another floor module; all cross-floor effects flow through `getCrossFloorBonuses(state)` in `js/modifiers.js` and `state`.
- `doRestructure()` resets run-level `rpg.sector`/`rpg.stage`/`rpg.squad` HP while preserving `rpg.artifacts`, `rpg.equipped`, `rpg.shards`, `rpg.highestSector`.
- `scripts/build-standalone.mjs` must bundle `js/floors/rpg.js` into `idle_button.html`.
