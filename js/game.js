import { loadState, saveState, createInitialState, resetAllState } from './state.js';
import { playClickSound, playUnlockSound } from './audio.js';
import {
  GENERATORS,
  MILESTONES,
  MANAGERS,
  UPGRADES,
  RESEARCH_PROJECTS,
  ABILITIES,
  NARRATIVE_BEATS
} from './data.js';

let state = loadState();
let lastFrame = performance.now();
let lastSave = performance.now();

const el = {
  topBar: document.getElementById('top-bar'),
  statusLed: document.getElementById('status-led'),
  brandName: document.getElementById('brand-name'),
  phaseTag: document.getElementById('phase-tag'),
  pillRp: document.getElementById('pill-rp'),
  topRp: document.getElementById('top-rp'),
  pillShares: document.getElementById('pill-shares'),
  topShares: document.getElementById('top-shares'),
  btnSound: document.getElementById('btn-sound'),
  btnReset: document.getElementById('btn-reset'),
  workspace: document.getElementById('workspace'),
  currencyLabel: document.getElementById('currency-label'),
  currencyValue: document.getElementById('currency-value'),
  currencyRates: document.getElementById('currency-rates'),
  rateMoney: document.getElementById('rate-money'),
  rateRpSep: document.getElementById('rate-rp-sep'),
  rateRp: document.getElementById('rate-rp'),
  mainButton: document.getElementById('main-button'),
  buttonLabel: document.getElementById('button-label'),
  buttonSub: document.getElementById('button-sub'),
  floatingLayer: document.getElementById('floating-layer'),
  abilitiesBar: document.getElementById('abilities-bar'),
  abilitiesGrid: document.getElementById('abilities-grid'),
  memoBox: document.getElementById('memo-box'),
  memoTitle: document.getElementById('memo-title'),
  memoCount: document.getElementById('memo-count'),
  memoFeed: document.getElementById('memo-feed'),
  rightColumn: document.getElementById('right-column'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabBtnUpgrades: document.getElementById('tab-btn-upgrades'),
  tabBtnResearch: document.getElementById('tab-btn-research'),
  tabBtnPrestige: document.getElementById('tab-btn-prestige'),
  badgeUpgrades: document.getElementById('badge-upgrades'),
  badgeResearch: document.getElementById('badge-research'),
  buyModeBtns: document.querySelectorAll('.mode-btn'),
  generatorsList: document.getElementById('generators-list'),
  upgradesSummary: document.getElementById('upgrades-summary'),
  managersList: document.getElementById('managers-list'),
  upgradesList: document.getElementById('upgrades-list'),
  researchRpDisplay: document.getElementById('research-rp-display'),
  activeResearchBox: document.getElementById('active-research-box'),
  researchList: document.getElementById('research-list'),
  prestigeCard: document.getElementById('prestige-card')
};

function fmtMoney(v) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hasUpgrade(id) {
  return state.upgrades.includes(id);
}

function hasResearch(id) {
  return state.completedResearch.includes(id);
}

function isAbilityActive(id) {
  return (state.abilities[id]?.activeRemaining || 0) > 0;
}

function getShareMultiplier() {
  const perShare = hasResearch('res_vessel') ? 0.5 : 0.25;
  return 1 + state.shares * perShare;
}

function getGlobalMultiplier() {
  let mult = getShareMultiplier();
  if (hasUpgrade('upg_synergy')) mult *= 1.5;
  if (hasUpgrade('upg_compliance')) mult *= 2;
  if (hasResearch('res_acoustics')) mult *= 1.5;
  if (hasResearch('res_compliance')) mult *= 2;
  if (isAbilityActive('ab_rush')) mult *= 2;
  return mult;
}

function getSpeedMultiplier() {
  let mult = 1;
  if (hasResearch('res_workflow')) mult *= 1.2;
  return mult;
}

function getGenMilestoneMult(owned) {
  let mult = 1;
  for (const m of MILESTONES) {
    if (owned >= m) mult *= 2;
  }
  return mult;
}

function getGenPayout(gen) {
  const owned = state.generators[gen.id]?.owned || 0;
  if (owned === 0) return 0;
  let mult = getGlobalMultiplier() * getGenMilestoneMult(owned);
  if (gen.id === 'intern' && hasUpgrade('upg_intern_manual')) mult *= 2;
  if (gen.id === 'bird' && hasUpgrade('upg_bird_oil')) mult *= 2;
  if (gen.id === 'solenoid' && hasUpgrade('upg_solenoid_amp')) mult *= 2;
  return gen.basePayout * owned * mult;
}

function getGenCycleTime(gen) {
  return gen.cycleTime / getSpeedMultiplier();
}

function getPassiveMoneyRate() {
  let total = 0;
  for (const gen of GENERATORS) {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned > 0 && hasUpgrade(gen.managerId)) {
      total += getGenPayout(gen) / getGenCycleTime(gen);
    }
  }
  return total;
}

