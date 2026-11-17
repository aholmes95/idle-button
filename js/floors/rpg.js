import { fmtNumber } from '../format.js';

const combatMap = new WeakMap();

const ENEMY_NAMES = [
  'Rogue Shredder',
  'Compliance Drone',
  'Static Phantom',
  'Vault Sentinel',
  'Redacted Hound'
];

const BOSS_NAMES = [
  'Sector Warden',
  'Directorate Mech',
  'Sub-Level Leviathan',
  'The Auditor'
];

const ARTIFACT_TEMPLATES = [
  { name: 'Lead Signet', bonusType: 'clickMult', bonusVal: 0.25 },
  { name: 'Rust Plate', bonusType: 'tdDamageMult', bonusVal: 0.15 },
  { name: 'Obsidian Keycard', bonusType: 'moneyMult', bonusVal: 0.20 },
  { name: 'Tactical Visor', bonusType: 'rpgAtkMult', bonusVal: 0.20 },
  { name: 'Catalyst Lens', bonusType: 'mergeSpeedMult', bonusVal: 0.15 }
];

export function ensureRPGSquad(state) {
  if (!state.rpg) return;
  if (!Array.isArray(state.rpg.squad) || state.rpg.squad.length === 0) {
    state.rpg.squad = [
      { name: 'Operative-01', atk: 14, hp: 100, maxHp: 100, def: 4, spd: 1 }
    ];
  }
}

function getCombatState(state) {
  let c = combatMap.get(state.rpg);
  if (!c) {
    c = {
      enemy: null,
      opTimers: [],
      enemyTimer: 0,
      lastLog: 'Squad deployed to sector perimeter.'
    };
    combatMap.set(state.rpg, c);
  }
  return c;
}

function spawnEnemy(rpg) {
  const sector = Math.max(1, rpg.sector || 1);
  const stage = Math.max(1, rpg.stage || 1);
  const isBoss = stage === 10;
  const scale = Math.pow(1.65, sector - 1) * (1 + (stage - 1) * 0.22);
  const maxHp = Math.round(28 * scale * (isBoss ? 2.6 : 1));
  const atk = Math.round(6 * Math.pow(1.45, sector - 1) * (1 + (stage - 1) * 0.15) * (isBoss ? 1.5 : 1));
  const def = Math.floor((sector - 1) * 2 + (isBoss ? 3 : 0));
  const name = isBoss
    ? BOSS_NAMES[(sector - 1) % BOSS_NAMES.length]
    : ENEMY_NAMES[(sector + stage) % ENEMY_NAMES.length];

  return {
    name,
    isBoss,
    hp: maxHp,
    maxHp,
    atk,
    def,
    rewardCredits: Math.round(14 * Math.pow(1.4, sector - 1) * (isBoss ? 3.5 : 1)),
    rewardIntel: isBoss ? 15 : 2
  };
}

export function getRPGStatUpgradeCost(state, stat) {
  const squad = state.rpg?.squad || [];
  const lead = squad[0] || { atk: 14, maxHp: 100, def: 4, spd: 1 };
  if (stat === 'atk') return Math.round(25 * Math.pow(1.35, Math.max(0, Math.floor((lead.atk - 10) / 3))));
  if (stat === 'hp') return Math.round(20 * Math.pow(1.3, Math.max(0, Math.floor((lead.maxHp - 100) / 25))));
  if (stat === 'def') return Math.round(30 * Math.pow(1.35, Math.max(0, lead.def - 4)));
  if (stat === 'spd') return Math.round(50 * Math.pow(1.6, Math.max(0, Math.round((lead.spd - 1) / 0.2))));
  return 50;
}

export function getRPGRecruitCost(state) {
  const count = state.rpg?.squad?.length || 1;
  return Math.round(250 * Math.pow(4, count - 1));
}

