import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { fmtMoney, fmtNumber, fmtDuration, fmtTime } from '../js/format.js';
import {
  SAVE_KEY,
  LEGACY_V2_KEY,
  SAVE_VERSION,
  createInitialState,
  loadState,
  saveState,
  resetAllState,
  exportSave,
  importSave,
  migrateState
} from '../js/state.js';
import { getCrossFloorBonuses } from '../js/modifiers.js';
import { GENERATORS } from '../js/data.js';
import {
  getClickValue,
  getBulkCost,
  getMaxAffordable,
  getGenPayout,
  getGenCycleTime,
  getPassiveMoneyRate,
  getPassiveRpRate,
  getShareMultiplier,
  getPendingShares,
  MAX_OFFLINE_SECONDS,
  calculateOfflineEarnings
} from '../js/economy.js';

function createMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); }
  };
}

describe('format.js', () => {
  it('formats money across small, suffix, negative, and scientific ranges', () => {
    assert.equal(fmtMoney(0), '$0.00');
    assert.equal(fmtMoney(12.5), '$12.50');
    assert.equal(fmtMoney(999.99), '$999.99');
    assert.equal(fmtMoney(1500), '$1.50K');
    assert.equal(fmtMoney(2_500_000), '$2.50M');
    assert.equal(fmtMoney(1e9), '$1.00B');
    assert.equal(fmtMoney(1e12), '$1.00T');
    assert.equal(fmtMoney(1e15), '$1.00Qa');
    assert.equal(fmtMoney(1e33), '$1.00Dc');
    assert.equal(fmtMoney(1e36), '$1.00e+36');
    assert.equal(fmtMoney(-2500), '-$2.50K');
  });

  it('formats numbers and handles non-finite inputs safely', () => {
    assert.equal(fmtNumber(42), '42');
    assert.equal(fmtNumber(3.14159, 2), '3.14');
    assert.equal(fmtNumber(12500, 1), '12.5K');
    assert.equal(fmtNumber(1e18), '1.00Qi');
    assert.equal(fmtNumber(NaN), '0');
    assert.equal(fmtNumber(Infinity), '0');
  });

  it('formats durations cleanly', () => {
    assert.equal(fmtDuration(-5), '0s');
    assert.equal(fmtDuration(45), '45s');
    assert.equal(fmtDuration(90), '1m 30s');
    assert.equal(fmtDuration(3665), '1h 01m');
    assert.equal(fmtDuration(93600), '1d 2h');
    assert.equal(fmtTime(125), '2m 05s');
  });
});

