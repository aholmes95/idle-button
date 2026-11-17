const SAVE_KEY = 'idle_button_v2_save';

export function createInitialState(preserved = {}) {
  return {
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

    // Prestige
    shares: preserved.shares || 0,
    restructures: preserved.restructures || 0,

    // Generators: { [id]: { owned, progress, running } }
    generators: {},

    // Purchased upgrade & manager IDs
    upgrades: [],

    // Research
    completedResearch: [],
    activeResearch: null, // { id, elapsed }

    // Active abilities: { [id]: { activeRemaining, cooldownRemaining } }
    abilities: {},

    // Narrative
    triggeredBeats: [],
    memos: [],
    lastTick: Date.now()
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      generators: parsed.generators || {},
      upgrades: parsed.upgrades || [],
      completedResearch: parsed.completedResearch || [],
      abilities: parsed.abilities || {},
      triggeredBeats: parsed.triggeredBeats || [],
      memos: parsed.memos || []
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetAllState() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
  return createInitialState();
}
