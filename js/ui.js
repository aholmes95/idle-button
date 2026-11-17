import {
  GENERATORS,
  MILESTONES,
  MILESTONE_MULTIPLIERS,
  MANAGERS,
  UPGRADES,
  RESEARCH_PROJECTS,
  ABILITIES,
  BOARDROOM_PERKS,
  ACHIEVEMENTS,
  FLOORS
} from './data.js';
import { fmtMoney, fmtNumber, fmtDuration } from './format.js';
import {
  hasUpgrade,
  hasResearch,
  hasPerk,
  getShareMultiplier,
  getGenPayout,
  getGenCycleTime,
  getPassiveMoneyRate,
  getPassiveRpRate,
  getClickValue,
  getBuyInfo,
  getResearchDuration,
  getPendingShares
} from './economy.js';

const RING_CIRCUMFERENCE = 502.65;
let buttonCharge = 0;
let housingPulseTimer = null;
let ledPulseTimer = null;

export let el = {};

export function cacheElements() {
  el = {
    topBar: document.getElementById('top-bar'),
    statusLed: document.getElementById('status-led'),
    brandName: document.getElementById('brand-name'),
    phaseTag: document.getElementById('phase-tag'),
    pillRp: document.getElementById('pill-rp'),
    topRp: document.getElementById('top-rp'),
    pillShares: document.getElementById('pill-shares'),
    topShares: document.getElementById('top-shares'),
    btnSaveModal: document.getElementById('btn-save-modal'),
    btnSound: document.getElementById('btn-sound'),
    btnReset: document.getElementById('btn-reset'),

    elevatorBar: document.getElementById('elevator-bar'),
    elevatorBtns: document.querySelectorAll('.elevator-btn'),
    floorPanels: document.querySelectorAll('[data-floor-panel]'),
    floorTd: document.getElementById('floor-td'),
    floorRpg: document.getElementById('floor-rpg'),
    floorMerge: document.getElementById('floor-merge'),
    returnDeskBtns: document.querySelectorAll('[data-return-desk]'),

    workspace: document.getElementById('workspace'),
    currencyLabel: document.getElementById('currency-label'),
    currencyValue: document.getElementById('currency-value'),
    currencyRates: document.getElementById('currency-rates'),
    rateMoney: document.getElementById('rate-money'),
    rateRpSep: document.getElementById('rate-rp-sep'),
    rateRp: document.getElementById('rate-rp'),

    buttonHousing: document.getElementById('button-housing'),
    buttonRingFill: document.getElementById('button-ring-fill'),
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
    tabBtnAchievements: document.getElementById('tab-btn-achievements'),
    tabBtnPrestige: document.getElementById('tab-btn-prestige'),
    badgeUpgrades: document.getElementById('badge-upgrades'),
    badgeResearch: document.getElementById('badge-research'),
    badgeAchievements: document.getElementById('badge-achievements'),
    buyModeBtns: document.querySelectorAll('.mode-btn'),
    generatorsList: document.getElementById('generators-list'),

    upgradesSummary: document.getElementById('upgrades-summary'),
    managersList: document.getElementById('managers-list'),
    upgradesList: document.getElementById('upgrades-list'),
    upgradesOwnedDrawer: document.getElementById('upgrades-owned-drawer'),
    upgradesOwnedCount: document.getElementById('upgrades-owned-count'),
    upgradesOwnedList: document.getElementById('upgrades-owned-list'),

    researchRpDisplay: document.getElementById('research-rp-display'),
    activeResearchBox: document.getElementById('active-research-box'),
    researchList: document.getElementById('research-list'),
    researchCompletedDrawer: document.getElementById('research-completed-drawer'),
    researchCompletedCount: document.getElementById('research-completed-count'),
    researchCompletedList: document.getElementById('research-completed-list'),

    achievementsSummary: document.getElementById('achievements-summary'),
    achievementsList: document.getElementById('achievements-list'),

    prestigeCard: document.getElementById('prestige-card'),
    boardroomSection: document.getElementById('boardroom-section'),
    boardroomSharesDisplay: document.getElementById('boardroom-shares-display'),
    boardroomGrid: document.getElementById('boardroom-grid'),

    modalReset: document.getElementById('modal-reset'),
    btnResetConfirm: document.getElementById('btn-reset-confirm'),
    modalSave: document.getElementById('modal-save'),
    saveExportText: document.getElementById('save-export-text'),
    btnSaveCopy: document.getElementById('btn-save-copy'),
    saveCopyStatus: document.getElementById('save-copy-status'),
    saveImportText: document.getElementById('save-import-text'),
    btnSaveImport: document.getElementById('btn-save-import'),
    saveImportStatus: document.getElementById('save-import-status'),
    modalOffline: document.getElementById('modal-offline'),
    offlineSummaryBody: document.getElementById('offline-summary-body')
  };
  return el;
}

