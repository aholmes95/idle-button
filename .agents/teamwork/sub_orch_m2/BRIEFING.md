# Milestone M2 Briefing: Rebalanced Economy, Multi-Prestige Boardroom & Content Expansion

## Objective
Expand ButtonCorp™ (`idle-button`) on top of M1's modular architecture with:
1. **Multi-Prestige Scaling & Rebalance** (`js/data.js`, `js/economy.js`, `js/game.js`, `js/state.js`):
   - `pendingShares(runMoney) = runMoney < 25000 ? 0 : Math.floor(Math.pow(runMoney / 25000, 0.42))`
   - `lifetimeShares` (never decreases when spending `shares` in Boardroom) + `shares` (spendable).
   - `getShareMultiplier(state)`: each `lifetimeShare` grants `+15%` base (`+30%` with `perk_insider_trading`), multiplied by `1 + 0.25 * restructures` (and `1.5x` per restructure if `perk_synergy_core` is owned), plus `bonuses.sharePotencyMult` from `modifiers.js`.
   - Fix `res_vessel` regression via `perk_insider_trading` keeping `res_vessel` permanent across Restructures (or permanent Share bonus upgrade).
   - `doRestructure()` preserves `shares`, `lifetimeShares`, `restructures`, `boardroomPerks`, `achievements`, `unlockedFloors`, `anomaliesCaught`, `totalMoneyAllTime`, `sinisterRevealed`, `soundEnabled`, and applies starting boosts (`perk_golden_parachute` -> `$500` & `phase = 2`; `perk_severance` -> `10` Interns & `mgr_intern` auto-hired).
2. **Boardroom Skill Tree (12 Perks)** (`BOARDROOM_PERKS` in `js/data.js`, UI in Restructure tab):
   - `perk_golden_parachute` (1), `perk_severance` (2, req `perk_golden_parachute`), `perk_insider_trading` (3), `perk_fast_track` (4, req `perk_insider_trading`), `perk_bulk_discount` (5, req `perk_severance`), `perk_auto_mgr` (8, req `perk_bulk_discount`), `perk_anomaly_attractor` (6, req `perk_fast_track`), `perk_offline_rig` (5, req `perk_golden_parachute`), `perk_synergy_core` (12, req `perk_auto_mgr`), `perk_floor_defense` (15, req `perk_synergy_core`, unlocks `'td'`), `perk_floor_arena` (30, req `perk_floor_defense`, unlocks `'rpg'`), `perk_floor_merge` (60, req `perk_floor_arena`, unlocks `'merge'`).
   - Note: Ensure `unlockedFloors` uses `'td'`, `'rpg'`, `'merge'` (matching `index.html` / `PROJECT.md` floor IDs!).
3. **Expanded Generators (Tiers 7–10) & Milestones**:
   - Tiers 7–10: `resonance` ($1.2M), `archive` ($18M), `rift` ($300M), `board` ($6.5B) + managers.
   - `MILESTONES = [10, 25, 50, 100, 150, 200, 300, 500]` with tiered `2x` / `3x` / `4x` multipliers.
4. **Expanded Upgrades (24+) & Cross-Synergies**:
   - Generator-specific 2x/3x upgrades, click `% $/sec` scaling (`upg_kinetic_grid`, `upg_neural_link` with `+0.5 RP/click`), and cross-division synergies (`upg_intern_conduit`, `upg_bird_resonance`, `upg_all_synergy_2`, `upg_all_synergy_3`, etc.).
5. **Expanded R&D Lab (12 Projects, 2 Branches) & 4th Active Protocol**:
   - Branch A: `res_lean_six`, `res_automated_kpi`, `res_quantum_payroll`.
   - Branch B: `res_anomaly_harness`, `res_protocol_overclock` (unlocks `ab_overclock`: 3x cycles for 12s, 75s CD), `res_deep_bore`, `res_cosmic_audit`.
6. **Achievements System (20+ Achievements) & UI**:
   - `ACHIEVEMENTS` in `js/data.js`, `checkAchievements(state)` in `js/economy.js` / `js/game.js`, `+5%` multiplicative global output each (`Math.pow(1.05, state.achievements.length)`).
   - Achievements tab/section in Right Console.
7. **Golden Memo / Containment Anomaly Events & Expanded Narrative**:
   - Every `60–120s` (2x faster with `perk_anomaly_attractor`), spawn clickable floater for `12s` (+50% duration with `perk_anomaly_attractor`).
   - 8–10 new cosmic-horror narrative beats for Tiers 7–10, Restructures 2/3/5, and Anomaly clicks.
8. **Standalone Sync & Verification**:
   - `node scripts/build-standalone.mjs` -> sync `idle_button.html`.
   - `tests/balance_m2.test.js` (`node --test`) + `tests/core_m1.test.js` still passing.
   - Headless Chromium verification of `index.html` and `idle_button.html` with 0 console/page errors.
