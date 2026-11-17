import {
  loadState,
  saveState,
  createInitialState,
  resetAllState,
  exportSave,
  importSave
} from './state.js';
import {
  playClickSound,
  playUnlockSound,
  playAnomalySound,
  playAchievementSound
} from './audio.js';
import {
  GENERATORS,
  MANAGERS,
  RESEARCH_PROJECTS,
  ABILITIES,
  BOARDROOM_PERKS,
  NARRATIVE_BEATS
} from './data.js';
import { getCrossFloorBonuses } from './modifiers.js';
import {
  hasUpgrade,
  hasResearch,
  hasPerk,
  isAbilityActive,
  getGenPayout,
  getGenCycleTime,
  getPassiveMoneyRate,
  getPassiveRpRate,
  getRpMultiplier,
  getClickValue,
  getBuyInfo,
  getResearchDuration,
  getPendingShares,
  calculateOfflineEarnings,
  checkAchievements
} from './economy.js';
import { fmtMoney, fmtNumber } from './format.js';
import {
  cacheElements,
  el,
  spawnFloat,
  pulseLed,
  pulseButtonRing,
  decayButtonRing,
  switchTab,
  switchFloor,
  renderFloorSwitcher,
  renderVisibility,
  renderGenerators,
  renderUpgrades,
  renderResearch,
  renderAbilities,
  renderAchievements,
  renderPrestige,
  renderMemos,
  renderAll,
  updateDynamicUI,
  openModal,
  closeModal,
  closeAllModals,
  showOfflineModal,
  showExportImportModal,
  spawnAnomalyFloater,
  clearAnomalyFloater
} from './ui.js';
import {
  tickTD,
  renderTD,
  updateTDUI,
  bindTDEvents,
  tdBuyPad,
  tdPlaceTurret,
  tdUpgradeTurret,
  tdSalvageTurret,
  tdTriggerOvercharge,
  tdToggleAutoWave,
  tdAdvanceWave
} from './floors/td.js';
import {
  tickRPG,
  renderRPG,
  updateRPGUI,
  bindRPGEvents
} from './floors/rpg.js';
import {
  tickMerge,
  renderMerge,
  updateMergeUI,
  bindMergeEvents
} from './floors/merge.js';

let state = loadState();
let lastFrame = performance.now();
let lastSave = performance.now();

let anomalySpawnRemaining = 14 + Math.random() * 6;
let anomalyActiveRemaining = 0;

const handlers = {
  onBuyGenerator: buyGenerator,
  onRunGenerator: runGenerator,
  onBuyUpgrade: buyUpgradeOrManager,
  onStartResearch: startResearch,
  onTriggerAbility: triggerAbility,
  onRestructure: doRestructure,
  onBuyPerk: buyBoardroomPerk
};

function addMemo(text, type = 'fun') {
  state.memos.unshift({ time: new Date().toTimeString().slice(0, 8), text, type });
  if (state.memos.length > 50) state.memos.length = 50;
  renderMemos(state);
}

function processAchievements() {
  const newlyUnlocked = checkAchievements(state);
  if (newlyUnlocked.length === 0) return;
  for (const ach of newlyUnlocked) {
    addMemo(`Achievement Unlocked: ${ach.name} (+5% Global Output)`, 'system');
  }
  playAchievementSound(state.soundEnabled);
  renderAchievements(state);
  renderGenerators(state, handlers);
  renderPrestige(state, handlers);
  saveState(state);
}

