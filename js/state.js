export const SAVE_KEY = 'idle_button_v3_save';
export const LEGACY_V2_KEY = 'idle_button_v2_save';
export const SAVE_VERSION = 3;

function getDefaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function createInitialState(preserved = {}) {
  const unlockedFloors = Array.isArray(preserved.unlockedFloors) && preserved.unlockedFloors.length > 0
    ? [...new Set(['desk', ...preserved.unlockedFloors])]
    : ['desk'];

  return {
    version: SAVE_VERSION,
    money: 0,
    totalMoneyRun: 0,
    totalMoneyAllTime: preserved.totalMoneyAllTime || 0,
    rp: 0,
    presses: 0,
    phase: 0, // 0: bare button, 1: memo+ops, 2: upgrades, 3: research, 4: prestige/sinister
    sinisterRevealed: preserved.sinisterRevealed || false,
    soundEnabled: preserved.soundEnabled !== undefined ? preserved.soundEnabled : true,
    buyMode: '1', // '1', '10', 'max'
    activeTab: 'operations',
    activeFloor: 'desk',
    unlockedFloors,

    // Prestige & Meta
    shares: preserved.shares || 0,
    lifetimeShares: preserved.lifetimeShares ?? preserved.shares ?? 0,
    restructures: preserved.restructures || 0,
    boardroomPerks: Array.isArray(preserved.boardroomPerks) ? [...preserved.boardroomPerks] : [],
    achievements: Array.isArray(preserved.achievements) ? [...preserved.achievements] : [],
    anomaliesCaught: preserved.anomaliesCaught || 0,

    // Generators: { [id]: { owned, progress, running } }
    generators: {},

    // Purchased upgrade & manager IDs
    upgrades: [],

    // Research
    completedResearch: [],
    activeResearch: null, // { id, elapsed }

    // Active abilities: { [id]: { activeRemaining, cooldownRemaining } }
    abilities: {},

    // Temporary anomaly buffs
    anomalyBuffs: {
      outputMult: 1,
      outputRemaining: 0,
      clickMult: 1,
      clickRemaining: 0
    },

    // Narrative
    triggeredBeats: [],
    memos: [],

    // Floor B2: Security Perimeter (TD)
    td: {
      wave: 1,
      highestWave: preserved.td?.highestWave || 0,
      scrap: 0,
      overcharge: 0,
      unlockedPads: Math.min(8, Math.max(4, preserved.td?.unlockedPads || 4)),
      autoWave: preserved.td?.autoWave !== undefined ? Boolean(preserved.td.autoWave) : true,
      bossMilestonesClaimed: Array.isArray(preserved.td?.bossMilestonesClaimed)
        ? [...preserved.td.bossMilestonesClaimed]
        : [],
      turrets: [],
      waveProgress: 0
    },

    // Floor B4: Field Ops (RPG)
    rpg: {
      sector: 1,
      stage: 1,
      highestSector: preserved.rpg?.highestSector || 1,
      credits: 0,
      intel: 0,
      shards: preserved.rpg?.shards || 0,
      squad: [],
      artifacts: Array.isArray(preserved.rpg?.artifacts) ? [...preserved.rpg.artifacts] : [],
      equipped: Array.isArray(preserved.rpg?.equipped) ? [...preserved.rpg.equipped] : []
    },

    // Floor B6: Synthesis Forge (Merge)
    merge: {
      grid: Array(16).fill(null),
      spawnerLevel: 1,
      baseTier: 1,
      autoMerge: false,
      catalysts: preserved.merge?.catalysts || 0,
      peakTier: preserved.merge?.peakTier || 0
    },

    lastTick: Date.now()
  };
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const NUMERIC_SCALAR_FIELDS = [
  'money',
  'totalMoneyRun',
  'totalMoneyAllTime',
  'rp',
  'presses',
  'shares',
  'lifetimeShares',
  'restructures',
  'anomaliesCaught',
  'phase',
  'lastTick'
];

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function sanitizeNonNegNumber(val, fallback = 0) {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : fallback;
}

function sanitizePlainValue(val, depth = 0) {
  if (depth > 6 || val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizePlainValue(item, depth + 1));
  }
  const clean = {};
  for (const key of Object.keys(val)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    clean[key] = sanitizePlainValue(val[key], depth + 1);
  }
  return clean;
}

function sanitizeRecordMap(src, sanitizeEntry) {
  const out = {};
  if (!isPlainObject(src)) return out;
  for (const key of Object.keys(src)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    const entry = src[key];
    if (!isPlainObject(entry)) continue;
    out[key] = sanitizeEntry(entry);
  }
  return out;
}

