import { fmtMoney, fmtNumber } from '../format.js';
import { getCrossFloorBonuses } from '../modifiers.js';

export const TD_MAX_PADS = 8;
export const TD_INITIAL_PADS = 4;
export const TD_OVERCHARGE_DURATION = 15;
export const TD_OVERCHARGE_MULT = 2.5;

export const TD_TURRET_TYPES = [
  {
    id: 'laser',
    name: 'Redaction Laser',
    role: 'Single-Target DPS',
    desc: 'Focused thermal beam that melts high-priority targets.',
    baseDps: 18,
    dpsScale: 1.55,
    badge: 'LASER'
  },
  {
    id: 'slow',
    name: 'NDA Slow-Field',
    role: 'Slow & Amplify',
    desc: 'Binds intruders in litigation, slowing advance and amplifying all turret damage.',
    baseDps: 6,
    dpsScale: 1.45,
    slowBase: 0.18,
    slowPerLevel: 0.04,
    badge: 'SLOW'
  },
  {
    id: 'cannon',
    name: 'Shredder Cannon',
    role: 'Splash AoE DPS',
    desc: 'Fires high-volume document bursts that shred clustered waves.',
    baseDps: 14,
    dpsScale: 1.55,
    aoeBonus: 1.25,
    badge: 'AOE'
  },
  {
    id: 'tesla',
    name: 'Compliance Tesla',
    role: 'Chain Burst DPS',
    desc: 'Arcs high-voltage policy enforcement across multiple targets.',
    baseDps: 16,
    dpsScale: 1.58,
    chainBonus: 1.2,
    badge: 'CHAIN'
  }
];

export const TD_ENEMY_ARCHETYPES = [
  { id: 'regulators', name: 'Regulators', tag: 'SWARM' },
  { id: 'auditors', name: 'Auditors', tag: 'ARMORED' },
  { id: 'unionizers', name: 'Unionizers', tag: 'RUSH' },
  { id: 'whistleblowers', name: 'Whistleblowers', tag: 'EVASIVE' },
  { id: 'rogue_ai', name: 'Rogue AI', tag: 'BOSS' }
];

let tdSelectedPad = null;

export function tdGetPadCost(unlockedPads) {
  const count = Math.max(TD_INITIAL_PADS, unlockedPads || TD_INITIAL_PADS);
  if (count >= TD_MAX_PADS) return Infinity;
  return Math.round(500 * Math.pow(4, count - TD_INITIAL_PADS));
}

export function tdGetOverchargeCost(wave) {
  const w = Math.max(1, wave || 1);
  return Math.round(1000 * Math.pow(1.25, w - 1));
}

export function tdGetUpgradeCost(turret) {
  const lvl = Math.max(1, turret?.level || 1);
  return Math.round(15 * Math.pow(1.65, lvl - 1));
}

export function tdGetTurretDef(typeId) {
  return TD_TURRET_TYPES.find((t) => t.id === typeId) || TD_TURRET_TYPES[0];
}

export function tdGetTurretDps(turret, bonuses = null) {
  if (!turret) return 0;
  const def = tdGetTurretDef(turret.type);
  const lvl = Math.max(1, turret.level || 1);
  let dps = def.baseDps * Math.pow(def.dpsScale, lvl - 1);
  if (def.aoeBonus) dps *= def.aoeBonus;
  if (def.chainBonus) dps *= def.chainBonus;
  if (bonuses) {
    dps *= (bonuses.tdDamageMult || 1) * (bonuses.tdFireRateMult || 1);
  }
  return dps;
}

export function tdGetWaveStats(wave) {
  const w = Math.max(1, wave || 1);
  const isBoss = w % 5 === 0;
  const archetype = isBoss
    ? TD_ENEMY_ARCHETYPES[4]
    : TD_ENEMY_ARCHETYPES[(w - 1) % 4];
  const totalHp = Math.round(50 * Math.pow(1.28, w - 1) * (isBoss ? 2.8 : 1));
  const baseScrap = Math.round((8 + w * 4) * (isBoss ? 2.5 : 1));
  return {
    wave: w,
    isBoss,
    archetype,
    totalHp,
    baseScrap
  };
}

