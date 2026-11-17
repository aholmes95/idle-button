import { fmtMoney, fmtNumber } from '../format.js';

const timerMap = new WeakMap();
let selectedCell = null;

function getTimers(state) {
  let t = timerMap.get(state.merge);
  if (!t) {
    t = { spawnTimer: 0, autoMergeTimer: 0.7 };
    timerMap.set(state.merge, t);
  }
  return t;
}

export function getMergeSpawnCost(state) {
  const lvl = state.merge?.spawnerLevel || 1;
  return Math.round(150 * Math.pow(1.35, lvl - 1));
}

export function getMergeSpawnerUpgradeCost(state) {
  const lvl = state.merge?.spawnerLevel || 1;
  return Math.round(400 * Math.pow(2.2, lvl - 1));
}

export function getMergeBaseUpgradeCost(state) {
  const tier = state.merge?.baseTier || 1;
  return Math.round(40 * Math.pow(2.4, tier - 1));
}

export function getMergeGridAura(state) {
  const grid = state.merge?.grid || [];
  let power = 0;
  for (const cell of grid) {
    if (typeof cell === 'number' && cell > 0) {
      power += Math.pow(2, cell - 1);
    }
  }
  return power;
}

export function mergeSpawnCore(state, free = false) {
  if (!state.merge) return false;
  if (!Array.isArray(state.merge.grid) || state.merge.grid.length < 16) {
    state.merge.grid = Array(16).fill(null);
  }
  const emptyIdx = state.merge.grid.findIndex((c) => c === null);
  if (emptyIdx < 0) return false;

  if (!free) {
    const cost = getMergeSpawnCost(state);
    if (state.money < cost) return false;
    state.money -= cost;
  }

  const tier = state.merge.baseTier || 1;
  state.merge.grid[emptyIdx] = tier;
  state.merge.peakTier = Math.max(state.merge.peakTier || 0, tier);
  return true;
}

export function mergeCells(state, idxA, idxB) {
  if (!state.merge || idxA === idxB) return false;
  const grid = state.merge.grid;
  const tierA = grid[idxA];
  const tierB = grid[idxB];
  if (!tierA || !tierB || tierA !== tierB) return false;

  const nextTier = tierA + 1;
  grid[idxB] = nextTier;
  grid[idxA] = null;

  const prevPeak = state.merge.peakTier || 0;
  if (nextTier > prevPeak) {
    state.merge.peakTier = nextTier;
    if (nextTier >= 3) {
      state.merge.catalysts = (state.merge.catalysts || 0) + 1;
    }
  }
  return true;
}

export function mergeUpgradeSpawner(state) {
  if (!state.merge) return false;
  const cost = getMergeSpawnerUpgradeCost(state);
  if (state.money < cost) return false;
  state.money -= cost;
  state.merge.spawnerLevel = (state.merge.spawnerLevel || 1) + 1;
  return true;
}

export function mergeUpgradeBaseTier(state) {
  if (!state.merge) return false;
  const cost = getMergeBaseUpgradeCost(state);
  if (state.rp < cost) return false;
  state.rp -= cost;
  state.merge.baseTier = (state.merge.baseTier || 1) + 1;
  return true;
}

export function mergeToggleAuto(state) {
  if (!state.merge) return false;
  state.merge.autoMerge = !state.merge.autoMerge;
  return true;
}

function tryAutoMergeOnce(state) {
  const grid = state.merge?.grid || [];
  const seen = new Map();
  for (let i = 0; i < grid.length; i++) {
    const tier = grid[i];
    if (!tier) continue;
    if (seen.has(tier)) {
      return mergeCells(state, seen.get(tier), i);
    }
    seen.set(tier, i);
  }
  return false;
}