export function migrateState(parsed) {
  const base = createInitialState();
  if (!isPlainObject(parsed)) {
    return base;
  }

  const unlockedFloors = Array.isArray(parsed.unlockedFloors) && parsed.unlockedFloors.length > 0
    ? [...new Set(['desk', ...parsed.unlockedFloors.filter((f) => typeof f === 'string')])]
    : ['desk'];

  const activeFloor = unlockedFloors.includes(parsed.activeFloor) ? parsed.activeFloor : 'desk';
  const shares = sanitizeNonNegNumber(parsed.shares, base.shares);

  const parsedTd = isPlainObject(parsed.td) ? parsed.td : {};
  const parsedRpg = isPlainObject(parsed.rpg) ? parsed.rpg : {};
  const parsedMerge = isPlainObject(parsed.merge) ? parsed.merge : {};

  const activeResearch = isPlainObject(parsed.activeResearch) && typeof parsed.activeResearch.id === 'string'
    ? {
        id: parsed.activeResearch.id,
        elapsed: sanitizeNonNegNumber(parsed.activeResearch.elapsed, 0)
      }
    : null;

  return {
    version: SAVE_VERSION,
    money: sanitizeNonNegNumber(parsed.money, base.money),
    totalMoneyRun: sanitizeNonNegNumber(parsed.totalMoneyRun, base.totalMoneyRun),
    totalMoneyAllTime: sanitizeNonNegNumber(parsed.totalMoneyAllTime, base.totalMoneyAllTime),
    rp: sanitizeNonNegNumber(parsed.rp, base.rp),
    presses: sanitizeNonNegNumber(parsed.presses, base.presses),
    phase: sanitizeNonNegNumber(parsed.phase, base.phase),
    sinisterRevealed: typeof parsed.sinisterRevealed === 'boolean' ? parsed.sinisterRevealed : base.sinisterRevealed,
    soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : base.soundEnabled,
    buyMode: ['1', '10', 'max'].includes(parsed.buyMode) ? parsed.buyMode : base.buyMode,
    activeTab: typeof parsed.activeTab === 'string' && parsed.activeTab.length > 0 ? parsed.activeTab : base.activeTab,
    activeFloor,
    unlockedFloors,

    shares,
    lifetimeShares: sanitizeNonNegNumber(parsed.lifetimeShares, shares),
    restructures: sanitizeNonNegNumber(parsed.restructures, base.restructures),
    boardroomPerks: Array.isArray(parsed.boardroomPerks) ? sanitizePlainValue(parsed.boardroomPerks) : [],
    achievements: Array.isArray(parsed.achievements) ? sanitizePlainValue(parsed.achievements) : [],
    anomaliesCaught: sanitizeNonNegNumber(parsed.anomaliesCaught, base.anomaliesCaught),

    generators: sanitizeRecordMap(parsed.generators, (entry) => ({
      owned: sanitizeNonNegNumber(entry.owned, 0),
      progress: sanitizeNonNegNumber(entry.progress, 0),
      running: Boolean(entry.running)
    })),

    upgrades: Array.isArray(parsed.upgrades) ? sanitizePlainValue(parsed.upgrades) : [],
    completedResearch: Array.isArray(parsed.completedResearch) ? sanitizePlainValue(parsed.completedResearch) : [],
    activeResearch,

    abilities: sanitizeRecordMap(parsed.abilities, (entry) => ({
      activeRemaining: sanitizeNonNegNumber(entry.activeRemaining, 0),
      cooldownRemaining: sanitizeNonNegNumber(entry.cooldownRemaining, 0)
    })),

    anomalyBuffs: isPlainObject(parsed.anomalyBuffs)
      ? {
          outputMult: Math.max(1, sanitizeNonNegNumber(parsed.anomalyBuffs.outputMult, 1)),
          outputRemaining: sanitizeNonNegNumber(parsed.anomalyBuffs.outputRemaining, 0),
          clickMult: Math.max(1, sanitizeNonNegNumber(parsed.anomalyBuffs.clickMult, 1)),
          clickRemaining: sanitizeNonNegNumber(parsed.anomalyBuffs.clickRemaining, 0)
        }
      : { outputMult: 1, outputRemaining: 0, clickMult: 1, clickRemaining: 0 },

    triggeredBeats: Array.isArray(parsed.triggeredBeats) ? sanitizePlainValue(parsed.triggeredBeats) : [],
    memos: Array.isArray(parsed.memos) ? sanitizePlainValue(parsed.memos) : [],

    td: {
      wave: Math.max(1, sanitizeNonNegNumber(parsedTd.wave, base.td.wave)),
      highestWave: sanitizeNonNegNumber(parsedTd.highestWave, base.td.highestWave),
      scrap: sanitizeNonNegNumber(parsedTd.scrap, base.td.scrap),
      overcharge: sanitizeNonNegNumber(parsedTd.overcharge, base.td.overcharge),
      unlockedPads: Math.min(8, Math.max(4, Math.floor(sanitizeNonNegNumber(parsedTd.unlockedPads, base.td.unlockedPads)))),
      autoWave: typeof parsedTd.autoWave === 'boolean' ? parsedTd.autoWave : base.td.autoWave,
      bossMilestonesClaimed: Array.isArray(parsedTd.bossMilestonesClaimed)
        ? parsedTd.bossMilestonesClaimed.filter((w) => typeof w === 'number' && Number.isFinite(w) && w > 0)
        : [],
      turrets: Array.isArray(parsedTd.turrets) ? sanitizePlainValue(parsedTd.turrets) : [],
      waveProgress: sanitizeNonNegNumber(parsedTd.waveProgress, base.td.waveProgress)
    },

    rpg: {
      sector: Math.max(1, sanitizeNonNegNumber(parsedRpg.sector, base.rpg.sector)),
      stage: Math.max(1, sanitizeNonNegNumber(parsedRpg.stage, base.rpg.stage)),
      highestSector: Math.max(1, sanitizeNonNegNumber(parsedRpg.highestSector, base.rpg.highestSector)),
      credits: sanitizeNonNegNumber(parsedRpg.credits, base.rpg.credits),
      intel: sanitizeNonNegNumber(parsedRpg.intel, base.rpg.intel),
      shards: sanitizeNonNegNumber(parsedRpg.shards, base.rpg.shards),
      squad: Array.isArray(parsedRpg.squad) ? sanitizePlainValue(parsedRpg.squad) : [],
      artifacts: Array.isArray(parsedRpg.artifacts) ? sanitizePlainValue(parsedRpg.artifacts) : [],
      equipped: Array.isArray(parsedRpg.equipped) ? sanitizePlainValue(parsedRpg.equipped) : []
    },

    merge: {
      grid: Array.isArray(parsedMerge.grid) && parsedMerge.grid.length > 0
        ? sanitizePlainValue(parsedMerge.grid)
        : Array(16).fill(null),
      spawnerLevel: Math.max(1, sanitizeNonNegNumber(parsedMerge.spawnerLevel, base.merge.spawnerLevel)),
      baseTier: Math.max(1, sanitizeNonNegNumber(parsedMerge.baseTier, base.merge.baseTier)),
      autoMerge: typeof parsedMerge.autoMerge === 'boolean' ? parsedMerge.autoMerge : base.merge.autoMerge,
      catalysts: sanitizeNonNegNumber(parsedMerge.catalysts, base.merge.catalysts),
      peakTier: sanitizeNonNegNumber(parsedMerge.peakTier, base.merge.peakTier)
    },

    lastTick: sanitizeNonNegNumber(parsed.lastTick, Date.now())
  };
}