export function tdGetSlowAmplify(turrets) {
  if (!Array.isArray(turrets)) return 0;
  let amp = 0;
  for (const t of turrets) {
    if (t?.type === 'slow') {
      const def = tdGetTurretDef('slow');
      const lvl = Math.max(1, t.level || 1);
      amp += def.slowBase + def.slowPerLevel * (lvl - 1);
    }
  }
  return Math.min(2.5, amp);
}

export function tdGetTotalDps(state, bonuses = null) {
  const td = state?.td;
  if (!td || !Array.isArray(td.turrets) || td.turrets.length === 0) {
    return { rawDps: 0, slowAmp: 0, effectiveDps: 0 };
  }
  const b = bonuses || getCrossFloorBonuses(state);
  let rawDps = 0;
  for (const t of td.turrets) {
    rawDps += tdGetTurretDps(t, b);
  }
  const slowAmp = tdGetSlowAmplify(td.turrets);
  const overchargeMult = (td.overcharge || 0) > 0 ? TD_OVERCHARGE_MULT : 1;
  const effectiveDps = rawDps * (1 + slowAmp) * overchargeMult;
  return { rawDps, slowAmp, effectiveDps };
}

function tdFindFirstEmptyPad(state) {
  const unlocked = Math.min(TD_MAX_PADS, Math.max(TD_INITIAL_PADS, state.td?.unlockedPads || TD_INITIAL_PADS));
  const turrets = state.td?.turrets || [];
  const used = new Set();
  turrets.forEach((t, idx) => {
    const pIdx = typeof t.padIndex === 'number' ? t.padIndex : (typeof t.id === 'number' ? t.id : idx);
    used.add(pIdx);
  });
  if (tdSelectedPad !== null && tdSelectedPad >= 0 && tdSelectedPad < unlocked && !used.has(tdSelectedPad)) {
    return tdSelectedPad;
  }
  for (let i = 0; i < unlocked; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

export function tdBuyPad(state) {
  if (!state?.td) return false;
  const unlocked = Math.min(TD_MAX_PADS, Math.max(TD_INITIAL_PADS, state.td.unlockedPads || TD_INITIAL_PADS));
  if (unlocked >= TD_MAX_PADS) return false;
  const cost = tdGetPadCost(unlocked);
  if (state.money < cost) return false;
  state.money -= cost;
  state.td.unlockedPads = unlocked + 1;
  tdSelectedPad = unlocked;
  return true;
}

export function tdPlaceTurret(state, typeId) {
  if (!state?.td) return false;
  const def = TD_TURRET_TYPES.find((t) => t.id === typeId);
  if (!def) return false;
  const padIdx = tdFindFirstEmptyPad(state);
  if (padIdx < 0) return false;
  state.td.turrets.push({
    id: padIdx,
    padIndex: padIdx,
    type: def.id,
    level: 1
  });
  tdSelectedPad = null;
  return true;
}

export function tdUpgradeTurret(state, turretIdx) {
  if (!state?.td || !Array.isArray(state.td.turrets)) return false;
  const turret = state.td.turrets[turretIdx];
  if (!turret) return false;
  const cost = tdGetUpgradeCost(turret);
  if ((state.td.scrap || 0) < cost) return false;
  state.td.scrap -= cost;
  turret.level = (turret.level || 1) + 1;
  return true;
}

export function tdSalvageTurret(state, turretIdx) {
  if (!state?.td || !Array.isArray(state.td.turrets)) return false;
  const turret = state.td.turrets[turretIdx];
  if (!turret) return false;
  let refund = 0;
  for (let l = 1; l < (turret.level || 1); l++) {
    refund += Math.round(15 * Math.pow(1.65, l - 1) * 0.5);
  }
  state.td.scrap = (state.td.scrap || 0) + refund;
  state.td.turrets.splice(turretIdx, 1);
  return true;
}

export function tdTriggerOvercharge(state) {
  if (!state?.td) return false;
  if ((state.td.overcharge || 0) > 0) return false;
  const cost = tdGetOverchargeCost(state.td.wave);
  if (state.money < cost) return false;
  state.money -= cost;
  state.td.overcharge = TD_OVERCHARGE_DURATION;
  return true;
}

export function tdToggleAutoWave(state) {
  if (!state?.td) return false;
  state.td.autoWave = !state.td.autoWave;
  return true;
}

export function tdAdvanceWave(state) {
  if (!state?.td) return false;
  if ((state.td.waveProgress || 0) < 1) return false;
  state.td.wave = (state.td.wave || 1) + 1;
  state.td.waveProgress = 0;
  return true;
}

export function tickTD(state, dt, bonuses = null) {
  const result = { wavesCleared: 0, bossCleared: false, clearedWaves: [] };
  if (!state?.td || !Number.isFinite(dt) || dt <= 0) return result;
  if (!Array.isArray(state.unlockedFloors) || !state.unlockedFloors.includes('td')) return result;

  const b = bonuses || getCrossFloorBonuses(state);
  if (!Array.isArray(state.td.bossMilestonesClaimed)) {
    state.td.bossMilestonesClaimed = [];
  }

  let remDt = dt;
  const maxSteps = 200;
  let steps = 0;

  while (remDt > 0 && steps < maxSteps) {
    steps++;
    const { effectiveDps } = tdGetTotalDps(state, b);
    if (effectiveDps <= 0) {
      state.td.overcharge = Math.max(0, (state.td.overcharge || 0) - remDt);
      break;
    }

    if (state.td.autoWave === false && (state.td.waveProgress || 0) >= 1) {
      state.td.waveProgress = 1;
      state.td.overcharge = Math.max(0, (state.td.overcharge || 0) - remDt);
      break;
    }

    const waveStats = tdGetWaveStats(state.td.wave);
    const needed = Math.max(0, 1 - (state.td.waveProgress || 0));
    const timeToClear = (needed * waveStats.totalHp) / effectiveDps;

    if (remDt >= timeToClear) {
      const stepDt = Math.max(0, timeToClear);
      remDt -= stepDt;
      state.td.overcharge = Math.max(0, (state.td.overcharge || 0) - stepDt);

      const clearedWave = state.td.wave;
      const scrapEarned = Math.round(waveStats.baseScrap * (b.tdScrapMult || 1));
      state.td.scrap = (state.td.scrap || 0) + scrapEarned;
      state.td.highestWave = Math.max(state.td.highestWave || 0, clearedWave);

      result.wavesCleared += 1;
      result.clearedWaves.push(clearedWave);

      if (waveStats.isBoss) {
        result.bossCleared = true;
        const bossTier = Math.floor(clearedWave / 5);
        const intelReward = 5 * bossTier;
        if (state.rpg) {
          state.rpg.intel = (state.rpg.intel || 0) + intelReward;
        }
        if (!state.td.bossMilestonesClaimed.includes(clearedWave)) {
          state.td.bossMilestonesClaimed.push(clearedWave);
          const shareReward = 2 * bossTier;
          state.shares = (state.shares || 0) + shareReward;
          state.lifetimeShares = (state.lifetimeShares || 0) + shareReward;
        }
      }

      if (state.td.autoWave !== false) {
        state.td.wave = clearedWave + 1;
        state.td.waveProgress = 0;
      } else {
        state.td.waveProgress = 1;
        break;
      }
    } else {
      state.td.waveProgress = Math.min(1, (state.td.waveProgress || 0) + (effectiveDps * remDt) / waveStats.totalHp);
      state.td.overcharge = Math.max(0, (state.td.overcharge || 0) - remDt);
      remDt = 0;
    }
  }

  return result;
}

function tdComputeRenderSig(state) {
  const td = state.td || {};
  const turretsSig = (td.turrets || [])
    .map((t, idx) => `${t.padIndex ?? t.id ?? idx}:${t.type}:${t.level}`)
    .join(',');
  return `${td.wave}|${td.unlockedPads}|${td.autoWave}|${tdSelectedPad}|${turretsSig}`;
}

export function renderTD(state, containerEl, handlers = {}) {
  if (!containerEl || !state?.td) return;
  const td = state.td;
  const bonuses = getCrossFloorBonuses(state);
  const waveStats = tdGetWaveStats(td.wave);
  const { effectiveDps, slowAmp } = tdGetTotalDps(state, bonuses);
  const unlockedPads = Math.min(TD_MAX_PADS, Math.max(TD_INITIAL_PADS, td.unlockedPads || TD_INITIAL_PADS));
  const padCost = tdGetPadCost(unlockedPads);
  const overchargeCost = tdGetOverchargeCost(td.wave);
  const overchargeActive = (td.overcharge || 0) > 0;
  const highestWave = td.highestWave || 0;
  const moneyBonusPct = highestWave * 10;
  const rpBonusPct = highestWave * 5;
  const emptyPadIdx = tdFindFirstEmptyPad(state);

  // Map padIndex -> { turret, turretIdx }
  const padMap = new Map();
  (td.turrets || []).forEach((t, idx) => {
    const pIdx = typeof t.padIndex === 'number' ? t.padIndex : (typeof t.id === 'number' ? t.id : idx);
    padMap.set(pIdx, { turret: t, turretIdx: idx });
  });

  let padsHtml = '';
  for (let p = 0; p < unlockedPads; p++) {
    const entry = padMap.get(p);
    if (entry) {
      const { turret, turretIdx } = entry;
      const def = tdGetTurretDef(turret.type);
      const dps = tdGetTurretDps(turret, bonuses) * (overchargeActive ? TD_OVERCHARGE_MULT : 1);
      const upgCost = tdGetUpgradeCost(turret);
      const canUpg = (td.scrap || 0) >= upgCost;
      padsHtml += `
        <div class="td-pad-card is-occupied" data-pad-idx="${p}">
          <div class="td-pad-top">
            <span class="card-badge is-accent mono">${def.badge} LV.${turret.level}</span>
            <span class="mono muted">PAD #${p + 1}</span>
          </div>
          <div class="td-pad-name">${def.name}</div>
          <div class="td-pad-stat mono">${fmtNumber(dps, 1)} DPS</div>
          <div class="td-pad-actions">
            <button
              class="btn-buy mono ${canUpg ? 'can-afford' : ''}"
              type="button"
              data-td-action="upgrade-turret"
              data-turret-idx="${turretIdx}"
              ${canUpg ? '' : 'disabled'}
            >UPGRADE (${fmtNumber(upgCost, 0)} SCRAP)</button>
            <button
              class="icon-btn mono td-salvage-btn"
              type="button"
              data-td-action="salvage-turret"
              data-turret-idx="${turretIdx}"
              title="Salvage turret for 50% upgrade Scrap refund"
            >SALVAGE</button>
          </div>
        </div>
      `;
    } else {
      const isSelected = emptyPadIdx === p;
      padsHtml += `
        <div class="td-pad-card is-empty ${isSelected ? 'is-selected' : ''}" data-pad-idx="${p}">
          <div class="td-pad-top">
            <span class="card-badge mono">EMPTY</span>
            <span class="mono muted">PAD #${p + 1}</span>
          </div>
          <div class="td-pad-name muted">Open Turret Mount</div>
          <div class="td-pad-stat mono">${isSelected ? 'TARGETED FOR DEPLOY' : 'Click to target'}</div>
          <button
            class="icon-btn mono"
            type="button"
            data-td-action="select-pad"
            data-pad-idx="${p}"
          >${isSelected ? 'TARGETED' : 'SELECT PAD'}</button>
        </div>
      `;
    }
  }

  let armoryHtml = '';
  for (const def of TD_TURRET_TYPES) {
    const canDeploy = emptyPadIdx >= 0;
    armoryHtml += `
      <div class="td-armory-card">
        <div class="td-armory-head">
          <span class="card-badge is-info mono">${def.badge}</span>
          <span class="td-armory-role mono">${def.role}</span>
        </div>
        <div class="td-armory-name">${def.name}</div>
        <div class="td-armory-desc">${def.desc}</div>
        <div class="td-armory-foot">
          <span class="mono td-armory-dps">${fmtNumber(def.baseDps, 0)} Base DPS</span>
          <button
            class="btn-buy mono ${canDeploy ? 'can-afford' : ''}"
            type="button"
            data-td-turret-type="${def.id}"
            ${canDeploy ? '' : 'disabled'}
          >DEPLOY (0 SCRAP)</button>
        </div>
      </div>
    `;
  }

  const pct = Math.min(100, Math.max(0, (td.waveProgress || 0) * 100));
  const remHp = Math.max(0, waveStats.totalHp * (1 - (td.waveProgress || 0)));
  const canBuyPad = unlockedPads < TD_MAX_PADS && state.money >= padCost;
  const canOvercharge = !overchargeActive && state.money >= overchargeCost;

  containerEl.innerHTML = `
    <div class="td-shell ${overchargeActive ? 'td-overcharge-active' : ''}" data-td-render-sig="${tdComputeRenderSig(state)}">
      <div class="td-header">
        <div class="td-header-left">
          <span class="card-badge is-accent mono">B2 // SECURITY PERIMETER</span>
          <h2 class="td-title">Containment Perimeter</h2>
          <span class="td-integrity-pill mono" data-td-role="integrity">
            Containment Integrity: +${moneyBonusPct}% $/s &amp; +${rpBonusPct}% RP/s
          </span>
        </div>
        <div class="td-header-actions">
          <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
        </div>
      </div>

      <div class="td-telemetry">
        <div class="td-stat-box">
          <span class="td-stat-label mono">CURRENT WAVE</span>
          <span class="td-stat-val mono" data-td-role="wave">WAVE ${waveStats.wave}${waveStats.isBoss ? ' [BOSS]' : ''}</span>
        </div>
        <div class="td-stat-box">
          <span class="td-stat-label mono">HIGHEST CLEARED</span>
          <span class="td-stat-val mono" data-td-role="best">WAVE ${highestWave}</span>
        </div>
        <div class="td-stat-box">
          <span class="td-stat-label mono">SECURITY SCRAP</span>
          <span class="td-stat-val mono" data-td-role="scrap">${fmtNumber(td.scrap || 0, 0)}</span>
        </div>
        <div class="td-stat-box">
          <span class="td-stat-label mono">PERIMETER DPS</span>
          <span class="td-stat-val mono" data-td-role="dps">${fmtNumber(effectiveDps, 1)} / s</span>
        </div>
      </div>

      <div class="td-controls">
        <button
          class="btn-buy mono ${canBuyPad ? 'can-afford' : ''}"
          type="button"
          data-td-action="buy-pad"
          ${canBuyPad ? '' : 'disabled'}
        >${unlockedPads >= TD_MAX_PADS ? `PADS MAXED (${unlockedPads}/${TD_MAX_PADS})` : `BUY PAD (${fmtMoney(padCost)})`}</button>

        <button
          class="btn-buy mono ${canOvercharge ? 'can-afford' : ''}"
          type="button"
          data-td-action="overcharge"
          ${canOvercharge ? '' : 'disabled'}
        >${overchargeActive ? `OVERCHARGE (${td.overcharge.toFixed(1)}s)` : `OVERCHARGE (${fmtMoney(overchargeCost)})`}</button>

        <button
          class="icon-btn mono"
          type="button"
          data-td-action="toggle-auto"
        >AUTO-WAVE: ${td.autoWave !== false ? 'ON' : 'OFF'}</button>

        ${td.autoWave === false ? `
          <button
            class="btn-accent mono"
            type="button"
            data-td-action="next-wave"
            ${(td.waveProgress || 0) >= 1 ? '' : 'disabled'}
          >NEXT WAVE</button>
        ` : ''}
      </div>

      <div class="td-lane">
        <div class="td-lane-head">
          <div class="td-threat-info">
            <span class="card-badge ${waveStats.isBoss ? 'is-danger' : 'is-info'} mono" data-td-role="enemy-tag">${waveStats.archetype.tag}</span>
            <strong class="td-threat-name" data-td-role="enemy-name">${waveStats.archetype.name}</strong>
            ${slowAmp > 0 ? `<span class="mono td-slow-tag" data-td-role="slow-tag">SLOW +${Math.round(slowAmp * 100)}% DMG</span>` : ''}
          </div>
          <span class="mono td-hp-text" data-td-role="hp-text">${fmtNumber(remHp, 0)} / ${fmtNumber(waveStats.totalHp, 0)} HP</span>
        </div>
        <div class="gen-bar-track td-wave-track">
          <div class="gen-bar-fill ${waveStats.isBoss ? 'is-boss' : ''}" data-td-role="wave-bar" style="width: ${pct}%"></div>
        </div>
        <div class="td-lane-foot mono">
          <span>Reward: +${fmtNumber(Math.round(waveStats.baseScrap * (bonuses.tdScrapMult || 1)), 0)} Scrap${waveStats.isBoss ? ` + ${5 * Math.floor(waveStats.wave / 5)} Intel` : ''}</span>
          <span data-td-role="pad-count">Pads: ${td.turrets.length}/${unlockedPads} Active (Max ${TD_MAX_PADS})</span>
        </div>
      </div>

      <div class="td-grid">
        <div class="td-section">
          <div class="td-section-head">
            <h3>Turret Pads (${unlockedPads}/${TD_MAX_PADS})</h3>
          </div>
          <div class="td-pads-grid">${padsHtml}</div>
        </div>

        <div class="td-section">
          <div class="td-section-head">
            <h3>Turret Armory</h3>
          </div>
          <div class="td-armory-list">${armoryHtml}</div>
        </div>
      </div>
    </div>
  `;
}

export function updateTDUI(state, containerEl) {
  if (!containerEl || !state?.td) return;
  const shell = containerEl.querySelector('.td-shell');
  if (!shell) {
    renderTD(state, containerEl);
    return;
  }

  const sig = tdComputeRenderSig(state);
  if (shell.dataset.tdRenderSig !== sig) {
    renderTD(state, containerEl);
    return;
  }

  const td = state.td;
  const bonuses = getCrossFloorBonuses(state);
  const waveStats = tdGetWaveStats(td.wave);
  const { effectiveDps } = tdGetTotalDps(state, bonuses);
  const overchargeActive = (td.overcharge || 0) > 0;
  const unlockedPads = Math.min(TD_MAX_PADS, Math.max(TD_INITIAL_PADS, td.unlockedPads || TD_INITIAL_PADS));
  const padCost = tdGetPadCost(unlockedPads);
  const overchargeCost = tdGetOverchargeCost(td.wave);

  shell.classList.toggle('td-overcharge-active', overchargeActive);

  const waveEl = shell.querySelector('[data-td-role="wave"]');
  if (waveEl) waveEl.textContent = `WAVE ${waveStats.wave}${waveStats.isBoss ? ' [BOSS]' : ''}`;

  const bestEl = shell.querySelector('[data-td-role="best"]');
  if (bestEl) bestEl.textContent = `WAVE ${td.highestWave || 0}`;

  const scrapEl = shell.querySelector('[data-td-role="scrap"]');
  if (scrapEl) scrapEl.textContent = fmtNumber(td.scrap || 0, 0);

  const dpsEl = shell.querySelector('[data-td-role="dps"]');
  if (dpsEl) dpsEl.textContent = `${fmtNumber(effectiveDps, 1)} / s`;

  const integrityEl = shell.querySelector('[data-td-role="integrity"]');
  if (integrityEl) {
    const hw = td.highestWave || 0;
    integrityEl.textContent = `Containment Integrity: +${hw * 10}% $/s & +${hw * 5}% RP/s`;
  }

  const pct = Math.min(100, Math.max(0, (td.waveProgress || 0) * 100));
  const remHp = Math.max(0, waveStats.totalHp * (1 - (td.waveProgress || 0)));
  const barEl = shell.querySelector('[data-td-role="wave-bar"]');
  if (barEl) barEl.style.width = `${pct}%`;

  const hpEl = shell.querySelector('[data-td-role="hp-text"]');
  if (hpEl) hpEl.textContent = `${fmtNumber(remHp, 0)} / ${fmtNumber(waveStats.totalHp, 0)} HP`;

  const buyPadBtn = shell.querySelector('[data-td-action="buy-pad"]');
  if (buyPadBtn) {
    const canBuyPad = unlockedPads < TD_MAX_PADS && state.money >= padCost;
    buyPadBtn.disabled = !canBuyPad;
    buyPadBtn.classList.toggle('can-afford', canBuyPad);
    buyPadBtn.textContent = unlockedPads >= TD_MAX_PADS
      ? `PADS MAXED (${unlockedPads}/${TD_MAX_PADS})`
      : `BUY PAD (${fmtMoney(padCost)})`;
  }

  const ocBtn = shell.querySelector('[data-td-action="overcharge"]');
  if (ocBtn) {
    const canOc = !overchargeActive && state.money >= overchargeCost;
    ocBtn.disabled = !canOc;
    ocBtn.classList.toggle('can-afford', canOc);
    ocBtn.textContent = overchargeActive
      ? `OVERCHARGE (${td.overcharge.toFixed(1)}s)`
      : `OVERCHARGE (${fmtMoney(overchargeCost)})`;
  }

  const nextWaveBtn = shell.querySelector('[data-td-action="next-wave"]');
  if (nextWaveBtn) {
    nextWaveBtn.disabled = (td.waveProgress || 0) < 1;
  }

  for (const btn of shell.querySelectorAll('[data-td-action="upgrade-turret"]')) {
    const idx = Number(btn.dataset.turretIdx);
    const turret = td.turrets[idx];
    if (!turret) continue;
    const cost = tdGetUpgradeCost(turret);
    const canUpg = (td.scrap || 0) >= cost;
    btn.disabled = !canUpg;
    btn.classList.toggle('can-afford', canUpg);
  }
}

export function bindTDEvents(containerEl, getState, onAction) {
  if (!containerEl || containerEl.dataset.tdBound === 'true') return;
  containerEl.dataset.tdBound = 'true';

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;

    if (btn.hasAttribute('data-return-desk')) {
      onAction({ type: 'return-desk' });
      return;
    }

    const turretType = btn.dataset.tdTurretType;
    if (turretType) {
      onAction({ type: 'place-turret', turretType });
      return;
    }

    const action = btn.dataset.tdAction;
    if (!action) return;

    if (action === 'buy-pad') {
      onAction({ type: 'buy-pad' });
    } else if (action === 'overcharge') {
      onAction({ type: 'overcharge' });
    } else if (action === 'toggle-auto') {
      onAction({ type: 'toggle-auto' });
    } else if (action === 'next-wave') {
      onAction({ type: 'next-wave' });
    } else if (action === 'select-pad') {
      tdSelectedPad = Number(btn.dataset.padIdx);
      onAction({ type: 'select-pad', padIdx: tdSelectedPad });
    } else if (action === 'upgrade-turret') {
      onAction({ type: 'upgrade-turret', turretIdx: Number(btn.dataset.turretIdx) });
    } else if (action === 'salvage-turret') {
      onAction({ type: 'salvage-turret', turretIdx: Number(btn.dataset.turretIdx) });
    }
  });
}