export function spawnFloat(amount) {
  if (!el.floatingLayer) return;
  const node = document.createElement('span');
  node.className = 'float-delta';
  node.textContent = `+${fmtMoney(amount)}`;
  node.style.left = `calc(50% + ${(Math.random() - 0.5) * 34}px)`;
  el.floatingLayer.appendChild(node);
  node.addEventListener('animationend', () => node.remove());
}

export function pulseLed() {
  if (!el.statusLed) return;
  el.statusLed.classList.add('is-pulsing');
  clearTimeout(ledPulseTimer);
  ledPulseTimer = setTimeout(() => el.statusLed.classList.remove('is-pulsing'), 120);
}

export function pulseButtonRing() {
  buttonCharge = Math.min(1, buttonCharge + 0.12);
  if (el.buttonRingFill) {
    el.buttonRingFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - buttonCharge));
  }
  if (el.buttonHousing) {
    el.buttonHousing.classList.add('is-pulsing');
    clearTimeout(housingPulseTimer);
    housingPulseTimer = setTimeout(() => el.buttonHousing.classList.remove('is-pulsing'), 200);
  }
}

export function decayButtonRing(dt) {
  if (buttonCharge <= 0) return;
  buttonCharge = Math.max(0, buttonCharge - dt * 0.45);
  if (el.buttonRingFill) {
    el.buttonRingFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - buttonCharge));
  }
}

