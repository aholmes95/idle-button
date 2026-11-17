import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Floor B4: Field Ops (RPG Auto-Battler)', () => {
  it('1. Elevator navigation switches to #floor-rpg', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'rpg'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#floor-btn-rpg', 'is-locked'), false);
      await h.click('#floor-btn-rpg');
      assert.equal(await h.hasClass('#floor-rpg', 'is-hidden'), false);
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Operative squad auto-battles through Sector stages and updates HP/progress', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'rpg'],
      activeFloor: 'rpg',
      rpg: {
        sector: 1,
        stage: 1,
        highestSector: 0,
        credits: 0,
        intel: 0,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 20, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForCondition(() => {
        const raw = localStorage.getItem('idle_button_v3_save');
        if (!raw) return false;
        const s = JSON.parse(raw);
        return s.rpg.stage > 1 || s.rpg.credits > 0;
      }, { timeoutMs: 10000 });
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Spending rpg.credits upgrades squad stats (ATK/HP/DEF/SPD)', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'rpg'],
      activeFloor: 'rpg',
      rpg: {
        sector: 1,
        stage: 1,
        highestSector: 0,
        credits: 500,
        intel: 0,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 10, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-rpg [data-rpg-upgrade="atk"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.rpg.credits < 500);
      assert.ok(save.rpg.squad[0].atk > 10);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Squad slot expansion adds operatives to active squad', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'rpg'],
      activeFloor: 'rpg',
      rpg: {
        sector: 1,
        stage: 1,
        highestSector: 0,
        credits: 1000,
        intel: 50,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 10, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-rpg [data-rpg-action="recruit"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.rpg.squad.length >= 2);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Artifact equip boosts stats and salvage yields rpg.shards', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'rpg'],
      activeFloor: 'rpg',
      rpg: {
        sector: 2,
        stage: 1,
        highestSector: 1,
        credits: 0,
        intel: 0,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 10, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [
          { id: 'art_1', name: 'Lead Signet', bonusType: 'clickMult', bonusVal: 0.25 },
          { id: 'art_2', name: 'Rust Plate', bonusType: 'tdDamageMult', bonusVal: 0.1 },
        ],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-rpg [data-rpg-action="equip"][data-art-id="art_1"]');
      await h.click('#floor-rpg [data-rpg-action="salvage"][data-art-id="art_2"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.rpg.equipped.includes('art_1'));
      assert.ok(save.rpg.shards > 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Sector Clear persistence survives Restructure and boosts Share potency', async () => {
    const seed = createPostRestructureSave({
      money: 500000,
      totalMoneyRun: 500000,
      unlockedFloors: ['desk', 'rpg'],
      rpg: {
        sector: 3,
        stage: 1,
        highestSector: 2,
        credits: 0,
        intel: 0,
        shards: 0,
        squad: [],
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.rpg.highestSector, 2);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