export function rpgUpgradeStat(state, stat) {
  if (!state.rpg) return false;
  ensureRPGSquad(state);
  const cost = getRPGStatUpgradeCost(state, stat);
  if (state.rpg.credits < cost) return false;
  state.rpg.credits -= cost;

  for (const op of state.rpg.squad) {
    if (stat === 'atk') op.atk += 4;
    else if (stat === 'hp') {
      op.maxHp += 30;
      op.hp = Math.min(op.maxHp, op.hp + 30);
    } else if (stat === 'def') op.def += 2;
    else if (stat === 'spd') op.spd = Math.round((op.spd + 0.2) * 10) / 10;
  }
  return true;
}

export function rpgRecruitOperative(state) {
  if (!state.rpg) return false;
  ensureRPGSquad(state);
  if (state.rpg.squad.length >= 3) return false;
  const cost = getRPGRecruitCost(state);
  if (state.rpg.credits < cost) return false;
  state.rpg.credits -= cost;

  const idx = state.rpg.squad.length + 1;
  const lead = state.rpg.squad[0];
  state.rpg.squad.push({
    name: `Operative-0${idx}`,
    atk: Math.max(10, Math.round(lead.atk * 0.85)),
    hp: lead.maxHp,
    maxHp: lead.maxHp,
    def: lead.def,
    spd: lead.spd
  });
  return true;
}

export function rpgEquipArtifact(state, artId) {
  if (!state.rpg) return false;
  const exists = state.rpg.artifacts.some((a) => a.id === artId);
  if (!exists) return false;
  const idx = state.rpg.equipped.indexOf(artId);
  if (idx >= 0) {
    state.rpg.equipped.splice(idx, 1);
    return true;
  }
  if (state.rpg.equipped.length >= 3) {
    state.rpg.equipped.shift();
  }
  state.rpg.equipped.push(artId);
  return true;
}

export function rpgSalvageArtifact(state, artId) {
  if (!state.rpg) return false;
  const idx = state.rpg.artifacts.findIndex((a) => a.id === artId);
  if (idx < 0) return false;
  const [art] = state.rpg.artifacts.splice(idx, 1);
  const eqIdx = state.rpg.equipped.indexOf(artId);
  if (eqIdx >= 0) state.rpg.equipped.splice(eqIdx, 1);
  state.rpg.shards = (state.rpg.shards || 0) + 5 + Math.round((art.bonusVal || 0.1) * 25);
  return true;
}

export function rpgInfuseShards(state) {
  if (!state.rpg || (state.rpg.shards || 0) < 10) return false;
  ensureRPGSquad(state);
  state.rpg.shards -= 10;
  for (const op of state.rpg.squad) {
    op.atk = Math.round(op.atk * 1.15) + 1;
    op.maxHp = Math.round(op.maxHp * 1.15);
    op.hp = op.maxHp;
  }
  return true;
}

