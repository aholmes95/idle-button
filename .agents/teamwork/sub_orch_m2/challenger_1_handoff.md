# Challenger 1 Handoff — Milestone M2

**Verdict:** `PASS`

All 5 isolated adversarial Node probes executed via `/tmp/probe_m2.mjs` (against `js/game.js`, `js/economy.js`, `js/state.js`, `js/data.js`, `js/modifiers.js` with mocked DOM/storage/RAF) passed with zero failures and no dirty files left in the repository.

## Probe Results

1. **Boardroom Perk Spend vs. `lifetimeShares` & `getShareMultiplier`** — `PASS`
   - Output: `shares: 10 -> 9 -> 7, lifetimeShares: 10 (unchanged), getShareMultiplier: 2.875 -> 2.875 -> 2.875`
   - Verified buying `perk_golden_parachute` (cost 1) and `perk_severance` (cost 2) deducts `shares` while leaving `lifetimeShares` and `getShareMultiplier(state)` untouched.

2. **`doRestructure()` Perks (`perk_insider_trading`, `perk_golden_parachute`, `perk_severance`)** — `PASS`
   - Output: `res_vessel preserved only when researched; money=$500, phase=3, interns=10, mgr_intern=true, shares=7, lifetimeShares=22`
   - Verified `perk_insider_trading` does **not** grant `res_vessel` if it was not researched prior to restructure, and **does** preserve `res_vessel` (while resetting other research like `res_ergonomics`) when it was researched.
   - Verified `perk_golden_parachute` starts the run with `$500` (`totalMoneyRun === 500`) and `phase >= 2` (`phase === 3` after `checkPhasesAndNarrative()`).
   - Verified `perk_severance` starts the run with `10` Interns (`running: true`) and `mgr_intern` in `upgrades`.

3. **`buyBoardroomPerk` Prerequisites, Duplicate Prevention, Share Deduction, Floor Unlocks** — `PASS`
   - Output: `Prerequisites enforced, duplicate blocked, spent=133, unlockedFloors=["desk","td","rpg","merge"]`
   - Verified `perk_severance` and `perk_floor_defense` cannot be purchased before their prerequisites.
   - Verified re-clicking `perk_golden_parachute` does not duplicate it in `boardroomPerks` or double-deduct `shares`.
   - Verified buying `perk_floor_defense`, `perk_floor_arena`, and `perk_floor_merge` in sequence immediately adds `'td'`, `'rpg'`, and `'merge'` to `unlockedFloors`.

4. **`importSave` / `migrateState` Sanitization & Prototype Pollution Protection** — `PASS`
   - Output: `All negative/null/NaN/Infinity M2 fields rejected or sanitized; __proto__ & unknown keys stripped`
   - Verified `importSave` rejects negative and `null` values for `lifetimeShares`, `shares`, `restructures`, and `anomaliesCaught`.
   - Verified `importSave` strips `__proto__` (no `Object.prototype` pollution) and unknown keys at top-level, in `anomalyBuffs`, and inside `boardroomPerks` objects.
   - Verified `migrateState` sanitizes `NaN`, `Infinity`, `-Infinity`, and negative values in scalar M2 fields and `anomalyBuffs` (`outputMult`/`clickMult` clamped to `>= 1`, remaining durations clamped to `0`).

5. **Overclock Stacking & Cooldowns, `upg_neural_link`, `perk_offline_rig`** — `PASS`
   - Output: `speed=4.5x, ocCooldown=0, 2 clicks RP delta=1, offline=43200s @ 75%`
   - Verified `res_workflow` (1.2x) + `res_lean_six` (1.25x) + `ab_overclock` (3x) stack multiplicatively to `4.5x` with finite positive `getGenCycleTime` across all 10 generators.
   - Verified ticking `ab_overclock` through its full 12s active duration and 75s cooldown clamps cleanly to `0` with no `NaN` or negative cooldowns.
   - Verified `upg_neural_link` grants `+0.5 RP/click` at `phase >= 3` (`+1.0 RP` over 2 clicks).
   - Verified `perk_offline_rig` caps 24h elapsed offline time at `43200s` (`12h`) with `0.75` (`75%`) efficiency.
