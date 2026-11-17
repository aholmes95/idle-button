import { loadState, saveState, clearState } from './state.js';
import { playClickSound, playUnlockSound } from './audio.js';
import {
  UPGRADES,
  getUpgradeLevel,
  getUpgradeCost,
  getPressValue,
  getPassiveRate
} from './upgrades.js';
import { NARRATIVE_BEATS } from './narrative.js';

const INSPECT_COST = 600;

const PHASE_NAMES = [
  'STANDBY',
  'LOG ONLINE',
  'REQUISITION',
  'TELEMETRY',
  'CHAMBER 01'
];

let state = loadState();
let lastFrameTime = performance.now();
let lastSaveTime = performance.now();

// DOM references
const el = {
  topBar: document.getElementById('top-bar'),
  statusLed: document.getElementById('status-led'),
  phaseTag: document.getElementById('phase-tag'),
  btnSound: document.getElementById('btn-sound'),
  btnReset: document.getElementById('btn-reset'),
  workspace: document.getElementById('workspace'),
  currencyLabel: document.getElementById('currency-label'),
  currencyValue: document.getElementById('currency-value'),
  currencyRate: document.getElementById('currency-rate'),
  mainButton: document.getElementById('main-button'),
  buttonLabel: document.getElementById('button-label'),
  buttonSub: document.getElementById('button-sub'),
  floatingLayer: document.getElementById('floating-layer'),
  secondaryAction: document.getElementById('secondary-action'),
  btnInspect: document.getElementById('btn-inspect'),
  telemetryStrip: document.getElementById('telemetry-strip'),
  statPresses: document.getElementById('stat-presses'),
  statPerPress: document.getElementById('stat-per-press'),
  statDepth: document.getElementById('stat-depth'),
  sideColumn: document.getElementById('side-column'),
  panelUpgrades: document.getElementById('panel-upgrades'),
  upgradesCount: document.getElementById('upgrades-count'),
  upgradesList: document.getElementById('upgrades-list'),
  panelLog: document.getElementById('panel-log'),
  logCount: document.getElementById('log-count'),
  logFeed: document.getElementById('log-feed')
};

function formatMoney(val) {
  return '$' + val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

function addLog(text, type = 'narrative') {
  state.logs.unshift({
    time: formatTime(),
    text,
    type
  });
  if (state.logs.length > 60) {
    state.logs.length = 60;
  }
  renderLogs();
}

function spawnFloatDelta(amount) {
  const node = document.createElement('span');
  node.className = 'float-delta';
  node.textContent = `+${formatMoney(amount)}`;
  const jitterX = (Math.random() - 0.5) * 36;
  node.style.left = `calc(50% + ${jitterX}px)`;
  el.floatingLayer.appendChild(node);
  node.addEventListener('animationend', () => node.remove());
}

function pulseLed() {
  el.statusLed.classList.add('is-pulsing');
  clearTimeout(pulseLed._t);
  pulseLed._t = setTimeout(() => {
    el.statusLed.classList.remove('is-pulsing');
  }, 140);
}

function checkPhasesAndNarrative() {
  let unlockedSomething = false;

  if (state.phase < 1 && state.presses >= 5) {
    state.phase = 1;
    unlockedSomething = true;
  }
  if (state.phase < 2 && state.totalMoney >= 15) {
    state.phase = 2;
    unlockedSomething = true;
  }
  if (state.phase < 3 && (state.totalMoney >= 110 || state.presses >= 45)) {
    state.phase = 3;
    unlockedSomething = true;
  }
  if (state.phase < 4 && state.totalMoney >= 420) {
    state.phase = 4;
    unlockedSomething = true;
  }

  for (const beat of NARRATIVE_BEATS) {
    if (!state.triggeredBeats.includes(beat.id) && beat.condition(state)) {
      state.triggeredBeats.push(beat.id);
      addLog(beat.text, beat.type);
      unlockedSomething = true;
    }
  }

  if (unlockedSomething) {
    playUnlockSound(state.soundEnabled);
    renderVisibility();
    renderUpgrades();
  }
}

function handlePress() {
  const gain = getPressValue(state);
  state.money += gain;
  state.totalMoney += gain;
  state.presses += 1;
  state.depthMeters += 0.12;

  playClickSound(state.soundEnabled, Math.min(state.presses * 0.5, 40));
  spawnFloatDelta(gain);
  pulseLed();
  checkPhasesAndNarrative();
  renderNumbers();
}

function buyUpgrade(id) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return;
  const level = getUpgradeLevel(state, id);
  if (def.maxLevel !== null && level >= def.maxLevel) return;

  const cost = getUpgradeCost(def, level);
  if (state.money < cost) return;

  state.money -= cost;
  state.upgrades[id] = level + 1;
  playUnlockSound(state.soundEnabled);

  checkPhasesAndNarrative();
  renderUpgrades();
  renderNumbers();
  saveState(state);
}