function checkPhasesAndNarrative() {
  let changed = false;

  if (state.phase < 1 && state.presses >= 5) { state.phase = 1; changed = true; }
  if (state.phase < 2 && state.totalMoneyRun >= 25) { state.phase = 2; changed = true; }
  if (state.phase < 3 && state.totalMoneyRun >= 200) { state.phase = 3; changed = true; }
  if (hasResearch(state, 'res_compliance')) {
    if (state.phase < 4) { state.phase = 4; changed = true; }
    if (!state.sinisterRevealed) { state.sinisterRevealed = true; changed = true; }
  }

  for (const beat of NARRATIVE_BEATS) {
    if (!state.triggeredBeats.includes(beat.id) && beat.condition(state)) {
      state.triggeredBeats.push(beat.id);
      addMemo(beat.text, beat.type);
      changed = true;
    }
  }

  if (changed) {
    playUnlockSound(state.soundEnabled);
    renderVisibility(state);
    renderFloorSwitcher(state);
    renderGenerators(state, handlers);
    renderUpgrades(state, handlers);
    renderResearch(state, handlers);
    renderAbilities(state, handlers);
    renderPrestige(state, handlers);
  }
}

function handlePress() {
  const bonuses = getCrossFloorBonuses(state);
  const gain = getClickValue(state, bonuses);
  state.money += gain;
  state.totalMoneyRun += gain;
  state.totalMoneyAllTime += gain;
  state.presses += 1;

  if (hasUpgrade(state, 'upg_neural_link') && state.phase >= 3) {
    state.rp += 0.5;
  }

  playClickSound(state.soundEnabled, Math.min(state.presses * 0.4, 35));
  spawnFloat(gain);
  pulseLed();
  pulseButtonRing();
  processAchievements();
  checkPhasesAndNarrative();
  updateDynamicUI(state);
}

function buyGenerator(genId) {
  const gen = GENERATORS.find((g) => g.id === genId);
  if (!gen) return;
  const info = getBuyInfo(state, gen);
  if (info.cantAffordMax || state.money < info.cost) return;

  state.money -= info.cost;
  if (!state.generators[genId]) {
    state.generators[genId] = { owned: 0, progress: 0, running: false };
  }
  state.generators[genId].owned += info.count;
  if (hasUpgrade(state, gen.managerId)) {
    state.generators[genId].running = true;
  }

  playUnlockSound(state.soundEnabled);
  processAchievements();
  checkPhasesAndNarrative();
  renderGenerators(state, handlers);
  renderUpgrades(state, handlers);
  updateDynamicUI(state);
  saveState(state);
}

function runGenerator(genId) {
  const gs = state.generators[genId];
  if (!gs || gs.owned === 0 || gs.running) return;
  gs.running = true;
  gs.progress = 0;
  playClickSound(state.soundEnabled, 10);
  updateDynamicUI(state);
}

function buyUpgradeOrManager(id, cost) {
  if (hasUpgrade(state, id) || state.money < cost) return;
  state.money -= cost;
  state.upgrades.push(id);

  const mgr = MANAGERS.find((m) => m.id === id);
  if (mgr && state.generators[mgr.targetGen]?.owned > 0) {
    state.generators[mgr.targetGen].running = true;
  }

  playUnlockSound(state.soundEnabled);
  processAchievements();
  checkPhasesAndNarrative();
  renderGenerators(state, handlers);
  renderUpgrades(state, handlers);
  updateDynamicUI(state);
  saveState(state);
}

function startResearch(id) {
  if (state.activeResearch || hasResearch(state, id)) return;
  const proj = RESEARCH_PROJECTS.find((r) => r.id === id);
  if (!proj || state.rp < proj.rpCost) return;
  state.rp -= proj.rpCost;
  state.activeResearch = { id, elapsed: 0 };
  playUnlockSound(state.soundEnabled);
  renderResearch(state, handlers);
  updateDynamicUI(state);
  saveState(state);
}

function triggerAbility(id) {
  const ab = ABILITIES.find((a) => a.id === id);
  if (!ab) return;
  const abState = state.abilities[id] || { activeRemaining: 0, cooldownRemaining: 0 };
  if (abState.cooldownRemaining > 0) return;

  const bonuses = getCrossFloorBonuses(state);
  if (id === 'ab_surge') {
    const burst = Math.max(getClickValue(state, bonuses) * 5, getPassiveMoneyRate(state, bonuses) * 15);
    state.money += burst;
    state.totalMoneyRun += burst;
    state.totalMoneyAllTime += burst;
    spawnFloat(burst);
  }

  state.abilities[id] = {
    activeRemaining: ab.duration,
    cooldownRemaining: ab.cooldown
  };
  playUnlockSound(state.soundEnabled);
  renderAbilities(state, handlers);
  updateDynamicUI(state);
}

