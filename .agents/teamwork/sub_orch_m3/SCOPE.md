# Milestone M3 Scope

## Owned Files (M3)
- `js/floors/td.js` (primary implementation)
- `js/modifiers.js` (Containment Integrity output + TD inputs)
- `js/state.js` (TD state fields, Restructure preservation, v3 defaults)
- `js/data.js` (TD unlock R&D/perk/narrative data if needed)
- `js/game.js` (`tickTD`, floor unlock checks, Restructure TD handling, TD action handlers)
- `js/ui.js` (`renderTD`, `updateTDUI`, `bindTDEvents`, `renderVisibility` for `B2: SECURITY`)
- `index.html` (`#floor-td` container / structure if needed)
- `styles.css` (Security Perimeter dashboard, radar/lane, turret cards, sinister & mobile styles)
- `tests/floor_td_m3.test.js` (unit & simulation tests)
- `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (via `node scripts/build-standalone.mjs`)

## Out of Scope
- Floor B4 (`js/floors/rpg.js`) and Floor B6 (`js/floors/merge.js`) full implementations (M4 and M5).
- Modifying `scripts/build-standalone.mjs` unless required for module bundling (check if `js/floors/td.js` is already in its module list).
