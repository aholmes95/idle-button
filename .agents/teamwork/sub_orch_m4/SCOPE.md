# Milestone M4 Scope

## Owned Files
- `js/floors/rpg.js` (new)
- `js/state.js` (update `rpg` state schema, defaults, migration/preservation)
- `js/modifiers.js` (wire RPG inputs & outputs in `getCrossFloorBonuses`)
- `js/game.js` (tickRPG, RPG action handling, Restructure preservation, floor unlock checks)
- `js/ui.js` (render/update/bind `#floor-rpg`)
- `js/data.js` (if needed for R&D/narrative/floor unlock definitions)
- `index.html` (`#floor-rpg` container/mount point)
- `styles.css` (Field Ops dashboard styles, desktop + `@media (max-width: 860px)`, `body.is-sinister`)
- `scripts/build-standalone.mjs` (ensure `js/floors/rpg.js` is bundled if not already)
- `tests/floor_rpg_m4.test.js` (new Node ESM test suite)
- `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (synced via `build-standalone.mjs`)

## Out of Scope
- Floor B6 (`js/floors/merge.js`) implementation (Milestone M5) — only ensure `state.merge.catalysts` (or `catalystCells`) can safely receive Catalyst Cell drops from RPG Sector Bosses without breaking M5.
- Modifying M1/M2/M3 core mechanics except for clean integration with M4.
