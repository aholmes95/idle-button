# Milestone M2 Owned Paths & Scope

## Owned / Modified Files
- `js/data.js`
- `js/economy.js`
- `js/modifiers.js`
- `js/state.js` (only after M1 Iteration 2 confirmation)
- `js/ui.js`
- `js/game.js`
- `js/audio.js` (if anomaly/achievement SFX needed)
- `index.html`
- `styles.css`
- `tests/balance_m2.test.js`
- `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (via `node scripts/build-standalone.mjs`)

## Out of Scope (Do Not Implement Floor Internals)
- `js/floors/td.js`, `js/floors/rpg.js`, `js/floors/merge.js` (M3–M5; M2 only unlocks `'td'`, `'rpg'`, `'merge'` in `state.unlockedFloors` via Boardroom perks and updates elevator visibility).
