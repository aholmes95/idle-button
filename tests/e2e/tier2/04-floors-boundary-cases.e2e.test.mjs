import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 2 — Floor B2/B4/B6 Boundary Cases', () => {
  it('1. Clicking the same Merge tile twice deselects it rather than self-merging', async () => {
    const grid = Array(16).fill(null);
    grid[0] = 1;
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
      merge: { grid, spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 0, peakTier: 1 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-merge [data-merge-cell="0"]');
      await h.click('#floor-merge [data-merge-cell="0"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.merge.grid[0], 1);
      assert.equal(save.merge.peakTier, 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Merging two mismatched tiers (T1 + T2) does not merge or corrupt grid', async () => {
    const grid = Array(16).fill(null);
    grid[0] = 1;
    grid[1] = 2;
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
      merge: { grid, spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 0, peakTier: 2 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-merge [data-merge-cell="0"]');
      await h.click('#floor-merge [data-merge-cell="1"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.merge.grid[0], 1);
      assert.equal(save.merge.grid[1], 2);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. TD turret upgrade when td.scrap < cost is blocked', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
      td: {
        wave: 1,
        highestWave: 0,
        scrap: 0,
        overcharge: 0,
        turrets: [{ id: 0, type: 'laser', level: 1 }],
        waveProgress: 0,
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const disabled = await h.evaluate(
        () => document.querySelector('#floor-td [data-td-action="upgrade-turret"][data-turret-idx="0"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. RPG squad HP reaching 0 recovers gracefully without NaN or negative stage', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'rpg'],
      activeFloor: 'rpg',
      rpg: {
        sector: 10,
        stage: 1,
        highestSector: 9,
        credits: 0,
        intel: 0,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 1, hp: 1, maxHp: 10, def: 0, spd: 1 }],
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForCondition(() => {
        const raw = localStorage.getItem('idle_button_v3_save');
        return raw && JSON.parse(raw).rpg.stage >= 1;
      });
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(Number.isFinite(save.rpg.stage) && save.rpg.stage >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Floor return-to-desk button restores 1F: DESK workspace cleanly', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'td'], activeFloor: 'td' });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-td [data-return-desk]');
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), false);
      assert.equal(await h.hasClass('#floor-td', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Salvaging an equipped RPG artifact is blocked or unequips safely without orphan ID', async () => {
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
        squad: [{ name: 'Operative-01', atk: 10, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [{ id: 'art_eq', name: 'Lead Signet', bonusType: 'clickMult', bonusVal: 0.25 }],
        equipped: ['art_eq'],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const salvageBtnDisabled = await h.evaluate(
        () => document.querySelector('#floor-rpg [data-rpg-action="salvage"][data-art-id="art_eq"]')?.disabled === true
      );
      if (!salvageBtnDisabled) {
        await h.click('#floor-rpg [data-rpg-action="salvage"][data-art-id="art_eq"]');
        const save = await h.readStorage(V3_SAVE_KEY);
        assert.equal(save.rpg.equipped.includes('art_eq'), false);
      }
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
