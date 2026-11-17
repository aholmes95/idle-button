import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GENERATORS,
  MANAGERS,
  MILESTONES,
  UPGRADES,
  RESEARCH_PROJECTS,
  ABILITIES,
  BOARDROOM_PERKS,
  ACHIEVEMENTS,
  NARRATIVE_BEATS
} from '../js/data.js';
import { createInitialState } from '../js/state.js';
import { getCrossFloorBonuses } from '../js/modifiers.js';
import {
  hasPerk,
  getPendingShares,
  getShareMultiplier,
  getGlobalMultiplier,
  getSpeedMultiplier,
  getRpMultiplier,
  getGenMilestoneMult,
  getGenPayout,
  getClickValue,
  getBuyInfo,
  getResearchDuration,
  calculateOfflineEarnings,
  checkAchievements
} from '../js/economy.js';

describe('M2 Data & Content Completeness', () => {
  it('defines 10 generator tiers (T1-T10) and 10 matching managers', () => {
    assert.equal(GENERATORS.length, 10);
    assert.equal(MANAGERS.length, 10);
    for (const id of ['resonance', 'archive', 'rift', 'board']) {
      assert.ok(GENERATORS.some((g) => g.id === id), `missing generator ${id}`);
    }
    for (const id of ['mgr_resonance', 'mgr_archive', 'mgr_rift', 'mgr_board']) {
      assert.ok(MANAGERS.some((m) => m.id === id), `missing manager ${id}`);
    }
  });

  it('defines 24+ upgrades, 12 R&D projects, 4 abilities, 12 Boardroom perks, 20+ achievements, and expanded narrative', () => {
    assert.ok(UPGRADES.length >= 24, `expected >= 24 upgrades, got ${UPGRADES.length}`);
    assert.equal(RESEARCH_PROJECTS.length, 12);
    assert.equal(ABILITIES.length, 4);
    assert.ok(ABILITIES.some((a) => a.id === 'ab_overclock'));
    assert.equal(BOARDROOM_PERKS.length, 12);
    assert.ok(ACHIEVEMENTS.length >= 20, `expected >= 20 achievements, got ${ACHIEVEMENTS.length}`);
    assert.ok(NARRATIVE_BEATS.length >= 18, `expected >= 18 narrative beats, got ${NARRATIVE_BEATS.length}`);
    assert.deepEqual(MILESTONES, [10, 25, 50, 100, 150, 200, 300, 500]);
  });
});

describe('M2 Multi-Prestige, Boardroom Perks & Modifiers', () => {
  it('scales pendingShares with (runMoney / 25000)^0.42 and preserves lifetimeShares', () => {
    const s = createInitialState();
    s.totalMoneyRun = 24999;
    assert.equal(getPendingShares(s), 0);

    s.totalMoneyRun = 25000;
    assert.equal(getPendingShares(s), 1);

    s.totalMoneyRun = 1_000_000;
    assert.equal(getPendingShares(s), Math.floor(Math.pow(1_000_000 / 25000, 0.42)));

    // Spending shares in Boardroom reduces spendable shares, NOT lifetimeShares
    s.lifetimeShares = 20;
    s.shares = 2;
    const mult = getShareMultiplier(s);
    // 1 + 20 * 0.15 * 1 = 4.0
    assert.ok(Math.abs(mult - 4.0) < 1e-9);
  });

  it('applies perk_insider_trading, perk_synergy_core, and restructure scaling', () => {
    const s = createInitialState({
      shares: 10,
      lifetimeShares: 10,
      restructures: 2,
      boardroomPerks: ['perk_insider_trading', 'perk_synergy_core']
    });
    assert.equal(hasPerk(s, 'perk_insider_trading'), true);
    const bonuses = getCrossFloorBonuses(s);
    // moneyMult includes 1.5^2 = 2.25 from perk_synergy_core
    assert.ok(Math.abs(bonuses.moneyMult - 2.25) < 1e-9);

    // perShare = 0.15 + 0.15 (insider) = 0.30
    // restructureMult = (1 + 0.25 * 2) * (1.5^2) = 1.5 * 2.25 = 3.375
    // shareMult = 1 + 10 * 0.30 * 3.375 = 11.125
    assert.ok(Math.abs(getShareMultiplier(s, bonuses) - 11.125) < 1e-9);
  });

  it('applies perk_fast_track, perk_bulk_discount, and perk_offline_rig', () => {
    const s = createInitialState({
      boardroomPerks: ['perk_fast_track', 'perk_bulk_discount', 'perk_offline_rig']
    });
    const proj = RESEARCH_PROJECTS.find((r) => r.id === 'res_lean_six');
    assert.ok(Math.abs(getResearchDuration(s, proj) - proj.duration * 0.6) < 1e-9);
    assert.ok(Math.abs(getRpMultiplier(s) - 1.5) < 1e-9);

    const intern = GENERATORS.find((g) => g.id === 'intern');
    const buy = getBuyInfo(s, intern);
    assert.equal(buy.cost, 9); // 10 * 0.9

    s.phase = 3;
    s.generators.intern = { owned: 10, progress: 0, running: true };
    s.upgrades.push('mgr_intern');
    const now = 1_700_000_000_000;
    s.lastTick = now - 10 * 3600 * 1000; // 10h (< 12h cap with rig)
    const off = calculateOfflineEarnings(s, now);
    assert.equal(off.capped, false);
    assert.equal(off.efficiency, 0.75);
    assert.equal(off.elapsedSec, 10 * 3600);
  });

  it('maps floor unlock perks to td, rpg, merge', () => {
    const tdPerk = BOARDROOM_PERKS.find((p) => p.id === 'perk_floor_defense');
    const rpgPerk = BOARDROOM_PERKS.find((p) => p.id === 'perk_floor_arena');
    const mergePerk = BOARDROOM_PERKS.find((p) => p.id === 'perk_floor_merge');
    assert.equal(tdPerk.unlockFloor, 'td');
    assert.equal(rpgPerk.unlockFloor, 'rpg');
    assert.equal(mergePerk.unlockFloor, 'merge');
  });
});