function getPassiveRpRate() {
  if (state.phase < 3) return 0;
  let total = 0;
  const rpMult = isAbilityActive('ab_syphon') ? 2 : 1;
  for (const gen of GENERATORS) {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned > 0 && hasUpgrade(gen.managerId)) {
      total += (gen.rpPerCycle * owned * rpMult) / getGenCycleTime(gen);
    }
  }
  return total;
}

function getClickValue() {
  let base = 1 + (hasUpgrade('upg_keycap') ? 1 : 0);
  if (hasUpgrade('upg_espresso')) base *= 2;
  if (hasResearch('res_ergonomics')) base *= 1.5;
  base *= getShareMultiplier();
  if (isAbilityActive('ab_rush')) base *= 2;
  if (isAbilityActive('ab_syphon')) base *= 3;
  if (hasUpgrade('upg_tether')) {
    base += getPassiveMoneyRate() * 0.02;
  }
  return base;
}

function getBulkCost(gen, owned, count) {
  const r = gen.costScale;
  const first = gen.baseCost * Math.pow(r, owned);
  if (count === 1) return Math.round(first);
  return Math.round(first * ((Math.pow(r, count) - 1) / (r - 1)));
}

function getMaxAffordable(gen, owned, money) {
  let count = 0;
  let total = 0;
  let nextCost = Math.round(gen.baseCost * Math.pow(gen.costScale, owned));
  while (total + nextCost <= money && count < 500) {
    total += nextCost;
    count++;
    nextCost = Math.round(gen.baseCost * Math.pow(gen.costScale, owned + count));
  }
  return { count, cost: total };
}

function getBuyInfo(gen) {
  const owned = state.generators[gen.id]?.owned || 0;
  if (state.buyMode === '1') {
    return { count: 1, cost: getBulkCost(gen, owned, 1) };
  }
  if (state.buyMode === '10') {
    return { count: 10, cost: getBulkCost(gen, owned, 10) };
  }
  const max = getMaxAffordable(gen, owned, state.money);
  if (max.count === 0) {
    return { count: 1, cost: getBulkCost(gen, owned, 1), cantAffordMax: true };
  }
  return max;
}

function addMemo(text, type = 'fun') {
  state.memos.unshift({ time: new Date().toTimeString().slice(0, 8), text, type });
  if (state.memos.length > 50) state.memos.length = 50;
  renderMemos();
}

function spawnFloat(amount) {
  const node = document.createElement('span');
  node.className = 'float-delta';
  node.textContent = `+${fmtMoney(amount)}`;
  node.style.left = `calc(50% + ${(Math.random() - 0.5) * 34}px)`;
  el.floatingLayer.appendChild(node);
  node.addEventListener('animationend', () => node.remove());
}

function pulseLed() {
  el.statusLed.classList.add('is-pulsing');
  clearTimeout(pulseLed._t);
  pulseLed._t = setTimeout(() => el.statusLed.classList.remove('is-pulsing'), 120);
}

function checkPhasesAndNarrative() {
  let changed = false;

  if (state.phase < 1 && state.presses >= 5) { state.phase = 1; changed = true; }
  if (state.phase < 2 && state.totalMoneyRun >= 25) { state.phase = 2; changed = true; }
  if (state.phase < 3 && state.totalMoneyRun >= 200) { state.phase = 3; changed = true; }
  if (hasResearch('res_compliance')) {
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
    renderVisibility();
    renderGenerators();
    renderUpgrades();
    renderResearch();
    renderAbilities();
    renderPrestige();
  }
}

function handlePress() {
  const gain = getClickValue();
  state.money += gain;
  state.totalMoneyRun += gain;
  state.totalMoneyAllTime += gain;
  state.presses += 1;

  playClickSound(state.soundEnabled, Math.min(state.presses * 0.4, 35));
  spawnFloat(gain);
  pulseLed();
  checkPhasesAndNarrative();
  updateDynamicUI();
}

