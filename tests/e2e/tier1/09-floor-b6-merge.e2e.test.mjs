import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Floor B6: Synthesis Forge (Merge Grid)', () => {
  it('1. Elevator navigation switches to #floor-merge', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'merge'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#floor-btn-merge', 'is-locked'), false);
      await h.click('#floor-btn-merge');
      assert.equal(await h.hasClass('#floor-merge', 'is-hidden'), false);
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Grid renders 16+ cells and instant-buy spawns an Actuator Core', async () => {
    const seed = createPostRestructureSave({
      money: 1e6,
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const cells = await h.evaluate(() => document.querySelectorAll('#floor-merge [data-merge-cell]').length);
      assert.ok(cells >= 16, `Expected >= 16 merge grid cells, got ${cells}`);
      await h.click('#floor-merge [data-merge-action="spawn"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.merge.grid.some((c) => c !== null));
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Manual merge combines two matching T1 cores into T2 and updates peakTier', async () => {
    const grid = Array(16).fill(null);
    grid[0] = 1;
    grid[1] = 1;
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
      merge: { grid, spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 0, peakTier: 1 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-merge [data-merge-cell="0"]');
      await h.click('#floor-merge [data-merge-cell="1"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.merge.peakTier, 2);
      assert.ok(save.merge.grid.includes(2));
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Spawner & Base Tier upgrades spend $ / RP and increment levels', async () => {
    const seed = createPostRestructureSave({
      money: 1e7,
      rp: 5000,
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-merge [data-merge-action="upgrade-spawner"]');
      await h.click('#floor-merge [data-merge-action="upgrade-base"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.merge.spawnerLevel >= 2);
      assert.ok(save.merge.baseTier >= 2);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Auto-Merge toggle automatically combines matching pairs during tick', async () => {
    const grid = Array(16).fill(null);
    grid[0] = 1;
    grid[1] = 1;
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
      merge: { grid, spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 0, peakTier: 1 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-merge [data-merge-action="toggle-automerge"]');
      await h.waitForCondition(() => {
        const raw = localStorage.getItem('idle_button_v3_save');
        return raw && JSON.parse(raw).merge.grid.includes(2);
      }, { timeoutMs: 6000 });
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Forge Catalysts persist across Restructure', async () => {
    const seed = createPostRestructureSave({
      money: 500000,
      totalMoneyRun: 500000,
      unlockedFloors: ['desk', 'merge'],
      merge: { grid: Array(16).fill(null), spawnerLevel: 2, baseTier: 1, autoMerge: false, catalysts: 3, peakTier: 5 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.merge.catalysts, 3);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