function buyBoardroomPerk(perkId) {
  const perk = BOARDROOM_PERKS.find((p) => p.id === perkId);
  if (!perk || hasPerk(state, perkId)) return;
  if (perk.requires && !hasPerk(state, perk.requires)) return;
  if (state.shares < perk.cost) return;

  state.shares -= perk.cost;
  state.boardroomPerks.push(perk.id);

  if (perk.unlockFloor && !state.unlockedFloors.includes(perk.unlockFloor)) {
    state.unlockedFloors.push(perk.unlockFloor);
    renderFloorSwitcher(state);
    if (perk.unlockFloor === 'td') {
      renderTD(state, el.floorTd, handlers);
    }
    addMemo(`Facility Portal Unlocked: ${perk.name}`, 'system');
  } else {
    addMemo(`Boardroom Directive Acquired: ${perk.name}`, 'system');
  }

  playUnlockSound(state.soundEnabled);
  renderPrestige(state, handlers);
  renderResearch(state, handlers);
  renderGenerators(state, handlers);
  updateDynamicUI(state);
  saveState(state);
}

function doRestructure() {
  const pending = getPendingShares(state);
  if (pending <= 0) return;

  const keepVessel = hasPerk(state, 'perk_insider_trading') && hasResearch(state, 'res_vessel');
  const hasParachute = hasPerk(state, 'perk_golden_parachute');
  const hasSeverance = hasPerk(state, 'perk_severance');

  const nextShares = state.shares + pending;
  const preserved = {
    shares: nextShares,
    lifetimeShares: Math.max(state.lifetimeShares || 0, state.shares || 0) + pending,
    restructures: state.restructures + 1,
    totalMoneyAllTime: state.totalMoneyAllTime,
    sinisterRevealed: true,
    soundEnabled: state.soundEnabled,
    unlockedFloors: state.unlockedFloors,
    boardroomPerks: state.boardroomPerks,
    achievements: state.achievements,
    anomaliesCaught: state.anomaliesCaught,
    td: {
      highestWave: state.td?.highestWave || 0,
      unlockedPads: state.td?.unlockedPads || 4,
      autoWave: state.td?.autoWave !== undefined ? state.td.autoWave : true,
      bossMilestonesClaimed: Array.isArray(state.td?.bossMilestonesClaimed)
        ? [...state.td.bossMilestonesClaimed]
        : []
    },
    rpg: {
      highestSector: state.rpg?.highestSector || 1,
      shards: state.rpg?.shards || 0,
      artifacts: state.rpg?.artifacts || [],
      equipped: state.rpg?.equipped || []
    },
    merge: {
      catalysts: state.merge?.catalysts || 0,
      peakTier: state.merge?.peakTier || 0
    }
  };
  state = createInitialState(preserved);
  state.phase = 1;

  if (keepVessel) {
    state.completedResearch.push('res_vessel');
  }
  if (hasParachute) {
    state.money = 500;
    state.totalMoneyRun = 500;
    state.phase = 2;
  }
  if (hasSeverance) {
    state.generators.intern = { owned: 10, progress: 0, running: true };
    if (!state.upgrades.includes('mgr_intern')) {
      state.upgrades.push('mgr_intern');
    }
  }

  clearAnomalyFloater();
  anomalyActiveRemaining = 0;
  anomalySpawnRemaining = getNextAnomalyInterval();

  addMemo(`Cycle #${state.restructures} initialized. +${pending} Share(s) retained. The floor remembers.`, 'sinister');
  playUnlockSound(state.soundEnabled);
  processAchievements();
  checkPhasesAndNarrative();
  renderAll(state, handlers);
  if (state.unlockedFloors.includes('td')) {
    renderTD(state, el.floorTd, handlers);
  }
  updateDynamicUI(state);
  saveState(state);
}