function buyGenerator(genId) {
  const gen = GENERATORS.find((g) => g.id === genId);
  if (!gen) return;
  const info = getBuyInfo(gen);
  if (info.cantAffordMax || state.money < info.cost) return;

  state.money -= info.cost;
  if (!state.generators[genId]) {
    state.generators[genId] = { owned: 0, progress: 0, running: false };
  }
  state.generators[genId].owned += info.count;
  if (hasUpgrade(gen.managerId)) {
    state.generators[genId].running = true;
  }

  playUnlockSound(state.soundEnabled);
  checkPhasesAndNarrative();
  renderGenerators();
  renderUpgrades();
  updateDynamicUI();
  saveState(state);
}

function runGenerator(genId) {
  const gs = state.generators[genId];
  if (!gs || gs.owned === 0 || gs.running) return;
  gs.running = true;
  gs.progress = 0;
  playClickSound(state.soundEnabled, 10);
  updateDynamicUI();
}

function buyUpgradeOrManager(id, cost) {
  if (hasUpgrade(id) || state.money < cost) return;
  state.money -= cost;
  state.upgrades.push(id);

  // If manager, auto-start generator if owned
  const mgr = MANAGERS.find((m) => m.id === id);
  if (mgr && state.generators[mgr.targetGen]?.owned > 0) {
    state.generators[mgr.targetGen].running = true;
  }

  playUnlockSound(state.soundEnabled);
  checkPhasesAndNarrative();
  renderGenerators();
  renderUpgrades();
  updateDynamicUI();
  saveState(state);
}

function startResearch(id) {
  if (state.activeResearch || hasResearch(id)) return;
  const proj = RESEARCH_PROJECTS.find((r) => r.id === id);
  if (!proj || state.rp < proj.rpCost) return;
  state.rp -= proj.rpCost;
  state.activeResearch = { id, elapsed: 0 };
  playUnlockSound(state.soundEnabled);
  renderResearch();
  updateDynamicUI();
  saveState(state);
}

function triggerAbility(id) {
  const ab = ABILITIES.find((a) => a.id === id);
  if (!ab) return;
  const abState = state.abilities[id] || { activeRemaining: 0, cooldownRemaining: 0 };
  if (abState.cooldownRemaining > 0) return;

  if (id === 'ab_surge') {
    const burst = Math.max(getClickValue() * 5, getPassiveMoneyRate() * 15);
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
  renderAbilities();
  updateDynamicUI();
}

function getPendingShares() {
  if (state.totalMoneyRun < 10000) return 0;
  return Math.floor(Math.sqrt(state.totalMoneyRun / 10000));
}

function doRestructure() {
  const pending = getPendingShares();
  if (pending <= 0) return;
  const nextShares = state.shares + pending;
  const preserved = {
    shares: nextShares,
    restructures: state.restructures + 1,
    totalMoneyAllTime: state.totalMoneyAllTime,
    sinisterRevealed: true,
    soundEnabled: state.soundEnabled
  };
  state = createInitialState(preserved);
  state.phase = 1;
  addMemo(`Cycle #${state.restructures} initialized. ${pending} Share(s) retained. The floor remembers.`, 'sinister');
  playUnlockSound(state.soundEnabled);
  renderVisibility();
  renderGenerators();
  renderUpgrades();
  renderResearch();
  renderAbilities();
  renderPrestige();
  updateDynamicUI();
  saveState(state);
}

function switchTab(tabName) {
  state.activeTab = tabName;
  for (const btn of el.tabBtns) {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });
}