export function tickMerge(state, dt, bonuses) {
  if (!state.merge) return { merged: false, spawned: false };
  const t = getTimers(state);
  const speedMult = bonuses?.mergeSpeedMult || 1;
  const spawnerLvl = state.merge.spawnerLevel || 1;

  let spawned = false;
  let merged = false;

  const spawnInterval = Math.max(0.75, 5.0 / (spawnerLvl * speedMult));
  t.spawnTimer += dt;
  if (t.spawnTimer >= spawnInterval) {
    t.spawnTimer -= spawnInterval;
    if (mergeSpawnCore(state, true)) {
      spawned = true;
    }
  }

  if (state.merge.autoMerge) {
    t.autoMergeTimer += dt;
    if (t.autoMergeTimer >= 0.85) {
      t.autoMergeTimer = 0;
      if (tryAutoMergeOnce(state)) {
        merged = true;
      }
    }
  }

  return { merged, spawned };
}

export function renderMerge(state, containerEl) {
  if (!containerEl || !state.merge) return;
  const m = state.merge;
  if (!Array.isArray(m.grid) || m.grid.length < 16) m.grid = Array(16).fill(null);

  const spawnCost = getMergeSpawnCost(state);
  const spawnerCost = getMergeSpawnerUpgradeCost(state);
  const baseCost = getMergeBaseUpgradeCost(state);
  const aura = getMergeGridAura(state);

  containerEl.innerHTML = `
    <div class="floor-shell">
      <div class="floor-header">
        <div>
          <div class="floor-placeholder-badge mono">B6 // SYNTHESIS FORGE</div>
          <h2 class="floor-title">Actuator Core Matrix</h2>
        </div>
        <div class="floor-stats-row mono">
          <span class="stat-pill">PEAK TIER: <strong data-merge-stat="peak">T${m.peakTier || 0}</strong></span>
          <span class="stat-pill">CATALYSTS: <strong data-merge-stat="catalysts">${fmtNumber(m.catalysts || 0)}</strong></span>
          <span class="stat-pill">GRID AURA: <strong data-merge-stat="aura">+${fmtNumber(aura * 5)}%</strong></span>
        </div>
        <button class="icon-btn mono" type="button" data-return-desk>RETURN TO 1F: DESK</button>
      </div>

      <div class="floor-grid-2col">
        <div class="floor-panel">
          <div class="panel-toolbar">
            <span class="toolbar-title mono">SYNTHESIS GRID (4×4)</span>
            <span class="toolbar-meta mono">Click two matching cores to merge</span>
          </div>
          <div class="merge-grid" data-merge-grid>
            ${m.grid.map((tier, idx) => `
              <button
                class="merge-cell mono${tier ? ` has-core tier-${Math.min(6, tier)}` : ''}${selectedCell === idx ? ' is-selected' : ''}"
                type="button"
                data-merge-cell="${idx}"
              >${tier ? `T${tier}` : '·'}</button>
            `).join('')}
          </div>
        </div>

        <div class="floor-panel">
          <div class="panel-toolbar">
            <span class="toolbar-title mono">FORGE CONTROLS</span>
            <span class="toolbar-meta mono">Spawner Lv.${m.spawnerLevel || 1} • Base T${m.baseTier || 1}</span>
          </div>
          <div class="merge-controls">
            <button class="btn-buy mono${state.money >= spawnCost ? ' can-afford' : ''}" type="button" data-merge-action="spawn" ${state.money < spawnCost ? 'disabled' : ''}>
              SPAWN T${m.baseTier || 1} CORE (${fmtMoney(spawnCost)})
            </button>
            <button class="btn-buy mono${state.money >= spawnerCost ? ' can-afford' : ''}" type="button" data-merge-action="upgrade-spawner" ${state.money < spawnerCost ? 'disabled' : ''}>
              UPGRADE SPAWNER (${fmtMoney(spawnerCost)})
            </button>
            <button class="btn-research mono${state.rp >= baseCost ? ' can-afford' : ''}" type="button" data-merge-action="upgrade-base" ${state.rp < baseCost ? 'disabled' : ''}>
              UPGRADE BASE TIER (${fmtNumber(baseCost)} RP)
            </button>
            <button class="icon-btn mono${m.autoMerge ? ' is-active' : ''}" type="button" data-merge-action="toggle-automerge">
              AUTO-MERGE: ${m.autoMerge ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="muted-text mono" style="margin-top:12px;">
            Merging into a new Peak Tier (T3+) forges a permanent Catalyst (+10% RP &amp; +5% Share potency).
          </div>
        </div>
      </div>
    </div>
  `;
}