export function loadState(storage = getDefaultStorage()) {
  if (!storage) return createInitialState();
  try {
    const rawV3 = storage.getItem(SAVE_KEY);
    if (rawV3) {
      return migrateState(JSON.parse(rawV3));
    }
    const rawV2 = storage.getItem(LEGACY_V2_KEY);
    if (rawV2) {
      const migrated = migrateState(JSON.parse(rawV2));
      saveState(migrated, storage);
      return migrated;
    }
    return createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state, storage = getDefaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetAllState(storage = getDefaultStorage()) {
  if (storage) {
    try {
      storage.removeItem(SAVE_KEY);
      storage.removeItem(LEGACY_V2_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return createInitialState();
}

function encodeBase64Utf8(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function decodeBase64Utf8(b64) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function exportSave(state) {
  const json = JSON.stringify(state);
  return encodeBase64Utf8(json);
}

export function importSave(str) {
  if (typeof str !== 'string') {
    return { ok: false, error: 'Save data must be a non-empty string.' };
  }
  const trimmed = str.trim();
  if (!trimmed) {
    return { ok: false, error: 'Save string is empty.' };
  }

  let jsonStr = trimmed;
  if (!trimmed.startsWith('{')) {
    try {
      // Basic base64 character validation before decoding
      if (!/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
        return { ok: false, error: 'Invalid save format.' };
      }
      jsonStr = decodeBase64Utf8(trimmed.replace(/\s+/g, ''));
    } catch {
      return { ok: false, error: 'Failed to decode base64 save string.' };
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: 'Save data is not valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Save data must be a JSON object.' };
  }

  if (
    typeof parsed.money !== 'number' || !Number.isFinite(parsed.money) || parsed.money < 0 ||
    typeof parsed.presses !== 'number' || !Number.isFinite(parsed.presses) || parsed.presses < 0
  ) {
    return { ok: false, error: 'Save data is missing or has invalid required ButtonCorp™ fields.' };
  }

  for (const field of NUMERIC_SCALAR_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(parsed, field) && parsed[field] !== undefined) {
      const value = parsed[field];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return { ok: false, error: `Save data contains invalid numeric field: ${field}.` };
      }
    }
  }

  return { ok: true, state: migrateState(parsed) };
}