function renderVisibility() {
  const p = state.phase;
  document.body.classList.toggle('is-sinister', state.sinisterRevealed);

  el.topBar.classList.toggle('is-hidden', p < 1);
  el.currencyLabel.classList.toggle('is-hidden', p < 1);
  el.currencyRates.classList.toggle('is-hidden', p < 1);
  el.buttonSub.classList.toggle('is-hidden', p < 1);
  el.memoBox.classList.toggle('is-hidden', p < 1);
  el.rightColumn.classList.toggle('is-hidden', p < 1);
  el.workspace.classList.toggle('has-console', p >= 1);

  el.tabBtnUpgrades.classList.toggle('is-hidden', p < 2);
  el.tabBtnResearch.classList.toggle('is-hidden', p < 3);
  el.pillRp.classList.toggle('is-hidden', p < 3);
  el.rateRpSep.classList.toggle('is-hidden', p < 3);
  el.rateRp.classList.toggle('is-hidden', p < 3);

  const showPrestige = p >= 4 || state.restructures > 0;
  el.tabBtnPrestige.classList.toggle('is-hidden', !showPrestige);
  el.pillShares.classList.toggle('is-hidden', state.shares === 0 && !showPrestige);

  const hasAnyAbility = ABILITIES.some((a) => hasResearch(a.unlockResearch));
  el.abilitiesBar.classList.toggle('is-hidden', !hasAnyAbility);

  if (state.sinisterRevealed) {
    el.brandName.textContent = 'CONTAINMENT RIG 04';
    el.phaseTag.textContent = 'COMPLIANCE ACTIVE';
    el.currencyLabel.textContent = 'COMPLIANCE YIELD';
    el.memoTitle.textContent = 'FACILITY FEED';
    el.buttonLabel.textContent = 'ACTUATE';
  } else {
    el.brandName.textContent = 'BUTTONCORP™';
    el.phaseTag.textContent = ['INTERNSHIP', 'OPERATOR', 'MANAGEMENT', 'R&D DIVISION', 'EXECUTIVE'][p] || 'OPERATOR';
    el.currencyLabel.textContent = 'CORPORATE FUNDS';
    el.memoTitle.textContent = 'COMPANY MEMO';
    el.buttonLabel.textContent = 'PRESS';
  }

  el.btnSound.textContent = `AUDIO: ${state.soundEnabled ? 'ON' : 'OFF'}`;
  switchTab(state.activeTab);
}

function renderGenerators() {
  el.generatorsList.innerHTML = '';
  for (const gen of GENERATORS) {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned === 0 && state.totalMoneyRun < gen.unlockMoney) continue;

    const hasMgr = hasUpgrade(gen.managerId);
    const nextMilestone = MILESTONES.find((m) => owned < m) || 'MAX';
    const buyInfo = getBuyInfo(gen);

    const card = document.createElement('div');
    card.className = 'gen-card';
    card.dataset.genId = gen.id;

    card.innerHTML = `
      <div class="gen-main">
        <div class="gen-top">
          <div class="gen-name-wrap">
            <span class="gen-name">${gen.name}</span>
            <span class="gen-owned mono">x${owned}</span>
            ${hasMgr ? '<span class="gen-manager-tag mono">AUTO</span>' : ''}
          </div>
          <span class="gen-yield mono" data-role="yield">${owned > 0 ? fmtMoney(getGenPayout(gen)) + ' / cycle' : fmtMoney(gen.basePayout) + ' base'}</span>
        </div>
        <div class="gen-desc">${gen.desc}</div>
        <div class="gen-progress-row">
          <div class="gen-bar-track"><div class="gen-bar-fill" data-role="bar"></div></div>
          <span class="gen-milestone-label mono">Next 2x: ${nextMilestone}</span>
        </div>
      </div>
      <div class="gen-actions">
        <button class="btn-run mono" type="button" data-role="run" ${owned === 0 || hasMgr ? 'disabled' : ''}>
          ${hasMgr ? 'AUTOMATED' : 'RUN'}
        </button>
        <button class="btn-buy mono" type="button" data-role="buy">
          BUY ${buyInfo.count} (${fmtMoney(buyInfo.cost)})
        </button>
      </div>
    `;

    card.querySelector('[data-role="run"]').addEventListener('click', () => runGenerator(gen.id));
    card.querySelector('[data-role="buy"]').addEventListener('click', () => buyGenerator(gen.id));
    el.generatorsList.appendChild(card);
  }
}