describe('state.js', () => {
  it('creates initial v3 state with all required fields', () => {
    const s = createInitialState();
    assert.equal(s.version, SAVE_VERSION);
    assert.equal(s.activeFloor, 'desk');
    assert.deepEqual(s.unlockedFloors, ['desk']);
    assert.deepEqual(s.boardroomPerks, []);
    assert.deepEqual(s.achievements, []);
    assert.equal(s.anomaliesCaught, 0);
    assert.equal(s.td.wave, 1);
    assert.equal(s.rpg.sector, 1);
    assert.equal(s.merge.grid.length, 16);
  });

  it('preserves meta-progression across restructures', () => {
    const s = createInitialState({
      shares: 12,
      lifetimeShares: 20,
      restructures: 3,
      boardroomPerks: ['perk_a'],
      achievements: ['ach_1'],
      unlockedFloors: ['desk', 'td'],
      rpg: { artifacts: ['art_1'], shards: 5, highestSector: 4 },
      merge: { catalysts: 2, peakTier: 6 }
    });
    assert.equal(s.shares, 12);
    assert.equal(s.lifetimeShares, 20);
    assert.equal(s.restructures, 3);
    assert.deepEqual(s.boardroomPerks, ['perk_a']);
    assert.deepEqual(s.achievements, ['ach_1']);
    assert.deepEqual(s.unlockedFloors, ['desk', 'td']);
    assert.deepEqual(s.rpg.artifacts, ['art_1']);
    assert.equal(s.rpg.shards, 5);
    assert.equal(s.merge.catalysts, 2);
  });

  it('migrates v2 save to v3 automatically and persists to v3 key', () => {
    const v2 = {
      money: 500,
      totalMoneyRun: 1200,
      totalMoneyAllTime: 5000,
      presses: 42,
      shares: 4,
      restructures: 1,
      generators: { intern: { owned: 5, progress: 0.5, running: true } },
      upgrades: ['mgr_intern']
    };
    const storage = createMockStorage({ [LEGACY_V2_KEY]: JSON.stringify(v2) });
    const loaded = loadState(storage);
    assert.equal(loaded.version, 3);
    assert.equal(loaded.money, 500);
    assert.equal(loaded.lifetimeShares, 4);
    assert.equal(loaded.activeFloor, 'desk');
    assert.ok(storage.getItem(SAVE_KEY), 'should persist migrated v3 save');

    saveState(loaded, storage);
    const reset = resetAllState(storage);
    assert.equal(reset.money, 0);
    assert.equal(storage.getItem(SAVE_KEY), null);
    assert.equal(storage.getItem(LEGACY_V2_KEY), null);
  });

  it('round-trips exportSave and importSave and rejects malformed payloads', () => {
    const s = createInitialState();
    s.money = 1234.56;
    s.presses = 99;
    s.shares = 3;

    const encoded = exportSave(s);
    const resB64 = importSave(encoded);
    assert.equal(resB64.ok, true);
    assert.equal(resB64.state.money, 1234.56);
    assert.equal(resB64.state.presses, 99);
    assert.equal(resB64.state.shares, 3);

    const resJson = importSave(JSON.stringify(s));
    assert.equal(resJson.ok, true);
    assert.equal(resJson.state.money, 1234.56);

    assert.equal(importSave('').ok, false);
    assert.equal(importSave('not-valid-base64!!!').ok, false);
    assert.equal(importSave(JSON.stringify({ foo: 'bar' })).ok, false);
  });

  it('rejects negative, NaN, and non-finite numeric fields in importSave', () => {
    assert.equal(importSave(JSON.stringify({ money: -500, presses: 10 })).ok, false);
    assert.equal(importSave(JSON.stringify({ money: 100, presses: -1 })).ok, false);
    assert.equal(importSave(JSON.stringify({ money: 100, presses: 5, rp: -10 })).ok, false);
    assert.equal(importSave(JSON.stringify({ money: 100, presses: 5, shares: -2 })).ok, false);
    assert.equal(importSave(JSON.stringify({ money: 100, presses: 5, lastTick: -100 })).ok, false);
    assert.equal(importSave('{"money": null, "presses": 5}').ok, false);
    assert.equal(importSave('{"money": 100, "presses": 5, "totalMoneyRun": null}').ok, false);
    assert.equal(importSave(JSON.stringify({ money: NaN, presses: 5 })).ok, false);
    assert.equal(importSave(JSON.stringify({ money: Infinity, presses: 5 })).ok, false);
  });

  it('strips __proto__, constructor, prototype, and unknown keys and sanitizes corrupted numbers', () => {
    const maliciousJson = '{"money":100,"presses":5,"unknownKey":"dropMe","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted2":true}},"generators":{"__proto__":{"bad":1},"intern":{"owned":-3,"progress":0.5,"running":true}},"abilities":{"constructor":{"bad":1},"ab_rush":{"activeRemaining":-5,"cooldownRemaining":2}},"td":{"wave":-2,"scrap":-10,"__proto__":{"bad":1},"extraField":99},"rpg":{"sector":-1,"credits":-50,"prototype":{"bad":1}},"merge":{"spawnerLevel":-1,"catalysts":-4,"unknownMerge":true}}';
    const imported = importSave(maliciousJson);
    assert.equal(imported.ok, true);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state, 'constructor'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state, 'unknownKey'), false);
    assert.equal(({}).polluted, undefined);
    assert.equal(({}).polluted2, undefined);

    assert.equal(Object.prototype.hasOwnProperty.call(imported.state.generators, '__proto__'), false);
    assert.equal(imported.state.generators.intern.owned, 0);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state.abilities, 'constructor'), false);
    assert.equal(imported.state.abilities.ab_rush.activeRemaining, 0);
    assert.equal(imported.state.abilities.ab_rush.cooldownRemaining, 2);

    assert.equal(imported.state.td.wave, 1);
    assert.equal(imported.state.td.scrap, 0);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state.td, 'extraField'), false);
    assert.equal(imported.state.rpg.sector, 1);
    assert.equal(imported.state.rpg.credits, 0);
    assert.equal(imported.state.merge.spawnerLevel, 1);
    assert.equal(imported.state.merge.catalysts, 0);
    assert.equal(Object.prototype.hasOwnProperty.call(imported.state.merge, 'unknownMerge'), false);

    const migratedCorrupt = migrateState({
      money: -50,
      presses: NaN,
      rp: Infinity,
      shares: -1,
      lastTick: -999,
      unknownProp: 'ignored'
    });
    assert.equal(migratedCorrupt.money, 0);
    assert.equal(migratedCorrupt.presses, 0);
    assert.equal(migratedCorrupt.rp, 0);
    assert.equal(migratedCorrupt.shares, 0);
    assert.ok(migratedCorrupt.lastTick > 0);
    assert.equal(Object.prototype.hasOwnProperty.call(migratedCorrupt, 'unknownProp'), false);
  });
});

