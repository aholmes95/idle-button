import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, migrateState } from '../js/state.js';
import { getCrossFloorBonuses } from '../js/modifiers.js';
import { ACHIEVEMENTS, NARRATIVE_BEATS, RESEARCH_PROJECTS, FLOORS } from '../js/data.js';
import {
  TD_TURRET_TYPES,
  TD_ENEMY_ARCHETYPES,
  TD_MAX_PADS,
  tdGetPadCost,
  tdGetOverchargeCost,
  tdGetUpgradeCost,
  tdGetWaveStats,
  tdGetTotalDps,
  tdBuyPad,
  tdPlaceTurret,
  tdUpgradeTurret,
  tdSalvageTurret,
  tdTriggerOvercharge,
  tdToggleAutoWave,
  tdAdvanceWave,
  tickTD
} from '../js/floors/td.js';

describe('M3 State & Modifiers Integration', () => {
  it('initializes and migrates td state with unlockedPads, autoWave, and bossMilestonesClaimed', () => {
    const s = createInitialState();
    assert.equal(s.td.wave, 1);
    assert.equal(s.td.highestWave, 0);
    assert.equal(s.td.unlockedPads, 4);
    assert.equal(s.td.autoWave, true);
    assert.deepEqual(s.td.bossMilestonesClaimed, []);

    const migrated = migrateState({
      money: 100,
      presses: 5,
      td: {
        wave: 7,
        highestWave: 6,
        scrap: 42,
        overcharge: 3,
        unlockedPads: 99,
        autoWave: false,
        bossMilestonesClaimed: [5, -1, 'bad'],
        turrets: [{ id: 0, padIndex: 0, type: 'laser', level: 2 }],
        waveProgress: 0.5
      }
    });
    assert.equal(migrated.td.wave, 7);
    assert.equal(migrated.td.highestWave, 6);
    assert.equal(migrated.td.unlockedPads, TD_MAX_PADS);
    assert.equal(migrated.td.autoWave, false);
    assert.deepEqual(migrated.td.bossMilestonesClaimed, [5]);
  });

  it('computes Containment Integrity and TD multipliers in getCrossFloorBonuses', () => {
    const base = createInitialState();
    const baseBonuses = getCrossFloorBonuses(base);
    assert.equal(baseBonuses.moneyMult, 1);
    assert.equal(baseBonuses.rpMult, 1);
    assert.equal(baseBonuses.tdDamageMult, 1);
    assert.equal(baseBonuses.tdFireRateMult, 1);
    assert.equal(baseBonuses.tdScrapMult, 1);

    const prog = createInitialState({ restructures: 2, boardroomPerks: ['perk_synergy_core'] });
    prog.td.highestWave = 10;
    prog.completedResearch.push('res_compliance', 'res_workflow', 'res_automated_kpi');
    prog.abilities.ab_rush = { activeRemaining: 5, cooldownRemaining: 10 };
    prog.abilities.ab_overclock = { activeRemaining: 5, cooldownRemaining: 10 };

    const b = getCrossFloorBonuses(prog);
    // moneyMult: 1.5^2 * (1 + 0.10*10) = 2.25 * 2 = 4.5
    assert.ok(Math.abs(b.moneyMult - 4.5) < 1e-9);
    // rpMult: 1 + 0.05*10 = 1.5
    assert.ok(Math.abs(b.rpMult - 1.5) < 1e-9);
    // tdDamageMult: 1.25 * 1.5 = 1.875
    assert.ok(Math.abs(b.tdDamageMult - 1.875) < 1e-9);
    // tdFireRateMult: 1.15 * 1.5 = 1.725
    assert.ok(Math.abs(b.tdFireRateMult - 1.725) < 1e-9);
    // tdScrapMult: (1 + 0.1*2) * 1.25 = 1.5
    assert.ok(Math.abs(b.tdScrapMult - 1.5) < 1e-9);
  });
});