function renderUpgrades() {
  el.managersList.innerHTML = '';
  el.upgradesList.innerHTML = '';

  let ownedCount = 0;
  let visibleCount = 0;

  for (const m of MANAGERS) {
    const genOwned = state.generators[m.targetGen]?.owned || 0;
    const isOwned = hasUpgrade(m.id);
    if (genOwned === 0 && !isOwned) continue;
    visibleCount++;
    if (isOwned) ownedCount++;

    const card = document.createElement('div');
    card.className = `upgrade-card${isOwned ? ' is-owned' : ''}`;
    card.innerHTML = `
      <div>
        <div class="upgrade-card-title">${m.name}</div>
        <div class="upgrade-card-desc">${m.desc}</div>
      </div>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-buy mono';
    btn.dataset.upgId = m.id;
    btn.dataset.upgCost = m.cost;
    btn.disabled = isOwned || state.money < m.cost;
    btn.textContent = isOwned ? 'HIRED' : `HIRE (${fmtMoney(m.cost)})`;
    btn.addEventListener('click', () => buyUpgradeOrManager(m.id, m.cost));
    card.appendChild(btn);
    el.managersList.appendChild(card);
  }

  for (const u of UPGRADES) {
    const isOwned = hasUpgrade(u.id);
    if (!isOwned && state.totalMoneyRun < u.unlockMoney) continue;
    visibleCount++;
    if (isOwned) ownedCount++;

    const card = document.createElement('div');
    card.className = `upgrade-card${isOwned ? ' is-owned' : ''}`;
    card.innerHTML = `
      <div>
        <div class="upgrade-card-title">${u.name}</div>
        <div class="upgrade-card-desc">${u.desc}</div>
        <div class="upgrade-card-effect mono">${u.effect}</div>
      </div>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-buy mono';
    btn.dataset.upgId = u.id;
    btn.dataset.upgCost = u.cost;
    btn.disabled = isOwned || state.money < u.cost;
    btn.textContent = isOwned ? 'OWNED' : `BUY (${fmtMoney(u.cost)})`;
    btn.addEventListener('click', () => buyUpgradeOrManager(u.id, u.cost));
    card.appendChild(btn);
    el.upgradesList.appendChild(card);
  }

  el.upgradesSummary.textContent = `${ownedCount} / ${visibleCount} OWNED`;
}

function renderResearch() {
  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    const pct = Math.min(100, (state.activeResearch.elapsed / proj.duration) * 100);
    el.activeResearchBox.innerHTML = `
      <div class="research-progress-header mono">
        <span>RESEARCHING: ${proj.name}</span>
        <span id="active-res-timer">${Math.max(0, proj.duration - state.activeResearch.elapsed).toFixed(1)}s</span>
      </div>
      <div class="gen-bar-track"><div class="gen-bar-fill" id="active-res-bar" style="width:${pct}%"></div></div>
    `;
  } else {
    el.activeResearchBox.innerHTML = `<div class="mono muted-text">No active project. Select a research topic below.</div>`;
  }

  el.researchList.innerHTML = '';
  for (const proj of RESEARCH_PROJECTS) {
    const done = hasResearch(proj.id);
    const prereqMet = !proj.requires || hasResearch(proj.requires);
    if (!done && !prereqMet) continue;

    const item = document.createElement('div');
    item.className = `research-item${done ? ' is-done' : ''}`;
    item.innerHTML = `
      <div class="research-info">
        <div class="research-title">${proj.name}</div>
        <div class="research-desc">${proj.desc}</div>
        <div class="research-reward mono">${proj.reward}</div>
      </div>
    `;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-research mono';
    btn.dataset.resId = proj.id;
    btn.dataset.resCost = proj.rpCost;
    const isRunning = state.activeResearch?.id === proj.id;
    btn.disabled = done || !!state.activeResearch || state.rp < proj.rpCost;
    btn.textContent = done ? 'COMPLETED' : isRunning ? 'IN PROGRESS' : `${proj.rpCost} RP • ${proj.duration}s`;
    btn.addEventListener('click', () => startResearch(proj.id));
    item.appendChild(btn);
    el.researchList.appendChild(item);
  }
}

function renderAbilities() {
  el.abilitiesGrid.innerHTML = '';
  for (const ab of ABILITIES) {
    if (!hasResearch(ab.unlockResearch)) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ability-btn';
    btn.dataset.abId = ab.id;
    btn.title = ab.desc;
    btn.innerHTML = `
      <span class="ability-name mono">${ab.name}</span>
      <span class="ability-status mono" data-role="status">READY</span>
    `;
    btn.addEventListener('click', () => triggerAbility(ab.id));
    el.abilitiesGrid.appendChild(btn);
  }
}