describe('modifiers.js', () => {
  it('returns all 12 cross-floor bonus keys defaulting to 1 in M1', () => {
    const s = createInitialState();
    const b = getCrossFloorBonuses(s);
    const expectedKeys = [
      'moneyMult',
      'rpMult',
      'clickMult',
      'speedMult',
      'tdDamageMult',
      'tdFireRateMult',
      'tdScrapMult',
      'rpgAtkMult',
      'rpgDefMult',
      'rpgHpMult',
      'mergeSpeedMult',
      'sharePotencyMult'
    ];
    for (const k of expectedKeys) {
      assert.equal(b[k], 1, `expected ${k} === 1`);
    }
  });
});

describe('economy.js', () => {
  it('calculates click value with upgrades, research, shares, abilities, and tether', () => {
    const s = createInitialState();
    assert.equal(getClickValue(s), 1);

    s.upgrades.push('upg_keycap', 'upg_espresso');
    s.completedResearch.push('res_ergonomics');
    s.shares = 4; // +60% -> x1.6 (0.15/share in M2)
    // (1 + 1) * 2 * 1.5 * 1.6 = 9.6
    assert.ok(Math.abs(getClickValue(s) - 9.6) < 1e-9);

    s.abilities.ab_rush = { activeRemaining: 5, cooldownRemaining: 10 };
    assert.ok(Math.abs(getClickValue(s) - 19.2) < 1e-9);
  });

  it('calculates bulk costs and max affordable accurately', () => {
    const intern = GENERATORS.find((g) => g.id === 'intern');
    assert.equal(getBulkCost(intern, 0, 1), 10);
    const cost10 = getBulkCost(intern, 0, 10);
    assert.ok(cost10 > 100);
    const unaffordable = getMaxAffordable(intern, 0, 5);
    assert.equal(unaffordable.count, 0);
    assert.equal(unaffordable.cost, 0);

    const max = getMaxAffordable(intern, 0, cost10);
    assert.equal(max.count, 10);
  });

  it('calculates generator payouts, cycle times, passive rates, and shares', () => {
    const s = createInitialState();
    const intern = GENERATORS.find((g) => g.id === 'intern');
    s.phase = 3;
    s.generators.intern = { owned: 10, progress: 0, running: true };
    s.upgrades.push('mgr_intern');

    // Milestone 10 gives 2x payout: 2 * 10 * 2 = 40
    assert.equal(getGenPayout(s, intern), 40);
    assert.equal(getGenCycleTime(s, intern), 2.0);
    assert.equal(getPassiveMoneyRate(s), 20);
    assert.ok(getPassiveRpRate(s) > 0);

    s.totalMoneyRun = 40000;
    assert.equal(getPendingShares(s), 1);
    s.shares = 2;
    assert.ok(Math.abs(getShareMultiplier(s) - 1.3) < 1e-9);
  });

  it('calculates offline earnings with 25% base efficiency and 4h base cap', () => {
    const s = createInitialState();
    s.phase = 3;
    s.generators.intern = { owned: 10, progress: 0, running: true };
    s.upgrades.push('mgr_intern');
    const now = 1_700_000_000_000;
    s.lastTick = now - 120 * 1000; // 2 minutes ago

    const res120 = calculateOfflineEarnings(s, now);
    assert.equal(res120.elapsedSec, 120);
    assert.equal(res120.capped, false);
    assert.equal(res120.moneyEarned, 20 * 120 * 0.25);
    assert.ok(res120.rpEarned > 0);

    s.lastTick = now - 48 * 3600 * 1000; // 48 hours ago
    const resCap = calculateOfflineEarnings(s, now);
    assert.equal(resCap.elapsedSec, MAX_OFFLINE_SECONDS);
    assert.equal(resCap.capped, true);
  });
});
