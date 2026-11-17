import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const STANDALONE_DIR =
  '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2';
export const STANDALONE_PAGE = '/idle_button.html';

export const V2_SAVE_KEY = 'idle_button_v2_save';
export const V3_SAVE_KEY = 'idle_button_v3_save';

/**
 * Pure JSON seed builder for v0.2 save schema (`idle_button_v2_save`).
 * Never imports internal `js/**` modules (opaque-box contract).
 */
export function createV2Save(overrides = {}) {
  const base = {
    money: 0,
    totalMoneyRun: 0,
    totalMoneyAllTime: 0,
    rp: 0,
    presses: 0,
    phase: 0,
    sinisterRevealed: false,
    soundEnabled: true,
    buyMode: '1',
    activeTab: 'operations',
    shares: 0,
    restructures: 0,
    generators: {
      intern: { owned: 0, progress: 0, running: false },
      bird: { owned: 0, progress: 0, running: false },
      solenoid: { owned: 0, progress: 0, running: false },
      pod: { owned: 0, progress: 0, running: false },
      sublevel: { owned: 0, progress: 0, running: false },
      conduit: { owned: 0, progress: 0, running: false },
    },
    upgrades: [],
    completedResearch: [],
    activeResearch: null,
    abilities: {
      ab_rush: { activeRemaining: 0, cooldownRemaining: 0 },
      ab_surge: { activeRemaining: 0, cooldownRemaining: 0 },
      ab_syphon: { activeRemaining: 0, cooldownRemaining: 0 },
    },
    triggeredBeats: [],
    memos: [],
    lastTick: Date.now(),
  };

  return {
    ...base,
    ...overrides,
    generators: {
      ...base.generators,
      ...(overrides.generators || {}),
    },
    abilities: {
      ...base.abilities,
      ...(overrides.abilities || {}),
    },
  };
}

/**
 * Pure JSON seed builder for v3 save schema (`idle_button_v3_save`).
 * Never imports internal `js/**` modules (opaque-box contract).
 */
export function createV3Save(overrides = {}) {
  const base = {
    version: 3,
    money: 0,
    totalMoneyRun: 0,
    totalMoneyAllTime: 0,
    rp: 0,
    presses: 0,
    phase: 0,
    sinisterRevealed: false,
    soundEnabled: true,
    buyMode: '1',
    activeTab: 'operations',
    activeFloor: 'desk',
    unlockedFloors: ['desk'],
    shares: 0,
    lifetimeShares: 0,
    restructures: 0,
    boardroomPerks: [],
    achievements: [],
    anomaliesCaught: 0,
    generators: {
      intern: { owned: 0, progress: 0, running: false },
      bird: { owned: 0, progress: 0, running: false },
      solenoid: { owned: 0, progress: 0, running: false },
      pod: { owned: 0, progress: 0, running: false },
      sublevel: { owned: 0, progress: 0, running: false },
      conduit: { owned: 0, progress: 0, running: false },
      resonance: { owned: 0, progress: 0, running: false },
      archive: { owned: 0, progress: 0, running: false },
      borehole: { owned: 0, progress: 0, running: false },
      board: { owned: 0, progress: 0, running: false },
    },
    upgrades: [],
    completedResearch: [],
    activeResearch: null,
    abilities: {
      ab_rush: { activeRemaining: 0, cooldownRemaining: 0 },
      ab_surge: { activeRemaining: 0, cooldownRemaining: 0 },
      ab_syphon: { activeRemaining: 0, cooldownRemaining: 0 },
      ab_overclock: { activeRemaining: 0, cooldownRemaining: 0 },
    },
    td: {
      wave: 1,
      highestWave: 0,
      scrap: 0,
      overcharge: 0,
      turrets: [],
      waveProgress: 0,
    },
    rpg: {
      sector: 1,
      stage: 1,
      highestSector: 0,
      credits: 0,
      intel: 0,
      shards: 0,
      squad: [],
      artifacts: [],
      equipped: [],
    },
    merge: {
      grid: Array(16).fill(null),
      spawnerLevel: 1,
      baseTier: 1,
      autoMerge: false,
      catalysts: 0,
      peakTier: 0,
    },
    triggeredBeats: [],
    memos: [],
    lastTick: Date.now(),
  };

  return {
    ...base,
    ...overrides,
    generators: {
      ...base.generators,
      ...(overrides.generators || {}),
    },
    abilities: {
      ...base.abilities,
      ...(overrides.abilities || {}),
    },
    td: {
      ...base.td,
      ...(overrides.td || {}),
    },
    rpg: {
      ...base.rpg,
      ...(overrides.rpg || {}),
    },
    merge: {
      ...base.merge,
      ...(overrides.merge || {}),
    },
  };
}

/**
 * Mid-run v3 save with Phase 3 unlocked, generators running, RP available.
 */
export function createMidRunSave(overrides = {}) {
  return createV3Save({
    money: 5000,
    totalMoneyRun: 12000,
    totalMoneyAllTime: 12000,
    rp: 50,
    presses: 45,
    phase: 3,
    generators: {
      intern: { owned: 10, progress: 0, running: true },
      bird: { owned: 5, progress: 0, running: true },
      solenoid: { owned: 2, progress: 0, running: true },
    },
    upgrades: ['upg_keycap', 'mgr_intern', 'mgr_bird'],
    completedResearch: ['res_ergonomics'],
    ...overrides,
  });
}

/**
 * Post-Restructure v3 save with Shares, Sinister revealed, and optional unlocked floors.
 */
export function createPostRestructureSave(overrides = {}) {
  return createV3Save({
    money: 50000,
    totalMoneyRun: 150000,
    totalMoneyAllTime: 350000,
    rp: 200,
    presses: 100,
    phase: 4,
    sinisterRevealed: true,
    shares: 10,
    lifetimeShares: 10,
    restructures: 1,
    unlockedFloors: ['desk', 'td', 'rpg', 'merge'],
    completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics', 'res_compliance'],
    ...overrides,
  });
}

/**
 * Offline save with `lastTick` shifted back by `elapsedMs` (default 30 minutes).
 */
export function createOfflineSave(elapsedMs = 30 * 60 * 1000, overrides = {}) {
  return createMidRunSave({
    lastTick: Date.now() - elapsedMs,
    ...overrides,
  });
}