function getNextAnomalyInterval() {
  const base = 45 + Math.random() * 45;
  return hasPerk(state, 'perk_anomaly_attractor') ? base * 0.5 : base;
}

function handleAnomalyClick() {
  anomalyActiveRemaining = 0;
  anomalySpawnRemaining = getNextAnomalyInterval();
  state.anomaliesCaught = (state.anomaliesCaught || 0) + 1;

  const bonuses = getCrossFloorBonuses(state);
  const rewardMult = hasResearch(state, 'res_anomaly_harness') ? 2 : 1;

  if (!state.sinisterRevealed) {
    if (Math.random() < 0.5) {
      const burst = Math.max(getClickValue(state, bonuses) * 25, getPassiveMoneyRate(state, bonuses) * 30) * rewardMult;
      state.money += burst;
      state.totalMoneyRun += burst;
      state.totalMoneyAllTime += burst;
      spawnFloat(burst);
      addMemo(`Urgent Executive Memo — Quarterly Bonus: +${fmtMoney(burst)}`, 'fun');
    } else {
      state.anomalyBuffs.clickMult = 5;
      state.anomalyBuffs.clickRemaining = 20;
      state.anomalyBuffs.outputMult = 2;
      state.anomalyBuffs.outputRemaining = 20;
      addMemo('Urgent Executive Memo — Caffeine Surge: 5x click & 2x division output for 20s!', 'fun');
    }
  } else {
    const roll = Math.random();
    if (roll < 0.34) {
      state.anomalyBuffs.outputMult = 7;
      state.anomalyBuffs.outputRemaining = 15;
      addMemo('Containment Anomaly — Reality Fracture: 7x all output for 15s!', 'sinister');
    } else if (roll < 0.67) {
      const moneyBurst = Math.max(getClickValue(state, bonuses) * 30, getPassiveMoneyRate(state, bonuses) * 45) * rewardMult;
      const rpBurst = Math.max(10 * rewardMult, getPassiveRpRate(state, bonuses) * 20 * rewardMult);
      state.money += moneyBurst;
      state.totalMoneyRun += moneyBurst;
      state.totalMoneyAllTime += moneyBurst;
      if (state.phase >= 3) state.rp += rpBurst;
      spawnFloat(moneyBurst);
      addMemo(`Containment Anomaly — Data Leak: +${fmtMoney(moneyBurst)}${state.phase >= 3 ? ` & +${fmtNumber(rpBurst, 1)} RP` : ''}`, 'sinister');
    } else {
      for (const id of Object.keys(state.abilities)) {
        if (state.abilities[id].cooldownRemaining > 0) {
          state.abilities[id].cooldownRemaining *= 0.5;
        }
      }
      addMemo('Containment Anomaly — Rift Echo: All Active Protocol cooldowns reduced by 50%!', 'sinister');
    }
  }

  playAnomalySound(state.soundEnabled, !!state.sinisterRevealed);
  processAchievements();
  checkPhasesAndNarrative();
  updateDynamicUI(state);
  saveState(state);
}

function applyOfflineProgress() {
  const bonuses = getCrossFloorBonuses(state);
  const offline = calculateOfflineEarnings(state, Date.now(), bonuses);
  state.lastTick = Date.now();
  let tdCleared = 0;
  if (state.unlockedFloors.includes('td') && offline.elapsedSec > 0) {
    const tdRes = tickTD(state, offline.elapsedSec * (offline.efficiency || 0.25), bonuses);
    tdCleared = tdRes.wavesCleared;
  }
  if (offline.elapsedSec > 60 && (offline.moneyEarned > 0 || offline.rpEarned > 0 || tdCleared > 0)) {
    state.money += offline.moneyEarned;
    state.totalMoneyRun += offline.moneyEarned;
    state.totalMoneyAllTime += offline.moneyEarned;
    state.rp += offline.rpEarned;
    processAchievements();
    checkPhasesAndNarrative();
    if (state.unlockedFloors.includes('td')) {
      renderTD(state, el.floorTd, handlers);
    }
    showOfflineModal(offline);
    saveState(state);
  }
}