function renderPrestige() {
  const pending = getPendingShares();
  const bonusPct = Math.round((getShareMultiplier() - 1) * 100);
  const perSharePct = hasResearch('res_vessel') ? 50 : 25;

  el.prestigeCard.innerHTML = `
    <div class="prestige-title mono">${state.sinisterRevealed ? 'VESSEL TRANSFER (RESTRUCTURE)' : 'QUARTERLY RESTRUCTURING'}</div>
    <div class="prestige-desc">
      ${state.sinisterRevealed
        ? 'Wipe the floor’s memory and begin a new shift. Your Shares remain—each Share permanently amplifies all output by +' + perSharePct + '%.'
        : 'Reset your current divisions and funds to claim Executive Shares. Each Share permanently boosts all profits by +' + perSharePct + '%.'}
    </div>
    <div class="prestige-stats mono">
      <div><div class="muted-text">CURRENT SHARES</div><div><strong>${state.shares}</strong> (+${bonusPct}%)</div></div>
      <div><div class="muted-text">CLAIMABLE ON RESET</div><div><strong>+${pending}</strong> Shares</div></div>
      <div><div class="muted-text">NEXT SHARE AT</div><div>${fmtMoney(Math.pow(pending + 1, 2) * 10000)}</div></div>
    </div>
    <button class="btn-prestige mono" id="btn-do-prestige" type="button" ${pending <= 0 ? 'disabled' : ''}>
      RESTRUCTURE NOW (+${pending} SHARES)
    </button>
  `;
  const btn = document.getElementById('btn-do-prestige');
  if (btn) btn.addEventListener('click', doRestructure);
}

function renderMemos() {
  el.memoFeed.innerHTML = '';
  for (const m of state.memos) {
    const row = document.createElement('div');
    row.className = `memo-entry is-${m.type || 'fun'}`;
    row.innerHTML = `<span class="memo-time mono">${m.time}</span><span class="memo-text"></span>`;
    row.querySelector('.memo-text').textContent = m.text;
    el.memoFeed.appendChild(row);
  }
  el.memoCount.textContent = state.memos.length;
}

function updateDynamicUI() {
  el.currencyValue.textContent = fmtMoney(state.money);
  el.rateMoney.textContent = `+${fmtMoney(getPassiveMoneyRate())} / sec`;
  el.rateRp.textContent = `+${getPassiveRpRate().toFixed(1)} RP / sec`;
  el.buttonSub.textContent = `+${fmtMoney(getClickValue())}`;
  el.topRp.textContent = state.rp.toFixed(1);
  el.topShares.textContent = state.shares;
  el.researchRpDisplay.textContent = `${state.rp.toFixed(1)} RP`;

  // Update generators progress & buy buttons
  for (const card of el.generatorsList.querySelectorAll('.gen-card')) {
    const gen = GENERATORS.find((g) => g.id === card.dataset.genId);
    if (!gen) continue;
    const gs = state.generators[gen.id] || { owned: 0, progress: 0, running: false };
    const cycle = getGenCycleTime(gen);
    const pct = gs.running ? Math.min(100, (gs.progress / cycle) * 100) : 0;
    card.querySelector('[data-role="bar"]').style.width = `${pct}%`;

    const buyBtn = card.querySelector('[data-role="buy"]');
    const info = getBuyInfo(gen);
    buyBtn.textContent = `BUY ${info.count} (${fmtMoney(info.cost)})`;
    const canAfford = !info.cantAffordMax && state.money >= info.cost;
    buyBtn.disabled = !canAfford;
    buyBtn.classList.toggle('can-afford', canAfford);

    const runBtn = card.querySelector('[data-role="run"]');
    const hasMgr = hasUpgrade(gen.managerId);
    runBtn.disabled = gs.owned === 0 || gs.running || hasMgr;
  }

  // Update upgrade affordability & badge
  let affordableUpg = 0;
  for (const btn of el.rightColumn.querySelectorAll('[data-upg-id]')) {
    const id = btn.dataset.upgId;
    const cost = Number(btn.dataset.upgCost);
    const owned = hasUpgrade(id);
    const canAfford = !owned && state.money >= cost;
    if (canAfford) affordableUpg++;
    btn.disabled = !canAfford;
    btn.classList.toggle('can-afford', canAfford);
  }
  el.badgeUpgrades.textContent = affordableUpg;
  el.badgeUpgrades.classList.toggle('is-hidden', affordableUpg === 0);

  // Update active research bar & buttons
  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    const bar = document.getElementById('active-res-bar');
    const timer = document.getElementById('active-res-timer');
    if (bar && timer && proj) {
      bar.style.width = `${Math.min(100, (state.activeResearch.elapsed / proj.duration) * 100)}%`;
      timer.textContent = `${Math.max(0, proj.duration - state.activeResearch.elapsed).toFixed(1)}s`;
    }
  }
  let canStartRes = false;
  for (const btn of el.researchList.querySelectorAll('[data-res-id]')) {
    const id = btn.dataset.resId;
    const cost = Number(btn.dataset.resCost);
    const canAfford = !hasResearch(id) && !state.activeResearch && state.rp >= cost;
    if (canAfford) canStartRes = true;
    btn.disabled = !canAfford;
    btn.classList.toggle('can-afford', canAfford);
  }
  el.badgeResearch.classList.toggle('is-hidden', !canStartRes);

  // Update abilities
  for (const btn of el.abilitiesGrid.querySelectorAll('.ability-btn')) {
    const id = btn.dataset.abId;
    const abState = state.abilities[id] || { activeRemaining: 0, cooldownRemaining: 0 };
    const statusEl = btn.querySelector('[data-role="status"]');
    if (abState.activeRemaining > 0) {
      btn.classList.add('is-active');
      btn.disabled = true;
      statusEl.textContent = `ACTIVE ${abState.activeRemaining.toFixed(0)}s`;
    } else if (abState.cooldownRemaining > 0) {
      btn.classList.remove('is-active');
      btn.disabled = true;
      statusEl.textContent = `CD ${abState.cooldownRemaining.toFixed(0)}s`;
    } else {
      btn.classList.remove('is-active');
      btn.disabled = false;
      statusEl.textContent = 'READY';
    }
  }
}

