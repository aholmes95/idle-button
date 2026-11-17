# Scope — Milestone M1 Owned Paths

## Owned / Modified Files
- `index.html`
- `styles.css`
- `js/format.js` (new)
- `js/state.js` (updated)
- `js/modifiers.js` (new)
- `js/economy.js` (new)
- `js/ui.js` (new)
- `js/game.js` (refactored)
- `scripts/build-standalone.mjs` (new)
- `tests/core_m1.test.js` (new)
- `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` (synced via build-standalone.mjs)

## Out of Scope for M1 (Deferred to M2–M5)
- M2: Multi-prestige formula rebalance (`pow(runMoney / 25000, 0.42)`), Boardroom 12-perk tree, Generators T7–T10, 24+ Upgrades, 12 R&D projects, 20+ Achievements, Anomalies. (M1 preserves v0.2 economy values while extracting them into pure functions in `economy.js` and stubbing v3 state fields).
- M3–M5: Full gameplay logic in `js/floors/td.js`, `js/floors/rpg.js`, `js/floors/merge.js` (M1 provides the Elevator Bar + mount containers `#floor-td`, `#floor-rpg`, `#floor-merge` with clean locked/coming-soon placeholders).