function handleInspectCasing() {
  if (state.casingInspected || state.money < INSPECT_COST) return;
  state.money -= INSPECT_COST;
  state.casingInspected = true;
  state.depthMeters += 4.5;
  playUnlockSound(state.soundEnabled);

  checkPhasesAndNarrative();
  renderVisibility();
  renderUpgrades();
  renderNumbers();
  saveState(state);
}

function renderVisibility() {
  const p = state.phase;

  el.topBar.classList.toggle('is-hidden', p < 1);
  el.currencyLabel.classList.toggle('is-hidden', p < 1);
  el.buttonSub.classList.toggle('is-hidden', p < 1);
  el.sideColumn.classList.toggle('is-hidden', p < 1);
  el.workspace.classList.toggle('has-sidebar', p >= 1);
  el.panelLog.classList.toggle('is-hidden', p < 1);

  el.panelUpgrades.classList.toggle('is-hidden', p < 2);
  el.currencyRate.classList.toggle('is-hidden', p < 2);

  el.telemetryStrip.classList.toggle('is-hidden', p < 3);

  el.secondaryAction.classList.toggle('is-hidden', p < 4 || state.casingInspected);
  el.statusLed.classList.toggle('is-deep', state.casingInspected);

  el.phaseTag.textContent = state.casingInspected
    ? 'RESONANCE'
    : (PHASE_NAMES[p] || 'STANDBY');

  el.buttonLabel.textContent = state.casingInspected ? 'ACTUATE' : 'PRESS';
  el.btnSound.textContent = `AUDIO: ${state.soundEnabled ? 'ON' : 'OFF'}`;
}

function renderNumbers() {
  const pressVal = getPressValue(state);
  const passiveRate = getPassiveRate(state);

  el.currencyValue.textContent = formatMoney(state.money);
  el.currencyRate.textContent = `+${formatMoney(passiveRate)} / sec`;
  el.buttonSub.textContent = `+${formatMoney(pressVal)}`;

  el.statPresses.textContent = state.presses.toLocaleString('en-US');
  el.statPerPress.textContent = formatMoney(pressVal);
  el.statDepth.textContent = `${state.depthMeters.toFixed(1)} m`;

  if (!el.secondaryAction.classList.contains('is-hidden')) {
    el.btnInspect.disabled = state.money < INSPECT_COST;
  }

  // Update affordability state on existing upgrade buttons without rebuilding DOM
  const buttons = el.upgradesList.querySelectorAll('.upgrade-buy-btn');
  for (const btn of buttons) {
    const id = btn.dataset.upgradeId;
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) continue;
    const level = getUpgradeLevel(state, id);
    const maxed = def.maxLevel !== null && level >= def.maxLevel;
    const cost = getUpgradeCost(def, level);
    const canAfford = !maxed && state.money >= cost;
    btn.disabled = !canAfford;
    btn.classList.toggle('can-afford', canAfford);
  }
}

