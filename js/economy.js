import { GENERATORS, MILESTONES, MILESTONE_MULTIPLIERS, ACHIEVEMENTS } from './data.js';
import { getCrossFloorBonuses } from './modifiers.js';

export const BASE_MAX_OFFLINE_SECONDS = 4 * 60 * 60;
export const RIG_MAX_OFFLINE_SECONDS = 12 * 60 * 60;
export const MAX_OFFLINE_SECONDS = BASE_MAX_OFFLINE_SECONDS;

export function hasUpgrade(state, id) {
  return Array.isArray(state.upgrades) && state.upgrades.includes(id);
}

export function hasResearch(state, id) {
  return Array.isArray(state.completedResearch) && state.completedResearch.includes(id);
}

export function hasPerk(state, id) {
  return Array.isArray(state.boardroomPerks) && state.boardroomPerks.includes(id);
}

export function isAbilityActive(state, id) {
  return (state.abilities?.[id]?.activeRemaining || 0) > 0;
}

export function getShareMultiplier(state, bonuses = getCrossFloorBonuses(state)) {
  const effectiveShares = Math.max(state.lifetimeShares || 0, state.shares || 0);
  const perShare = 0.15
    + (hasPerk(state, 'perk_insider_trading') ? 0.15 : 0)
    + (hasResearch(state, 'res_vessel') ? 0.15 : 0);
  const restructures = state.restructures || 0;
  const restructureMult = (1 + 0.25 * restructures)
    * (hasPerk(state, 'perk_synergy_core') ? Math.pow(1.5, restructures) : 1);
  return 1 + effectiveShares * perShare * restructureMult * (bonuses.sharePotencyMult || 1);
}

export function getGlobalMultiplier(state, bonuses = getCrossFloorBonuses(state)) {
  let mult = getShareMultiplier(state, bonuses) * (bonuses.moneyMult || 1);
  if (hasUpgrade(state, 'upg_synergy')) mult *= 1.5;
  if (hasUpgrade(state, 'upg_compliance')) mult *= 2;
  if (hasUpgrade(state, 'upg_all_synergy_2')) mult *= 3;
  if (hasUpgrade(state, 'upg_all_synergy_3')) mult *= 5;
  if (hasResearch(state, 'res_acoustics')) mult *= 1.5;
  if (hasResearch(state, 'res_compliance')) mult *= 2;
  if (hasResearch(state, 'res_quantum_payroll')) mult *= 3;
  if (hasResearch(state, 'res_cosmic_audit')) mult *= 5;
  if (isAbilityActive(state, 'ab_rush')) mult *= 2;
  if ((state.anomalyBuffs?.outputRemaining || 0) > 0) {
    mult *= Math.max(1, state.anomalyBuffs.outputMult || 1);
  }
  return mult;
}

export function getSpeedMultiplier(state, bonuses = getCrossFloorBonuses(state)) {
  let mult = bonuses.speedMult || 1;
  if (hasResearch(state, 'res_workflow')) mult *= 1.2;
  if (hasResearch(state, 'res_lean_six')) mult *= 1.25;
  if (isAbilityActive(state, 'ab_overclock')) mult *= 3;
  return mult;
}

export function getRpMultiplier(state, bonuses = getCrossFloorBonuses(state)) {
  let mult = bonuses.rpMult || 1;
  if (isAbilityActive(state, 'ab_syphon')) mult *= 2;
  if (hasPerk(state, 'perk_fast_track')) mult *= 1.5;
  if (hasResearch(state, 'res_deep_bore')) mult *= 2;
  return mult;
}

export function getGenMilestoneMult(owned, hasAutomatedKpi = false) {
  let mult = 1;
  for (const m of MILESTONES) {
    if (owned >= m) {
      const base = MILESTONE_MULTIPLIERS[m] || 2;
      mult *= hasAutomatedKpi ? base * 1.25 : base;
    }
  }
  return mult;
}