function tick(now) {
  const dt = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

  decayButtonRing(dt);

  const bonuses = getCrossFloorBonuses(state);

  // Tick temporary anomaly buffs
  if (state.anomalyBuffs) {
    if (state.anomalyBuffs.outputRemaining > 0) {
      state.anomalyBuffs.outputRemaining = Math.max(0, state.anomalyBuffs.outputRemaining - dt);
      if (state.anomalyBuffs.outputRemaining === 0) state.anomalyBuffs.outputMult = 1;
    }
    if (state.anomalyBuffs.clickRemaining > 0) {
      state.anomalyBuffs.clickRemaining = Math.max(0, state.anomalyBuffs.clickRemaining - dt);
      if (state.anomalyBuffs.clickRemaining === 0) state.anomalyBuffs.clickMult = 1;
    }
  }

  // Tick HR Algorithm auto-manager hiring
  if (hasPerk(state, 'perk_auto_mgr')) {
    for (const m of MANAGERS) {
      if (!hasUpgrade(state, m.id) && (state.generators[m.targetGen]?.owned || 0) > 0 && state.money >= m.cost) {
        buyUpgradeOrManager(m.id, m.cost);
      }
    }
  }

  // Tick abilities
  let abilityChanged = false;
  for (const id of Object.keys(state.abilities)) {
    const ab = state.abilities[id];
    if (ab.activeRemaining > 0) {
      ab.activeRemaining = Math.max(0, ab.activeRemaining - dt);
      if (ab.activeRemaining === 0) abilityChanged = true;
    }
    if (ab.cooldownRemaining > 0) {
      ab.cooldownRemaining = Math.max(0, ab.cooldownRemaining - dt);
    }
  }

  // Tick generators
  let earnedCycle = false;
  const rpMult = getRpMultiplier(state, bonuses);
  for (const gen of GENERATORS) {
    const gs = state.generators[gen.id];
    if (!gs || gs.owned === 0) continue;
    const hasMgr = hasUpgrade(state, gen.managerId);
    if (hasMgr) gs.running = true;
    if (!gs.running) continue;

    const cycle = getGenCycleTime(state, gen, bonuses);
    gs.progress += dt;
    if (gs.progress >= cycle) {
      const cycles = Math.floor(gs.progress / cycle);
      gs.progress = hasMgr ? gs.progress % cycle : 0;
      if (!hasMgr) gs.running = false;

      const payout = getGenPayout(state, gen, bonuses) * cycles;
      state.money += payout;
      state.totalMoneyRun += payout;
      state.totalMoneyAllTime += payout;

      if (state.phase >= 3) {
        state.rp += gen.rpPerCycle * gs.owned * cycles * rpMult;
      }
      earnedCycle = true;
    }
  }

  // Tick active research
  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    if (proj) {
      const dur = getResearchDuration(state, proj);
      state.activeResearch.elapsed += dt;
      if (state.activeResearch.elapsed >= dur) {
        state.completedResearch.push(proj.id);
        state.activeResearch = null;
        addMemo(`Research complete: ${proj.name} — ${proj.reward}`, proj.branch === 'containment' ? 'sinister' : 'system');
        playUnlockSound(state.soundEnabled);
        processAchievements();
        checkPhasesAndNarrative();
        renderResearch(state, handlers);
        renderAbilities(state, handlers);
        renderPrestige(state, handlers);
      }
    }
  }

  // Tick Golden Memo / Containment Anomaly events
  if (state.phase >= 1) {
    if (anomalyActiveRemaining > 0) {
      anomalyActiveRemaining = Math.max(0, anomalyActiveRemaining - dt);
      if (anomalyActiveRemaining === 0) {
        clearAnomalyFloater();
        anomalySpawnRemaining = getNextAnomalyInterval();
      }
    } else {
      anomalySpawnRemaining -= dt;
      if (anomalySpawnRemaining <= 0) {
        anomalyActiveRemaining = hasPerk(state, 'perk_anomaly_attractor') ? 18 : 12;
        spawnAnomalyFloater(!!state.sinisterRevealed, handleAnomalyClick);
      }
    }
  }

  if (earnedCycle || abilityChanged) {
    processAchievements();
    checkPhasesAndNarrative();
  }

  // Tick Floor B2: Security Perimeter (TD)
  if (state.unlockedFloors.includes('td')) {
    const tdRes = tickTD(state, dt, bonuses);
    if (tdRes.wavesCleared > 0) {
      if (tdRes.bossCleared) {
        addMemo('Perimeter Boss neutralized! +Intel & Executive Shares awarded.', 'sinister');
        playUnlockSound(state.soundEnabled);
      }
      processAchievements();
      checkPhasesAndNarrative();
      renderPrestige(state, handlers);
      saveState(state);
    }
  }

  // Tick Floor B4: Field Ops (RPG)
  if (state.unlockedFloors.includes('rpg')) {
    const rpgRes = tickRPG(state, dt, bonuses);
    if (rpgRes.bossCleared) {
      addMemo(`Sector ${state.rpg.highestSector} cleared! Containment Artifact recovered.`, 'eerie');
      playUnlockSound(state.soundEnabled);
      renderRPG(state, el.floorRpg);
      renderPrestige(state, handlers);
      saveState(state);
    }
  }

  // Tick Floor B6: Synthesis Forge (Merge)
  if (state.unlockedFloors.includes('merge')) {
    const mergeRes = tickMerge(state, dt, bonuses);
    if (mergeRes.merged || mergeRes.spawned) {
      if (state.activeFloor === 'merge') {
        updateMergeUI(state, el.floorMerge);
      }
    }
  }

  updateDynamicUI(state);
  if (state.activeFloor === 'td') {
    updateTDUI(state, el.floorTd);
  } else if (state.activeFloor === 'rpg') {
    updateRPGUI(state, el.floorRpg);
  } else if (state.activeFloor === 'merge') {
    updateMergeUI(state, el.floorMerge);
  }

  if (now - lastSave > 5000) {
    state.lastTick = Date.now();
    saveState(state);
    lastSave = now;
  }

  requestAnimationFrame(tick);
}