export function tickRPG(state, dt, bonuses) {
  if (!state.rpg) return { stageCleared: false, bossCleared: false };
  ensureRPGSquad(state);
  const rpg = state.rpg;
  const combat = getCombatState(state);

  if (!combat.enemy) {
    combat.enemy = spawnEnemy(rpg);
  }

  const atkMult = bonuses?.rpgAtkMult || 1;
  const defMult = bonuses?.rpgDefMult || 1;
  const hpMult = bonuses?.rpgHpMult || 1;

  let stageCleared = false;
  let bossCleared = false;

  // Squad attacks
  for (let i = 0; i < rpg.squad.length; i++) {
    const op = rpg.squad[i];
    if (op.hp <= 0) continue;
    combat.opTimers[i] = (combat.opTimers[i] || 0) + dt;
    const interval = 1.1 / Math.max(0.4, op.spd || 1);
    if (combat.opTimers[i] >= interval) {
      combat.opTimers[i] -= interval;
      const dmg = Math.max(1, Math.round(op.atk * atkMult - combat.enemy.def));
      combat.enemy.hp = Math.max(0, combat.enemy.hp - dmg);
    }
  }

  // Enemy defeated
  if (combat.enemy.hp <= 0) {
    rpg.credits += combat.enemy.rewardCredits;
    rpg.intel += combat.enemy.rewardIntel;
    stageCleared = true;

    if (combat.enemy.isBoss) {
      bossCleared = true;
      rpg.highestSector = Math.max(rpg.highestSector || 1, rpg.sector);
      if (rpg.artifacts.length < 12) {
        const tpl = ARTIFACT_TEMPLATES[(rpg.sector + rpg.artifacts.length) % ARTIFACT_TEMPLATES.length];
        rpg.artifacts.push({
          id: `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: `${tpl.name} Mk.${rpg.sector}`,
          bonusType: tpl.bonusType,
          bonusVal: Math.round((tpl.bonusVal + (rpg.sector - 1) * 0.05) * 100) / 100
        });
      }
      rpg.sector += 1;
      rpg.stage = 1;
      for (const op of rpg.squad) {
        op.hp = Math.round(op.maxHp * hpMult);
      }
      combat.lastLog = `Sector Boss defeated! Advanced to Sector ${rpg.sector}.`;
    } else {
      rpg.stage += 1;
      for (const op of rpg.squad) {
        const cap = Math.round(op.maxHp * hpMult);
        op.hp = Math.min(cap, op.hp + Math.round(cap * 0.25));
      }
      combat.lastLog = `Eliminated ${combat.enemy.name} (+${combat.enemy.rewardCredits} Credits).`;
    }
    combat.enemy = spawnEnemy(rpg);
    return { stageCleared, bossCleared };
  }

  // Enemy attacks
  combat.enemyTimer += dt;
  if (combat.enemyTimer >= 1.6) {
    combat.enemyTimer -= 1.6;
    const alive = rpg.squad.filter((o) => o.hp > 0);
    if (alive.length > 0) {
      const target = alive[0];
      const dmg = Math.max(1, Math.round(combat.enemy.atk - target.def * defMult));
      target.hp = Math.max(0, target.hp - dmg);
    }
    if (rpg.squad.every((o) => o.hp <= 0)) {
      // Squad regroup
      for (const op of rpg.squad) {
        op.hp = Math.round(op.maxHp * hpMult);
      }
      if (rpg.stage > 1) rpg.stage -= 1;
      combat.enemy = spawnEnemy(rpg);
      combat.lastLog = 'Squad overwhelmed — regrouping at previous perimeter.';
    }
  }

  return { stageCleared, bossCleared };
}

export function renderRPG(state, containerEl) {
  if (!containerEl || !state.rpg) return;
  ensureRPGSquad(state);
  const rpg = state.rpg;
  const combat = getCombatState(state);
  if (!combat.enemy) combat.enemy = spawnEnemy(rpg);

  const recruitCost = getRPGRecruitCost(state);
  const canRecruit = rpg.squad.length < 3 && rpg.credits >= recruitCost;

  containerEl.innerHTML = `
    <div class="floor-shell">
      <div class="floor-header">
        <div>
          <div class="floor-placeholder-badge mono">B4 // FIELD OPS</div>
          <h2 class="floor-title">Sector Expedition Squad</h2>
        </div>
        <div class="floor-stats-row mono">
          <span class="stat-pill">SECTOR <strong data-rpg-stat="sector">${rpg.sector}-${rpg.stage}</strong></span>
          <span class="stat-pill">CREDITS: <strong data-rpg-stat="credits">${fmtNumber(rpg.credits)}</strong></span>
          <span class="stat-pill">INTEL: <strong data-rpg-stat="intel">${fmtNumber(rpg.intel)}</strong></span>
          <span class="stat-pill">SHARDS: <strong data-rpg-stat="shards">${fmtNumber(rpg.shards || 0)}</strong></span>
        </div>
        <button class="icon-btn mono" type="button" data-return-desk>RETURN TO 1F: DESK</button>
      </div>

      <div class="floor-grid-2col">
        <div class="floor-panel">
          <div class="panel-toolbar">
            <span class="toolbar-title mono">ACTIVE ENGAGEMENT</span>
            <span class="toolbar-meta mono" data-rpg-stat="log">${combat.lastLog}</span>
          </div>

          <div class="rpg-enemy-card">
            <div class="rpg-unit-top">
              <span class="mono" data-rpg-enemy="name">${combat.enemy.isBoss ? '[BOSS] ' : ''}${combat.enemy.name}</span>
              <span class="mono" data-rpg-enemy="hp-text">${combat.enemy.hp} / ${combat.enemy.maxHp} HP</span>
            </div>
            <div class="gen-bar-track"><div class="gen-bar-fill" data-rpg-enemy="hp-bar" style="width:${(combat.enemy.hp / combat.enemy.maxHp) * 100}%"></div></div>
          </div>

          <div class="rpg-squad-list" data-rpg-squad>
            ${rpg.squad.map((op, i) => `
              <div class="rpg-unit-card" data-op-idx="${i}">
                <div class="rpg-unit-top">
                  <span class="mono">${op.name}</span>
                  <span class="mono" data-op-stats>ATK ${op.atk} • DEF ${op.def} • SPD ${op.spd}</span>
                </div>
                <div class="gen-bar-track"><div class="gen-bar-fill" data-op-hpbar style="width:${Math.min(100, (op.hp / op.maxHp) * 100)}%"></div></div>
              </div>
            `).join('')}
          </div>

          <div class="rpg-upgrade-bar">
            ${['atk', 'hp', 'def', 'spd'].map((stat) => {
              const cost = getRPGStatUpgradeCost(state, stat);
              return `<button class="btn-buy mono${rpg.credits >= cost ? ' can-afford' : ''}" type="button" data-rpg-upgrade="${stat}" ${rpg.credits < cost ? 'disabled' : ''}>+${stat.toUpperCase()} (${fmtNumber(cost)})</button>`;
            }).join('')}
            <button class="btn-buy mono${canRecruit ? ' can-afford' : ''}" type="button" data-rpg-action="recruit" ${!canRecruit ? 'disabled' : ''}>
              ${rpg.squad.length >= 3 ? 'SQUAD FULL (3/3)' : `RECRUIT (${fmtNumber(recruitCost)})`}
            </button>
          </div>
        </div>

        <div class="floor-panel">
          <div class="panel-toolbar">
            <span class="toolbar-title mono">CONTAINMENT ARTIFACTS (${rpg.equipped.length}/3 EQUIPPED)</span>
            <button class="btn-buy mono${(rpg.shards || 0) >= 10 ? ' can-afford' : ''}" type="button" data-rpg-action="infuse" ${(rpg.shards || 0) < 10 ? 'disabled' : ''}>INFUSE 10 SHARDS</button>
          </div>
          <div class="rpg-artifacts-list" data-rpg-artifacts>
            ${rpg.artifacts.length === 0
              ? '<div class="muted-text mono">Defeat Sector Bosses (Stage 10) to recover Containment Artifacts.</div>'
              : rpg.artifacts.map((art) => {
                  const isEq = rpg.equipped.includes(art.id);
                  return `
                    <div class="upgrade-card${isEq ? ' is-owned' : ''}">
                      <div>
                        <div class="upgrade-card-title">${art.name}</div>
                        <div class="upgrade-card-effect mono">+${Math.round(art.bonusVal * 100)}% ${art.bonusType}</div>
                      </div>
                      <div class="rpg-art-actions">
                        <button class="btn-buy mono" type="button" data-rpg-action="equip" data-art-id="${art.id}">${isEq ? 'UNEQUIP' : 'EQUIP'}</button>
                        <button class="icon-btn mono" type="button" data-rpg-action="salvage" data-art-id="${art.id}">SALVAGE</button>
                      </div>
                    </div>
                  `;
                }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function updateRPGUI(state, containerEl) {
  if (!containerEl || !state.rpg || containerEl.classList.contains('is-hidden')) return;
  const rpg = state.rpg;
  const combat = getCombatState(state);
  if (!combat.enemy) return;

  const setTxt = (sel, val) => {
    const node = containerEl.querySelector(sel);
    if (node) node.textContent = val;
  };

  setTxt('[data-rpg-stat="sector"]', `${rpg.sector}-${rpg.stage}`);
  setTxt('[data-rpg-stat="credits"]', fmtNumber(rpg.credits));
  setTxt('[data-rpg-stat="intel"]', fmtNumber(rpg.intel));
  setTxt('[data-rpg-stat="shards"]', fmtNumber(rpg.shards || 0));
  setTxt('[data-rpg-stat="log"]', combat.lastLog);
  setTxt('[data-rpg-enemy="name"]', `${combat.enemy.isBoss ? '[BOSS] ' : ''}${combat.enemy.name}`);
  setTxt('[data-rpg-enemy="hp-text"]', `${combat.enemy.hp} / ${combat.enemy.maxHp} HP`);

  const eBar = containerEl.querySelector('[data-rpg-enemy="hp-bar"]');
  if (eBar) eBar.style.width = `${Math.max(0, Math.min(100, (combat.enemy.hp / combat.enemy.maxHp) * 100))}%`;

  rpg.squad.forEach((op, i) => {
    const card = containerEl.querySelector(`[data-op-idx="${i}"]`);
    if (!card) return;
    const bar = card.querySelector('[data-op-hpbar]');
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, (op.hp / op.maxHp) * 100))}%`;
    const stats = card.querySelector('[data-op-stats]');
    if (stats) stats.textContent = `ATK ${op.atk} • DEF ${op.def} • SPD ${op.spd}`;
  });

  for (const stat of ['atk', 'hp', 'def', 'spd']) {
    const btn = containerEl.querySelector(`[data-rpg-upgrade="${stat}"]`);
    if (!btn) continue;
    const cost = getRPGStatUpgradeCost(state, stat);
    const ok = rpg.credits >= cost;
    btn.textContent = `+${stat.toUpperCase()} (${fmtNumber(cost)})`;
    btn.disabled = !ok;
    btn.classList.toggle('can-afford', ok);
  }

  const recBtn = containerEl.querySelector('[data-rpg-action="recruit"]');
  if (recBtn) {
    const rCost = getRPGRecruitCost(state);
    const ok = rpg.squad.length < 3 && rpg.credits >= rCost;
    recBtn.textContent = rpg.squad.length >= 3 ? 'SQUAD FULL (3/3)' : `RECRUIT (${fmtNumber(rCost)})`;
    recBtn.disabled = !ok;
    recBtn.classList.toggle('can-afford', ok);
  }

  const infBtn = containerEl.querySelector('[data-rpg-action="infuse"]');
  if (infBtn) {
    const ok = (rpg.shards || 0) >= 10;
    infBtn.disabled = !ok;
    infBtn.classList.toggle('can-afford', ok);
  }
}

export function bindRPGEvents(containerEl, getState, onAction) {
  if (!containerEl || containerEl.dataset.rpgBound) return;
  containerEl.dataset.rpgBound = '1';

  containerEl.addEventListener('click', (e) => {
    const state = getState();
    const returnBtn = e.target.closest('[data-return-desk]');
    if (returnBtn) {
      onAction('return-desk');
      return;
    }

    const upgBtn = e.target.closest('[data-rpg-upgrade]');
    if (upgBtn) {
      if (rpgUpgradeStat(state, upgBtn.dataset.rpgUpgrade)) {
        renderRPG(state, containerEl);
        onAction('rpg-updated');
      }
      return;
    }

    const actBtn = e.target.closest('[data-rpg-action]');
    if (!actBtn) return;
    const action = actBtn.dataset.rpgAction;
    let changed = false;
    if (action === 'recruit') changed = rpgRecruitOperative(state);
    else if (action === 'equip') changed = rpgEquipArtifact(state, actBtn.dataset.artId);
    else if (action === 'salvage') changed = rpgSalvageArtifact(state, actBtn.dataset.artId);
    else if (action === 'infuse') changed = rpgInfuseShards(state);

    if (changed) {
      renderRPG(state, containerEl);
      onAction('rpg-updated');
    }
  });
}
