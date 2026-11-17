const SAVE_KEY = 'idle_button_save_v1';

export function createInitialState() {
  return {
    money: 0,
    totalMoney: 0,
    presses: 0,
    autoPresses: 0,
    depthMeters: 0,
    phase: 0, // 0: bare button, 1: log, 2: upgrades, 3: telemetry, 4: casing/signal
    casingInspected: false,
    soundEnabled: true,
    upgrades: {}, // { [id]: count }
    triggeredBeats: [], // array of narrative beat IDs already shown
    logs: [], // { time, text, type }
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
      upgrades: parsed.upgrades || {},
      triggeredBeats: parsed.triggeredBeats || [],
      logs: parsed.logs || []
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

export function clearState() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
  return createInitialState();
}