describe('M2 Milestones, Upgrades, R&D, Overclock, Achievements & Anomalies', () => {
  it('applies tiered milestones (2x/3x/4x) and res_automated_kpi', () => {
    // 10(2), 25(2), 50(2), 100(2), 150(3), 200(3), 300(4), 500(4) => 2^4 * 3^2 * 4^2 = 16 * 9 * 16 = 2304
    assert.equal(getGenMilestoneMult(500, false), 2304);
    // With automated KPI (+25% per milestone): 2304 * 1.25^8
    assert.ok(Math.abs(getGenMilestoneMult(500, true) - 2304 * Math.pow(1.25, 8)) < 1e-6);
  });

  it('applies cross-division synergies, click scaling, ab_overclock, and anomaly buffs', () => {
    const s = createInitialState();
    s.phase = 3;
    s.generators.intern = { owned: 1, progress: 0, running: true };
    s.generators.conduit = { owned: 4, progress: 0, running: true };
    s.generators.bird = { owned: 20, progress: 0, running: true };
    s.generators.resonance = { owned: 1, progress: 0, running: true };
    s.upgrades.push('mgr_intern', 'upg_intern_conduit', 'upg_bird_resonance', 'upg_kinetic_grid', 'upg_neural_link');

    const intern = GENERATORS.find((g) => g.id === 'intern');
    const resonance = GENERATORS.find((g) => g.id === 'resonance');
    // Intern gets +25% * 4 = 2x
    assert.equal(getGenPayout(s, intern), 2 * 1 * 2);
    // Resonance gets +5% * 20 = 2x
    assert.equal(getGenPayout(s, resonance), 220000 * 1 * 2);

    // Click gets 8% of passive $/sec
    const click = getClickValue(s);
    assert.ok(click > 1);

    // ab_overclock 3x speed
    s.abilities.ab_overclock = { activeRemaining: 10, cooldownRemaining: 65 };
    assert.equal(getSpeedMultiplier(s), 3);

    // Anomaly output buff 7x
    s.anomalyBuffs = { outputMult: 7, outputRemaining: 12, clickMult: 1, clickRemaining: 0 };
    assert.equal(getGlobalMultiplier(s), 7);
  });

  it('unlocks achievements via checkAchievements and compounds 1.05^n in modifiers.js', () => {
    const s = createInitialState();
    s.presses = 1500;
    s.totalMoneyAllTime = 2_000_000;
    s.restructures = 1;
    s.anomaliesCaught = 1;

    const unlocked = checkAchievements(s);
    assert.ok(unlocked.length >= 6);
    assert.equal(s.achievements.length, unlocked.length);

    const bonuses = getCrossFloorBonuses(s);
    assert.ok(Math.abs(bonuses.moneyMult - Math.pow(1.05, s.achievements.length)) < 1e-9);
  });
});