describe('M3 Turret Management & Controls', () => {
  it('supports buying pads up to 8 and placing all 4 turret types with 0 scrap', () => {
    const s = createInitialState();
    s.money = 1e6;
    assert.equal(s.td.unlockedPads, 4);

    for (let i = 0; i < 4; i++) {
      assert.equal(tdBuyPad(s), true);
    }
    assert.equal(s.td.unlockedPads, 8);
    assert.equal(tdBuyPad(s), false); // capped at 8

    for (const def of TD_TURRET_TYPES) {
      assert.equal(tdPlaceTurret(s, def.id), true);
    }
    assert.equal(s.td.turrets.length, 4);
    assert.deepEqual(s.td.turrets.map((t) => t.type), ['laser', 'slow', 'cannon', 'tesla']);
  });

  it('upgrades turrets with scrap and rejects when scrap is insufficient', () => {
    const s = createInitialState();
    tdPlaceTurret(s, 'laser');
    const cost = tdGetUpgradeCost(s.td.turrets[0]);
    assert.equal(tdUpgradeTurret(s, 0), false); // 0 scrap

    s.td.scrap = cost;
    assert.equal(tdUpgradeTurret(s, 0), true);
    assert.equal(s.td.turrets[0].level, 2);
    assert.equal(s.td.scrap, 0);

    // Salvage refunds 50% of upgrade scrap spent
    assert.equal(tdSalvageTurret(s, 0), true);
    assert.equal(s.td.turrets.length, 0);
    assert.ok(s.td.scrap > 0);
  });

  it('triggers Overcharge with $ and amplifies DPS by 2.5x', () => {
    const s = createInitialState();
    tdPlaceTurret(s, 'laser');
    const before = tdGetTotalDps(s).effectiveDps;
    assert.equal(tdTriggerOvercharge(s), false); // 0 money

    s.money = tdGetOverchargeCost(s.td.wave);
    assert.equal(tdTriggerOvercharge(s), true);
    assert.equal(s.money, 0);
    assert.equal(s.td.overcharge, 15);

    const during = tdGetTotalDps(s).effectiveDps;
    assert.ok(Math.abs(during / before - 2.5) < 1e-9);
  });

  it('NDA Slow-Field amplifies effective perimeter DPS', () => {
    const s = createInitialState();
    tdPlaceTurret(s, 'laser');
    const laserOnly = tdGetTotalDps(s).effectiveDps;
    tdPlaceTurret(s, 'slow');
    const withSlow = tdGetTotalDps(s);
    assert.ok(withSlow.slowAmp > 0);
    assert.ok(withSlow.effectiveDps > laserOnly + 6);
  });
});

describe('M3 Wave Simulation, Bosses & Offline Catch-up', () => {
  it('defines 5 enemy archetypes with Rogue AI boss every 5th wave', () => {
    assert.equal(TD_ENEMY_ARCHETYPES.length, 5);
    assert.equal(tdGetWaveStats(1).isBoss, false);
    assert.equal(tdGetWaveStats(5).isBoss, true);
    assert.equal(tdGetWaveStats(5).archetype.id, 'rogue_ai');
  });

  it('clears waves deterministically, awards scrap, intel, and first-time boss shares', () => {
    const s = createInitialState();
    s.unlockedFloors.push('td');
    tdPlaceTurret(s, 'laser');
    tdPlaceTurret(s, 'cannon');
    s.td.turrets[0].level = 6;
    s.td.turrets[1].level = 6;

    // Simulate 30 seconds of combat
    const res = tickTD(s, 30, getCrossFloorBonuses(s));
    assert.ok(res.wavesCleared >= 5);
    assert.equal(res.bossCleared, true);
    assert.ok(s.td.highestWave >= 5);
    assert.ok(s.td.scrap > 0);
    assert.ok(s.rpg.intel >= 5);
    assert.ok(s.shares >= 2);
    assert.ok(s.lifetimeShares >= 2);
    assert.ok(s.td.bossMilestonesClaimed.includes(5));

    // Replaying wave 5 after restructure should NOT grant duplicate milestone shares
    const sharesAfterFirst = s.shares;
    const s2 = createInitialState({
      shares: sharesAfterFirst,
      lifetimeShares: s.lifetimeShares,
      unlockedFloors: ['desk', 'td'],
      td: {
        highestWave: s.td.highestWave,
        unlockedPads: s.td.unlockedPads,
        autoWave: true,
        bossMilestonesClaimed: [...s.td.bossMilestonesClaimed]
      }
    });
    s2.td.wave = 5;
    s2.td.waveProgress = 0.95;
    s2.td.turrets = [{ id: 0, padIndex: 0, type: 'laser', level: 6 }];
    const res2 = tickTD(s2, 5, getCrossFloorBonuses(s2));
    assert.equal(res2.bossCleared, true);
    assert.equal(s2.shares, sharesAfterFirst);
    assert.ok(s2.rpg.intel >= 5);
  });

  it('pauses at wave boundary when autoWave is disabled and advances on tdAdvanceWave', () => {
    const s = createInitialState();
    s.unlockedFloors.push('td');
    tdPlaceTurret(s, 'laser');
    s.td.turrets[0].level = 4;
    tdToggleAutoWave(s);
    assert.equal(s.td.autoWave, false);

    const res = tickTD(s, 20, getCrossFloorBonuses(s));
    assert.equal(res.wavesCleared, 1);
    assert.equal(s.td.wave, 1);
    assert.equal(s.td.waveProgress, 1);

    assert.equal(tdAdvanceWave(s), true);
    assert.equal(s.td.wave, 2);
    assert.equal(s.td.waveProgress, 0);
  });

  it('includes TD achievements, narrative beats, and clean floor hint in data.js', () => {
    assert.ok(RESEARCH_PROJECTS.length >= 12);
    assert.ok(ACHIEVEMENTS.some((a) => a.id === 'ach_td_wave_5'));
    assert.ok(ACHIEVEMENTS.some((a) => a.id === 'ach_td_wave_20'));
    assert.ok(NARRATIVE_BEATS.some((b) => b.id === 'td_unlocked'));
    assert.ok(NARRATIVE_BEATS.some((b) => b.id === 'td_boss_5'));
    const tdFloor = FLOORS.find((f) => f.id === 'td');
    assert.ok(tdFloor && !tdFloor.unlockHint.includes('(M3)'));
  });
});