export function getGenPayout(state, gen, bonuses = getCrossFloorBonuses(state)) {
  const owned = state.generators[gen.id]?.owned || 0;
  if (owned === 0) return 0;
  let mult = getGlobalMultiplier(state, bonuses) * getGenMilestoneMult(owned, hasResearch(state, 'res_automated_kpi'));

  if (gen.id === 'intern') {
    if (hasUpgrade(state, 'upg_intern_manual')) mult *= 2;
    if (hasUpgrade(state, 'upg_intern_coffee')) mult *= 3;
    if (hasUpgrade(state, 'upg_intern_conduit')) {
      mult *= 1 + 0.25 * (state.generators.conduit?.owned || 0);
    }
  } else if (gen.id === 'bird') {
    if (hasUpgrade(state, 'upg_bird_oil')) mult *= 2;
    if (hasUpgrade(state, 'upg_bird_counterweight')) mult *= 3;
  } else if (gen.id === 'solenoid') {
    if (hasUpgrade(state, 'upg_solenoid_amp')) mult *= 2;
    if (hasUpgrade(state, 'upg_solenoid_quantum')) mult *= 3;
  } else if (gen.id === 'pod') {
    if (hasUpgrade(state, 'upg_pod_script')) mult *= 2;
    if (hasUpgrade(state, 'upg_pod_hive')) mult *= 3;
  } else if (gen.id === 'sublevel') {
    if (hasUpgrade(state, 'upg_sublevel_coolant')) mult *= 2;
    if (hasUpgrade(state, 'upg_sublevel_deep')) mult *= 3;
  } else if (gen.id === 'conduit') {
    if (hasUpgrade(state, 'upg_conduit_tuning')) mult *= 2;
  } else if (gen.id === 'resonance') {
    if (hasUpgrade(state, 'upg_resonance_crystal')) mult *= 2;
    if (hasUpgrade(state, 'upg_bird_resonance')) {
      mult *= 1 + 0.05 * (state.generators.bird?.owned || 0);
    }
  } else if (gen.id === 'archive') {
    if (hasUpgrade(state, 'upg_archive_index')) mult *= 2;
  } else if (gen.id === 'rift') {
    if (hasUpgrade(state, 'upg_rift_stabilizer')) mult *= 2;
  } else if (gen.id === 'board') {
    if (hasUpgrade(state, 'upg_board_quorum')) mult *= 2;
  }

  return gen.basePayout * owned * mult;
}

export function getGenCycleTime(state, gen, bonuses = getCrossFloorBonuses(state)) {
  return gen.cycleTime / getSpeedMultiplier(state, bonuses);
}

export function getPassiveMoneyRate(state, bonuses = getCrossFloorBonuses(state)) {
  let total = 0;
  for (const gen of GENERATORS) {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned > 0 && hasUpgrade(state, gen.managerId)) {
      total += getGenPayout(state, gen, bonuses) / getGenCycleTime(state, gen, bonuses);
    }
  }
  return total;
}

export function getPassiveRpRate(state, bonuses = getCrossFloorBonuses(state)) {
  if (state.phase < 3) return 0;
  let total = 0;
  const rpMult = getRpMultiplier(state, bonuses);
  for (const gen of GENERATORS) {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned > 0 && hasUpgrade(state, gen.managerId)) {
      total += (gen.rpPerCycle * owned * rpMult) / getGenCycleTime(state, gen, bonuses);
    }
  }
  return total;
}