function handleFloorSubAction(action) {
  if (action === 'return-desk') {
    switchFloor(state, 'desk');
    saveState(state);
    return;
  }
  playClickSound(state.soundEnabled);
  updateDynamicUI(state);
  renderPrestige(state, handlers);
  saveState(state);
}

function handleTDAction(action) {
  if (!action) return;
  if (action.type === 'return-desk') {
    switchFloor(state, 'desk');
    saveState(state);
    return;
  }
  let changed = false;
  if (action.type === 'buy-pad') {
    changed = tdBuyPad(state);
    if (changed) playUnlockSound(state.soundEnabled);
  } else if (action.type === 'place-turret') {
    changed = tdPlaceTurret(state, action.turretType);
    if (changed) playClickSound(state.soundEnabled);
  } else if (action.type === 'upgrade-turret') {
    changed = tdUpgradeTurret(state, action.turretIdx);
    if (changed) playUnlockSound(state.soundEnabled);
  } else if (action.type === 'salvage-turret') {
    changed = tdSalvageTurret(state, action.turretIdx);
    if (changed) playClickSound(state.soundEnabled);
  } else if (action === 'overcharge' || action.type === 'overcharge') {
    changed = tdTriggerOvercharge(state);
    if (changed) playAnomalySound(state.soundEnabled, true);
  } else if (action.type === 'toggle-auto') {
    changed = tdToggleAutoWave(state);
  } else if (action.type === 'next-wave') {
    changed = tdAdvanceWave(state);
  } else if (action.type === 'select-pad') {
    changed = true;
  }
  if (changed) {
    renderTD(state, el.floorTd, handlers);
    updateDynamicUI(state);
    saveState(state);
  }
}