function tick(now) {
  const dt = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

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
  for (const gen of GENERATORS) {
    const gs = state.generators[gen.id];
    if (!gs || gs.owned === 0) continue;
    const hasMgr = hasUpgrade(gen.managerId);
    if (hasMgr) gs.running = true;
    if (!gs.running) continue;

    const cycle = getGenCycleTime(gen);
    gs.progress += dt;
    if (gs.progress >= cycle) {
      const cycles = Math.floor(gs.progress / cycle);
      gs.progress = hasMgr ? gs.progress % cycle : 0;
      if (!hasMgr) gs.running = false;

      const payout = getGenPayout(gen) * cycles;
      state.money += payout;
      state.totalMoneyRun += payout;
      state.totalMoneyAllTime += payout;

      if (state.phase >= 3) {
        const rpMult = isAbilityActive('ab_syphon') ? 2 : 1;
        state.rp += gen.rpPerCycle * gs.owned * cycles * rpMult;
      }
      earnedCycle = true;
    }
  }

  // Tick active research
  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    if (proj) {
      state.activeResearch.elapsed += dt;
      if (state.activeResearch.elapsed >= proj.duration) {
        state.completedResearch.push(proj.id);
        state.activeResearch = null;
        addMemo(`Research complete: ${proj.name} — ${proj.reward}`, proj.id === 'res_compliance' ? 'sinister' : 'system');
        playUnlockSound(state.soundEnabled);
        checkPhasesAndNarrative();
        renderResearch();
        renderAbilities();
        renderPrestige();
      }
    }
  }

  if (earnedCycle || abilityChanged) {
    checkPhasesAndNarrative();
  }

  updateDynamicUI();

  if (now - lastSave > 5000) {
    state.lastTick = Date.now();
    saveState(state);
    lastSave = now;
  }

  requestAnimationFrame(tick);
}

// Event Listeners
el.mainButton.addEventListener('click', handlePress);

el.tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

el.buyModeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.buyMode = btn.dataset.mode;
    el.buyModeBtns.forEach((b) => b.classList.toggle('active', b === btn));
    updateDynamicUI();
  });
});

el.btnSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  renderVisibility();
  saveState(state);
});

el.btnReset.addEventListener('click', () => {
  if (!confirm('Reset all ButtonCorp™ progress and Shares?')) return;
  state = resetAllState();
  renderVisibility();
  renderGenerators();
  renderUpgrades();
  renderResearch();
  renderAbilities();
  renderPrestige();
  renderMemos();
  updateDynamicUI();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) {
    const active = document.activeElement;
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

// Boot
checkPhasesAndNarrative();
renderVisibility();
renderGenerators();
renderUpgrades();
renderResearch();
renderAbilities();
renderPrestige();
renderMemos();
updateDynamicUI();
requestAnimationFrame(tick);