export function getClickValue(state, bonuses = getCrossFloorBonuses(state)) {
  let base = 1 + (hasUpgrade(state, 'upg_keycap') ? 1 : 0);
  if (hasUpgrade(state, 'upg_espresso')) base *= 2;
  if (hasResearch(state, 'res_ergonomics')) base *= 1.5;
  base *= getShareMultiplier(state, bonuses);
  base *= bonuses.clickMult || 1;
  if (isAbilityActive(state, 'ab_rush')) base *= 2;
  if (isAbilityActive(state, 'ab_syphon')) base *= 3;
  if ((state.anomalyBuffs?.clickRemaining || 0) > 0) {
    base *= Math.max(1, state.anomalyBuffs.clickMult || 1);
  }
  if (hasResearch(state, 'res_cosmic_audit')) base *= 5;

  let pctOfPassive = 0;
  if (hasUpgrade(state, 'upg_tether')) pctOfPassive += 0.02;
  if (hasUpgrade(state, 'upg_kinetic_grid')) pctOfPassive += 0.03;
  if (hasUpgrade(state, 'upg_neural_link')) pctOfPassive += 0.05;
  if (hasPerk(state, 'perk_bulk_discount')) pctOfPassive += 0.01;
  if (pctOfPassive > 0) {
    base += getPassiveMoneyRate(state, bonuses) * pctOfPassive;
  }
  return base;
}

export function getGenCostMult(state) {
  return hasPerk(state, 'perk_bulk_discount') ? 0.9 : 1;
}

export function getBulkCost(gen, owned, count, costMult = 1) {
  const r = gen.costScale;
  const first = gen.baseCost * costMult * Math.pow(r, owned);
  if (count === 1) return Math.round(first);
  return Math.round(first * ((Math.pow(r, count) - 1) / (r - 1)));
}

export function getMaxAffordable(gen, owned, money, costMult = 1) {
  let count = 0;
  let total = 0;
  let nextCost = Math.round(gen.baseCost * costMult * Math.pow(gen.costScale, owned));
  while (total + nextCost <= money && count < 500) {
    total += nextCost;
    count++;
    nextCost = Math.round(gen.baseCost * costMult * Math.pow(gen.costScale, owned + count));
  }
  return { count, cost: total };
}

export function getBuyInfo(state, gen) {
  const owned = state.generators[gen.id]?.owned || 0;
  const costMult = getGenCostMult(state);
  if (state.buyMode === '1') {
    return { count: 1, cost: getBulkCost(gen, owned, 1, costMult) };
  }
  if (state.buyMode === '10') {
    return { count: 10, cost: getBulkCost(gen, owned, 10, costMult) };
  }
  const max = getMaxAffordable(gen, owned, state.money, costMult);
  if (max.count === 0) {
    return { count: 1, cost: getBulkCost(gen, owned, 1, costMult), cantAffordMax: true };
  }
  return max;
}

export function getResearchDuration(state, proj) {
  return proj.duration * (hasPerk(state, 'perk_fast_track') ? 0.6 : 1);
}

export function getPendingShares(state) {
  if (state.totalMoneyRun < 25000) return 0;
  return Math.floor(Math.pow(state.totalMoneyRun / 25000, 0.42));
}

export function calculateOfflineEarnings(state, nowMs = Date.now(), bonuses = getCrossFloorBonuses(state)) {
  const last = typeof state.lastTick === 'number' ? state.lastTick : nowMs;
  const rawElapsed = Math.max(0, (nowMs - last) / 1000);
  const hasRig = hasPerk(state, 'perk_offline_rig');
  const maxOffline = hasRig ? RIG_MAX_OFFLINE_SECONDS : BASE_MAX_OFFLINE_SECONDS;
  const efficiency = hasRig ? 0.75 : 0.25;
  const elapsedSec = Math.min(rawElapsed, maxOffline);
  const moneyEarned = getPassiveMoneyRate(state, bonuses) * elapsedSec * efficiency;
  const rpEarned = getPassiveRpRate(state, bonuses) * elapsedSec * efficiency;
  return {
    elapsedSec,
    moneyEarned,
    rpEarned,
    efficiency,
    maxHours: hasRig ? 12 : 4,
    capped: rawElapsed > maxOffline
  };
}

export function checkAchievements(state) {
  if (!Array.isArray(state.achievements)) state.achievements = [];
  const unlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (!state.achievements.includes(ach.id) && ach.condition(state)) {
      state.achievements.push(ach.id);
      unlocked.push(ach);
    }
  }
  return unlocked;
}