function bindEvents() {
  el.mainButton.addEventListener('click', handlePress);
  bindTDEvents(el.floorTd, () => state, handleTDAction);
  bindRPGEvents(el.floorRpg, () => state, handleFloorSubAction);
  bindMergeEvents(el.floorMerge, () => state, handleFloorSubAction);

  el.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(state, btn.dataset.tab));
  });

  el.elevatorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const floorId = btn.dataset.floor;
      if (switchFloor(state, floorId)) {
        if (floorId === 'td') {
          renderTD(state, el.floorTd, handlers);
        } else if (floorId === 'rpg') {
          renderRPG(state, el.floorRpg);
        } else if (floorId === 'merge') {
          renderMerge(state, el.floorMerge);
        }
        saveState(state);
      }
    });
  });

  el.returnDeskBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchFloor(state, 'desk');
      saveState(state);
    });
  });

  el.buyModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.buyMode = btn.dataset.mode;
      el.buyModeBtns.forEach((b) => b.classList.toggle('active', b === btn));
      updateDynamicUI(state);
    });
  });

  el.btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    renderVisibility(state);
    saveState(state);
  });

  el.btnReset.addEventListener('click', () => openModal('modal-reset'));

  el.btnResetConfirm.addEventListener('click', () => {
    clearAnomalyFloater();
    anomalyActiveRemaining = 0;
    anomalySpawnRemaining = getNextAnomalyInterval();
    state = resetAllState();
    closeModal('modal-reset');
    renderAll(state, handlers);
    updateDynamicUI(state);
  });

  el.btnSaveModal.addEventListener('click', () => {
    showExportImportModal(exportSave(state));
  });

  el.btnSaveCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(el.saveExportText.value);
      el.saveCopyStatus.textContent = 'Copied!';
    } catch {
      el.saveExportText.select();
      el.saveCopyStatus.textContent = 'Selected for copy';
    }
  });

  el.btnSaveImport.addEventListener('click', () => {
    const res = importSave(el.saveImportText.value);
    if (!res.ok) {
      el.saveImportStatus.textContent = res.error;
      el.saveImportStatus.classList.add('is-error');
      return;
    }
    state = res.state;
    state.lastTick = Date.now();
    saveState(state);
    el.saveImportStatus.textContent = 'Imported!';
    el.saveImportStatus.classList.remove('is-error');
    renderAll(state, handlers);
    if (state.unlockedFloors.includes('td')) renderTD(state, el.floorTd, handlers);
    if (state.unlockedFloors.includes('rpg')) renderRPG(state, el.floorRpg);
    if (state.unlockedFloors.includes('merge')) renderMerge(state, el.floorMerge);
    updateDynamicUI(state);
    setTimeout(() => closeModal('modal-save'), 350);
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('is-hidden');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }
    if (e.code === 'Space' && !e.repeat) {
      const active = document.activeElement;
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return;
      if (active && active.tagName === 'BUTTON' && active !== el.mainButton) return;
      e.preventDefault();
      el.mainButton.classList.add('is-pressed');
      handlePress();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') el.mainButton.classList.remove('is-pressed');
  });

  window.addEventListener('beforeunload', () => {
    state.lastTick = Date.now();
    saveState(state);
  });
}

// Boot
cacheElements();
bindEvents();
processAchievements();
checkPhasesAndNarrative();
renderAll(state, handlers);
if (state.unlockedFloors.includes('td')) renderTD(state, el.floorTd, handlers);
if (state.unlockedFloors.includes('rpg')) renderRPG(state, el.floorRpg);
if (state.unlockedFloors.includes('merge')) renderMerge(state, el.floorMerge);
applyOfflineProgress();
updateDynamicUI(state);
requestAnimationFrame(tick);