export function switchTab(state, tabName) {
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

export function renderFloorSwitcher(state) {
  if (!el.elevatorBtns) return;
  const unlocked = state.unlockedFloors || ['desk'];
  for (const btn of el.elevatorBtns) {
    const floorId = btn.dataset.floor;
    const floorMeta = FLOORS.find((f) => f.id === floorId);
    const isUnlocked = unlocked.includes(floorId);
    const isActive = state.activeFloor === floorId;

    btn.classList.toggle('active', isActive);
    btn.classList.toggle('is-locked', !isUnlocked);
    btn.setAttribute('aria-disabled', isUnlocked ? 'false' : 'true');

    const lockTag = btn.querySelector('.floor-lock');
    if (lockTag) {
      lockTag.classList.toggle('is-hidden', isUnlocked);
    }
    if (floorMeta) {
      btn.title = isUnlocked
        ? `${floorMeta.label}: ${floorMeta.title}`
        : `${floorMeta.label} (Locked) — ${floorMeta.unlockHint}`;
    }
  }
}

export function switchFloor(state, floorId) {
  const unlocked = state.unlockedFloors || ['desk'];
  if (!unlocked.includes(floorId)) return false;

  state.activeFloor = floorId;
  if (el.workspace) {
    el.workspace.classList.toggle('is-hidden', floorId !== 'desk');
  }
  if (el.floorPanels) {
    for (const panel of el.floorPanels) {
      panel.classList.toggle('is-hidden', panel.dataset.floorPanel !== floorId);
    }
  }
  renderFloorSwitcher(state);
  return true;
}

export function renderVisibility(state) {
  const p = state.phase;
  document.body.classList.toggle('is-sinister', !!state.sinisterRevealed);

  el.topBar.classList.toggle('is-hidden', p < 1);
  el.elevatorBar.classList.toggle('is-hidden', p < 1);
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

  const hasAnyAbility = ABILITIES.some((a) => hasResearch(state, a.unlockResearch));
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
  for (const btn of el.buyModeBtns) {
    btn.classList.toggle('active', btn.dataset.mode === state.buyMode);
  }
  switchTab(state, state.activeTab);
  switchFloor(state, state.activeFloor || 'desk');
}

export function renderGenerators(state, handlers) {
  el.generatorsList.innerHTML = '';
  GENERATORS.forEach((gen, idx) => {
    const owned = state.generators[gen.id]?.owned || 0;
    if (owned === 0 && state.totalMoneyRun < gen.unlockMoney) return;

    const hasMgr = hasUpgrade(state, gen.managerId);
    const nextMilestone = MILESTONES.find((m) => owned < m);
    const nextLabel = nextMilestone ? `Next ${MILESTONE_MULTIPLIERS[nextMilestone] || 2}x: ${nextMilestone}` : 'Milestones: MAX';
    const buyInfo = getBuyInfo(state, gen);

    const card = document.createElement('div');
    card.className = 'gen-card';
    card.dataset.genId = gen.id;

    card.innerHTML = `
      <div class="gen-main">
        <div class="gen-top">
          <div class="gen-name-wrap">
            <span class="card-badge mono">T${idx + 1}</span>
            <span class="gen-name">${gen.name}</span>
            <span class="gen-owned mono">x${owned}</span>
            ${hasMgr ? '<span class="gen-manager-tag mono">AUTO</span>' : ''}
          </div>
          <span class="gen-yield mono" data-role="yield">${owned > 0 ? fmtMoney(getGenPayout(state, gen)) + ' / cycle' : fmtMoney(gen.basePayout) + ' base'}</span>
        </div>
        <div class="gen-desc">${gen.desc}</div>
        <div class="gen-progress-row">
          <div class="gen-bar-track"><div class="gen-bar-fill" data-role="bar"></div></div>
          <span class="gen-milestone-label mono">${nextLabel}</span>
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

    card.querySelector('[data-role="run"]').addEventListener('click', () => handlers.onRunGenerator(gen.id));
    card.querySelector('[data-role="buy"]').addEventListener('click', () => handlers.onBuyGenerator(gen.id));
    el.generatorsList.appendChild(card);
  });
}

function getUpgradeCategory(u) {
  if (u.category === 'click') {
    return { label: 'CLICK', cls: 'is-accent' };
  }
  if (u.category === 'synergy') {
    return { label: 'SYNERGY', cls: 'is-info' };
  }
  return { label: 'DIVISION', cls: '' };
}

export function renderUpgrades(state, handlers) {
  el.managersList.innerHTML = '';
  el.upgradesList.innerHTML = '';
  el.upgradesOwnedList.innerHTML = '';

  let ownedCount = 0;
  let visibleCount = 0;

  for (const m of MANAGERS) {
    const genOwned = state.generators[m.targetGen]?.owned || 0;
    const isOwned = hasUpgrade(state, m.id);
    if (genOwned === 0 && !isOwned) continue;
    visibleCount++;
    if (isOwned) ownedCount++;

    const card = document.createElement('div');
    card.className = `upgrade-card${isOwned ? ' is-owned' : ''}`;
    card.innerHTML = `
      <div>
        <div class="card-head">
          <div class="upgrade-card-title">${m.name}</div>
          <span class="card-badge is-good">MANAGER</span>
        </div>
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
    btn.addEventListener('click', () => handlers.onBuyUpgrade(m.id, m.cost));
    card.appendChild(btn);

    if (isOwned) {
      el.upgradesOwnedList.appendChild(card);
    } else {
      el.managersList.appendChild(card);
    }
  }

  for (const u of UPGRADES) {
    const isOwned = hasUpgrade(state, u.id);
    if (!isOwned && state.totalMoneyRun < u.unlockMoney) continue;
    visibleCount++;
    if (isOwned) ownedCount++;

    const cat = getUpgradeCategory(u);
    const card = document.createElement('div');
    card.className = `upgrade-card${isOwned ? ' is-owned' : ''}`;
    card.innerHTML = `
      <div>
        <div class="card-head">
          <div class="upgrade-card-title">${u.name}</div>
          <span class="card-badge ${cat.cls}">${cat.label}</span>
        </div>
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
    btn.addEventListener('click', () => handlers.onBuyUpgrade(u.id, u.cost));
    card.appendChild(btn);

    if (isOwned) {
      el.upgradesOwnedList.appendChild(card);
    } else {
      el.upgradesList.appendChild(card);
    }
  }

  if (el.managersList.children.length === 0) {
    el.managersList.innerHTML = '<div class="muted-text mono">No managers currently available.</div>';
  }
  if (el.upgradesList.children.length === 0) {
    el.upgradesList.innerHTML = '<div class="muted-text mono">No equipment upgrades currently available.</div>';
  }

  el.upgradesOwnedCount.textContent = String(ownedCount);
  el.upgradesOwnedDrawer.classList.toggle('is-hidden', ownedCount === 0);
  el.upgradesSummary.textContent = `${ownedCount} / ${visibleCount} OWNED`;
}

export function renderResearch(state, handlers) {
  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    const dur = proj ? getResearchDuration(state, proj) : 1;
    const pct = proj ? Math.min(100, (state.activeResearch.elapsed / dur) * 100) : 0;
    el.activeResearchBox.innerHTML = `
      <div class="research-progress-header mono">
        <span>RESEARCHING: ${proj ? proj.name : state.activeResearch.id}</span>
        <span id="active-res-timer">${proj ? Math.max(0, dur - state.activeResearch.elapsed).toFixed(1) : '0.0'}s</span>
      </div>
      <div class="gen-bar-track"><div class="gen-bar-fill" id="active-res-bar" style="width:${pct}%"></div></div>
    `;
  } else {
    el.activeResearchBox.innerHTML = '<div class="mono muted-text">No active project. Select a research topic below.</div>';
  }

  el.researchList.innerHTML = '';
  el.researchCompletedList.innerHTML = '';

  let completedCount = 0;

  for (const proj of RESEARCH_PROJECTS) {
    const done = hasResearch(state, proj.id);
    const prereqMet = !proj.requires || hasResearch(state, proj.requires);
    if (!done && !prereqMet) continue;
    if (done) completedCount++;

    const isContainment = proj.branch === 'containment';
    const dur = getResearchDuration(state, proj);
    const item = document.createElement('div');
    item.className = `research-item${done ? ' is-done' : ''}`;
    item.innerHTML = `
      <div class="research-info">
        <div class="card-head">
          <div class="research-title">${proj.name}</div>
          <span class="card-badge ${isContainment ? 'is-danger' : 'is-info'}">${isContainment ? 'CONTAINMENT' : 'EFFICIENCY'}</span>
        </div>
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
    btn.textContent = done ? 'COMPLETED' : isRunning ? 'IN PROGRESS' : `${proj.rpCost} RP • ${dur % 1 === 0 ? dur : dur.toFixed(1)}s`;
    btn.addEventListener('click', () => handlers.onStartResearch(proj.id));
    item.appendChild(btn);

    if (done) {
      el.researchCompletedList.appendChild(item);
    } else {
      el.researchList.appendChild(item);
    }
  }

  if (el.researchList.children.length === 0) {
    el.researchList.innerHTML = '<div class="muted-text mono">All available R&amp;D projects completed.</div>';
  }

  el.researchCompletedCount.textContent = String(completedCount);
  el.researchCompletedDrawer.classList.toggle('is-hidden', completedCount === 0);
}

export function renderAbilities(state, handlers) {
  el.abilitiesGrid.innerHTML = '';
  for (const ab of ABILITIES) {
    if (!hasResearch(state, ab.unlockResearch)) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ability-btn';
    btn.dataset.abId = ab.id;
    btn.title = ab.desc;
    btn.innerHTML = `
      <span class="ability-name mono">${ab.name}</span>
      <span class="ability-status mono" data-role="status">READY</span>
    `;
    btn.addEventListener('click', () => handlers.onTriggerAbility(ab.id));
    el.abilitiesGrid.appendChild(btn);
  }
}

export function renderAchievements(state) {
  if (!el.achievementsList) return;
  const unlockedIds = state.achievements || [];
  const unlockedCount = unlockedIds.length;
  const bonusPct = (Math.pow(1.05, unlockedCount) - 1) * 100;

  if (el.achievementsSummary) {
    el.achievementsSummary.textContent = `${unlockedCount} / ${ACHIEVEMENTS.length} (+${bonusPct.toFixed(1)}% OUTPUT)`;
  }
  if (el.badgeAchievements) {
    el.badgeAchievements.textContent = String(unlockedCount);
    el.badgeAchievements.classList.toggle('is-hidden', unlockedCount === 0);
  }

  el.achievementsList.innerHTML = '';
  for (const ach of ACHIEVEMENTS) {
    const isUnlocked = unlockedIds.includes(ach.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;
    card.dataset.achId = ach.id;
    card.innerHTML = `
      <div class="card-head">
        <div class="achievement-name">${ach.name}</div>
        <span class="card-badge ${isUnlocked ? 'is-good' : ''}">${ach.category.toUpperCase()}</span>
      </div>
      <div class="achievement-desc">${ach.desc}</div>
      <div class="achievement-bonus mono">${isUnlocked ? 'UNLOCKED (+5% compounding)' : 'LOCKED'}</div>
    `;
    el.achievementsList.appendChild(card);
  }
}

export function renderPrestige(state, handlers) {
  const pending = getPendingShares(state);
  const bonusPct = Math.round((getShareMultiplier(state) - 1) * 100);
  const lifetime = Math.max(state.lifetimeShares || 0, state.shares || 0);
  const perSharePct = Math.round(
    (0.15 + (hasPerk(state, 'perk_insider_trading') ? 0.15 : 0) + (hasResearch(state, 'res_vessel') ? 0.15 : 0)) * 100
  );
  const nextShareAt = Math.pow(pending + 1, 1 / 0.42) * 25000;

  el.prestigeCard.innerHTML = `
    <div class="prestige-title mono">${state.sinisterRevealed ? 'VESSEL TRANSFER (RESTRUCTURE)' : 'QUARTERLY RESTRUCTURING'}</div>
    <div class="prestige-desc">
      ${state.sinisterRevealed
        ? 'Wipe the floor’s memory and begin a new shift. Your Lifetime Shares remain—each Share amplifies all output by +' + perSharePct + '% base (scaling with Restructures).'
        : 'Reset your current divisions and funds to claim Executive Shares. Spend Shares in the Boardroom without losing Lifetime Share power.'}
    </div>
    <div class="prestige-stats mono">
      <div><div class="muted-text">SPENDABLE SHARES</div><div><strong>${fmtNumber(state.shares, 0)}</strong></div></div>
      <div><div class="muted-text">LIFETIME SHARES</div><div><strong>${fmtNumber(lifetime, 0)}</strong> (+${bonusPct}%)</div></div>
      <div><div class="muted-text">RESTRUCTURES</div><div><strong>${state.restructures || 0}</strong></div></div>
      <div><div class="muted-text">CLAIMABLE ON RESET</div><div><strong>+${fmtNumber(pending, 0)}</strong> Shares</div></div>
      <div><div class="muted-text">NEXT SHARE AT</div><div>${fmtMoney(nextShareAt)}</div></div>
    </div>
    <button class="btn-prestige mono" id="btn-do-prestige" type="button" ${pending <= 0 ? 'disabled' : ''}>
      RESTRUCTURE NOW (+${fmtNumber(pending, 0)} SHARES)
    </button>
  `;
  const btn = document.getElementById('btn-do-prestige');
  if (btn) btn.addEventListener('click', handlers.onRestructure);

  if (el.boardroomSharesDisplay) {
    el.boardroomSharesDisplay.textContent = `${fmtNumber(state.shares, 0)} SPENDABLE SHARES`;
  }
  if (el.boardroomGrid) {
    el.boardroomGrid.innerHTML = '';
    for (const perk of BOARDROOM_PERKS) {
      const owned = hasPerk(state, perk.id);
      const reqMet = !perk.requires || hasPerk(state, perk.requires);
      const reqPerk = perk.requires ? BOARDROOM_PERKS.find((p) => p.id === perk.requires) : null;
      const canAfford = !owned && reqMet && state.shares >= perk.cost;

      const card = document.createElement('div');
      card.className = `perk-card${owned ? ' is-owned' : !reqMet ? ' is-locked' : ''}`;
      card.dataset.perkCard = perk.id;
      card.innerHTML = `
        <div>
          <div class="card-head">
            <div class="perk-title">${perk.name}</div>
            <span class="card-badge ${owned ? 'is-good' : perk.unlockFloor ? 'is-accent' : 'is-info'}">${owned ? 'OWNED' : `${perk.cost} SH`}</span>
          </div>
          <div class="perk-desc">${perk.desc}</div>
          ${reqPerk ? `<div class="perk-req mono">Requires: ${reqPerk.name}</div>` : ''}
        </div>
      `;

      const pBtn = document.createElement('button');
      pBtn.type = 'button';
      pBtn.className = `btn-buy mono${canAfford ? ' can-afford' : ''}`;
      pBtn.dataset.perkId = perk.id;
      pBtn.dataset.perkCost = perk.cost;
      pBtn.dataset.perkReqMet = reqMet ? '1' : '0';
      pBtn.disabled = owned || !canAfford;
      pBtn.textContent = owned ? 'OWNED' : !reqMet ? 'LOCKED' : `ACQUIRE (${perk.cost} SHARES)`;
      pBtn.addEventListener('click', () => handlers.onBuyPerk(perk.id));
      card.appendChild(pBtn);
      el.boardroomGrid.appendChild(card);
    }
  }
}

export function renderMemos(state) {
  el.memoFeed.innerHTML = '';
  for (const m of state.memos) {
    const row = document.createElement('div');
    row.className = `memo-entry is-${m.type || 'fun'}`;
    row.innerHTML = `<span class="memo-time mono">${m.time}</span><span class="memo-text"></span>`;
    row.querySelector('.memo-text').textContent = m.text;
    el.memoFeed.appendChild(row);
  }
  el.memoCount.textContent = String(state.memos.length);
}

export function renderAll(state, handlers) {
  renderVisibility(state);
  renderFloorSwitcher(state);
  renderGenerators(state, handlers);
  renderUpgrades(state, handlers);
  renderResearch(state, handlers);
  renderAbilities(state, handlers);
  renderAchievements(state);
  renderPrestige(state, handlers);
  renderMemos(state);
}

export function updateDynamicUI(state) {
  el.currencyValue.textContent = fmtMoney(state.money);
  el.rateMoney.textContent = `+${fmtMoney(getPassiveMoneyRate(state))} / sec`;
  el.rateRp.textContent = `+${fmtNumber(getPassiveRpRate(state), 1)} RP / sec`;
  el.buttonSub.textContent = `+${fmtMoney(getClickValue(state))}`;
  el.topRp.textContent = fmtNumber(state.rp, 1);
  el.topShares.textContent = fmtNumber(state.shares, 0);
  el.researchRpDisplay.textContent = `${fmtNumber(state.rp, 1)} RP`;

  for (const card of el.generatorsList.querySelectorAll('.gen-card')) {
    const gen = GENERATORS.find((g) => g.id === card.dataset.genId);
    if (!gen) continue;
    const gs = state.generators[gen.id] || { owned: 0, progress: 0, running: false };
    const cycle = getGenCycleTime(state, gen);
    const pct = gs.running ? Math.min(100, (gs.progress / cycle) * 100) : 0;
    card.querySelector('[data-role="bar"]').style.width = `${pct}%`;

    const buyBtn = card.querySelector('[data-role="buy"]');
    const info = getBuyInfo(state, gen);
    buyBtn.textContent = `BUY ${info.count} (${fmtMoney(info.cost)})`;
    const canAfford = !info.cantAffordMax && state.money >= info.cost;
    buyBtn.disabled = !canAfford;
    buyBtn.classList.toggle('can-afford', canAfford);

    const runBtn = card.querySelector('[data-role="run"]');
    const hasMgr = hasUpgrade(state, gen.managerId);
    runBtn.disabled = gs.owned === 0 || gs.running || hasMgr;
  }

  let affordableUpg = 0;
  for (const btn of el.rightColumn.querySelectorAll('[data-upg-id]')) {
    const id = btn.dataset.upgId;
    const cost = Number(btn.dataset.upgCost);
    const owned = hasUpgrade(state, id);
    const canAfford = !owned && state.money >= cost;
    if (canAfford) affordableUpg++;
    btn.disabled = !canAfford;
    btn.classList.toggle('can-afford', canAfford);
  }
  el.badgeUpgrades.textContent = String(affordableUpg);
  el.badgeUpgrades.classList.toggle('is-hidden', affordableUpg === 0);

  if (state.activeResearch) {
    const proj = RESEARCH_PROJECTS.find((r) => r.id === state.activeResearch.id);
    const bar = document.getElementById('active-res-bar');
    const timer = document.getElementById('active-res-timer');
    if (bar && timer && proj) {
      const dur = getResearchDuration(state, proj);
      bar.style.width = `${Math.min(100, (state.activeResearch.elapsed / dur) * 100)}%`;
      timer.textContent = `${Math.max(0, dur - state.activeResearch.elapsed).toFixed(1)}s`;
    }
  }
  let canStartRes = false;
  for (const btn of el.researchList.querySelectorAll('[data-res-id]')) {
    const id = btn.dataset.resId;
    const cost = Number(btn.dataset.resCost);
    const canAfford = !hasResearch(state, id) && !state.activeResearch && state.rp >= cost;
    if (canAfford) canStartRes = true;
    btn.disabled = !canAfford;
    btn.classList.toggle('can-afford', canAfford);
  }
  el.badgeResearch.classList.toggle('is-hidden', !canStartRes);

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

  const prestigeBtn = document.getElementById('btn-do-prestige');
  if (prestigeBtn) {
    const pending = getPendingShares(state);
    prestigeBtn.disabled = pending <= 0;
    prestigeBtn.textContent = `RESTRUCTURE NOW (+${fmtNumber(pending, 0)} SHARES)`;
  }
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('is-hidden');
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('is-hidden');
}

export function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.add('is-hidden'));
}

export function showOfflineModal({ elapsedSec, moneyEarned, rpEarned, capped, maxHours = 4, efficiency = 0.25 }) {
  if (!el.offlineSummaryBody) return;
  el.offlineSummaryBody.innerHTML = `
    <p>While you were away from your station${capped ? ` (capped at ${maxHours}h)` : ''}, your automated divisions kept pressing at ${Math.round(efficiency * 100)}% efficiency.</p>
    <div class="offline-stats-grid mono">
      <div>
        <div class="offline-stat-label">SHIFT DURATION</div>
        <div class="offline-stat-val">${fmtDuration(elapsedSec)}</div>
      </div>
      <div>
        <div class="offline-stat-label">FUNDS GENERATED</div>
        <div class="offline-stat-val is-accent">+${fmtMoney(moneyEarned)}</div>
      </div>
      ${rpEarned > 0 ? `
      <div>
        <div class="offline-stat-label">RESEARCH GAINED</div>
        <div class="offline-stat-val is-info">+${fmtNumber(rpEarned, 1)} RP</div>
      </div>` : ''}
    </div>
  `;
  openModal('modal-offline');
}

export function showExportImportModal(exportString) {
  if (el.saveExportText) el.saveExportText.value = exportString;
  if (el.saveImportText) el.saveImportText.value = '';
  if (el.saveCopyStatus) el.saveCopyStatus.textContent = '';
  if (el.saveImportStatus) {
    el.saveImportStatus.textContent = '';
    el.saveImportStatus.classList.remove('is-error');
  }
  openModal('modal-save');
}

let activeAnomalyEl = null;

export function clearAnomalyFloater() {
  if (activeAnomalyEl) {
    activeAnomalyEl.remove();
    activeAnomalyEl = null;
  }
}

export function spawnAnomalyFloater(isSinister, onClick) {
  clearAnomalyFloater();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'anomaly-floater';
  btn.className = `anomaly-floater${isSinister ? ' is-sinister' : ''}`;
  btn.textContent = isSinister ? 'CONTAINMENT ANOMALY' : 'URGENT EXECUTIVE MEMO';
  const topPct = 18 + Math.random() * 58;
  const leftPct = 14 + Math.random() * 64;
  btn.style.top = `${topPct.toFixed(1)}%`;
  btn.style.left = `${leftPct.toFixed(1)}%`;
  btn.addEventListener('click', () => {
    clearAnomalyFloater();
    onClick();
  });
  document.body.appendChild(btn);
  activeAnomalyEl = btn;
  return btn;
}