function renderUpgrades() {
  const unlocked = UPGRADES.filter((u) => u.isUnlocked(state));
  let totalInstalled = 0;

  el.upgradesList.innerHTML = '';

  for (const u of unlocked) {
    const level = getUpgradeLevel(state, u.id);
    totalInstalled += level;
    const maxed = u.maxLevel !== null && level >= u.maxLevel;
    const cost = getUpgradeCost(u, level);
    const canAfford = !maxed && state.money >= cost;

    const row = document.createElement('div');
    row.className = 'upgrade-item';

    const info = document.createElement('div');
    info.className = 'upgrade-info';

    const nameRow = document.createElement('div');
    nameRow.className = 'upgrade-name-row';

    const name = document.createElement('span');
    name.className = 'upgrade-name';
    name.textContent = u.name;

    const owned = document.createElement('span');
    owned.className = 'upgrade-owned mono';
    owned.textContent = u.maxLevel ? `${level}/${u.maxLevel}` : `x${level}`;

    nameRow.append(name, owned);

    const desc = document.createElement('div');
    desc.className = 'upgrade-desc';
    desc.textContent = u.desc;

    const eff = document.createElement('div');
    eff.className = 'upgrade-effect mono';
    eff.textContent = u.effectLabel;

    info.append(nameRow, desc, eff);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `upgrade-buy-btn mono${canAfford ? ' can-afford' : ''}`;
    btn.dataset.upgradeId = u.id;
    btn.disabled = !canAfford;
    btn.textContent = maxed ? 'MAXED' : formatMoney(cost);
    btn.addEventListener('click', () => buyUpgrade(u.id));

    row.append(info, btn);
    el.upgradesList.appendChild(row);
  }

  el.upgradesCount.textContent = `${totalInstalled} INSTALLED`;
}

function renderLogs() {
  el.logFeed.innerHTML = '';
  for (const entry of state.logs) {
    const row = document.createElement('div');
    row.className = `log-entry is-${entry.type || 'narrative'}`;

    const time = document.createElement('span');
    time.className = 'log-time mono';
    time.textContent = entry.time;

    const text = document.createElement('span');
    text.className = 'log-text';
    text.textContent = entry.text;

    row.append(time, text);
    el.logFeed.appendChild(row);
  }
  el.logCount.textContent = `${state.logs.length} ${state.logs.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsedSec = Math.min((now - (state.lastTick || now)) / 1000, 4 * 3600);
  const rate = getPassiveRate(state);
  if (elapsedSec > 5 && rate > 0) {
    const earned = rate * elapsedSec;
    state.money += earned;
    state.totalMoney += earned;
    state.depthMeters += elapsedSec * 0.02;
    addLog(`Relays operated while away. Offline yield: +${formatMoney(earned)}.`, 'system');
  }
  state.lastTick = now;
}

function tick(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 1);
  lastFrameTime = now;

  const rate = getPassiveRate(state);
  if (rate > 0) {
    const delta = rate * dt;
    state.money += delta;
    state.totalMoney += delta;
    state.depthMeters += dt * (state.casingInspected ? 0.15 : 0.03);
    checkPhasesAndNarrative();
    renderNumbers();
  }

  if (now - lastSaveTime > 5000) {
    state.lastTick = Date.now();
    saveState(state);
    lastSaveTime = now;
  }

  requestAnimationFrame(tick);
}

// Event Listeners
el.mainButton.addEventListener('click', handlePress);
el.btnInspect.addEventListener('click', handleInspectCasing);

el.btnSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  renderVisibility();
  saveState(state);
});

el.btnReset.addEventListener('click', () => {
  if (!confirm('Reset Unit 04-B? All progress and logs will be cleared.')) return;
  state = clearState();
  renderVisibility();
  renderUpgrades();
  renderLogs();
  renderNumbers();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) {
    const active = document.activeElement;
    if (active && active.tagName === 'BUTTON' && active !== el.mainButton) {
      return;
    }
    e.preventDefault();
    el.mainButton.classList.add('is-pressed');
    handlePress();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    el.mainButton.classList.remove('is-pressed');
  }
});

window.addEventListener('beforeunload', () => {
  state.lastTick = Date.now();
  saveState(state);
});

// Boot
applyOfflineProgress();
checkPhasesAndNarrative();
renderVisibility();
renderUpgrades();
renderLogs();
renderNumbers();
requestAnimationFrame(tick);