export function updateMergeUI(state, containerEl) {
  if (!containerEl || !state.merge || containerEl.classList.contains('is-hidden')) return;
  const m = state.merge;
  const setTxt = (sel, val) => {
    const node = containerEl.querySelector(sel);
    if (node) node.textContent = val;
  };

  setTxt('[data-merge-stat="peak"]', `T${m.peakTier || 0}`);
  setTxt('[data-merge-stat="catalysts"]', fmtNumber(m.catalysts || 0));
  setTxt('[data-merge-stat="aura"]', `+${fmtNumber(getMergeGridAura(state) * 5)}%`);

  const cells = containerEl.querySelectorAll('[data-merge-cell]');
  cells.forEach((cell) => {
    const idx = Number(cell.dataset.mergeCell);
    const tier = m.grid[idx];
    cell.textContent = tier ? `T${tier}` : '·';
    cell.className = `merge-cell mono${tier ? ` has-core tier-${Math.min(6, tier)}` : ''}${selectedCell === idx ? ' is-selected' : ''}`;
  });

  const spawnBtn = containerEl.querySelector('[data-merge-action="spawn"]');
  if (spawnBtn) {
    const cost = getMergeSpawnCost(state);
    const ok = state.money >= cost && m.grid.some((c) => c === null);
    spawnBtn.disabled = !ok;
    spawnBtn.classList.toggle('can-afford', ok);
  }

  const spBtn = containerEl.querySelector('[data-merge-action="upgrade-spawner"]');
  if (spBtn) {
    const cost = getMergeSpawnerUpgradeCost(state);
    const ok = state.money >= cost;
    spBtn.disabled = !ok;
    spBtn.classList.toggle('can-afford', ok);
  }

  const bBtn = containerEl.querySelector('[data-merge-action="upgrade-base"]');
  if (bBtn) {
    const cost = getMergeBaseUpgradeCost(state);
    const ok = state.rp >= cost;
    bBtn.disabled = !ok;
    bBtn.classList.toggle('can-afford', ok);
  }
}

export function bindMergeEvents(containerEl, getState, onAction) {
  if (!containerEl || containerEl.dataset.mergeBound) return;
  containerEl.dataset.mergeBound = '1';

  containerEl.addEventListener('click', (e) => {
    const state = getState();
    const returnBtn = e.target.closest('[data-return-desk]');
    if (returnBtn) {
      selectedCell = null;
      onAction('return-desk');
      return;
    }

    const cellBtn = e.target.closest('[data-merge-cell]');
    if (cellBtn) {
      const idx = Number(cellBtn.dataset.mergeCell);
      const tier = state.merge.grid[idx];
      if (selectedCell === null) {
        if (tier) {
          selectedCell = idx;
          updateMergeUI(state, containerEl);
        }
      } else if (selectedCell === idx) {
        selectedCell = null;
        updateMergeUI(state, containerEl);
      } else if (tier && tier === state.merge.grid[selectedCell]) {
        if (mergeCells(state, selectedCell, idx)) {
          selectedCell = null;
          renderMerge(state, containerEl);
          onAction('merge-updated');
        }
      } else if (tier) {
        selectedCell = idx;
        updateMergeUI(state, containerEl);
      } else {
        selectedCell = null;
        updateMergeUI(state, containerEl);
      }
      return;
    }

    const actBtn = e.target.closest('[data-merge-action]');
    if (!actBtn) return;
    const action = actBtn.dataset.mergeAction;
    let changed = false;
    if (action === 'spawn') changed = mergeSpawnCore(state, false);
    else if (action === 'upgrade-spawner') changed = mergeUpgradeSpawner(state);
    else if (action === 'upgrade-base') changed = mergeUpgradeBaseTier(state);
    else if (action === 'toggle-automerge') changed = mergeToggleAuto(state);

    if (changed) {
      renderMerge(state, containerEl);
      onAction('merge-updated');
    }
  });
}
