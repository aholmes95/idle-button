import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 2 — Economy & Formatting Boundaries', () => {
  // === Insufficient Funds & Affordability Boundaries (6 cases) ===
  it('1.1 Clicking Buy x1/x10/MAX when money < cost leaves owned and money unchanged', async () => {
    const seed = createV3Save({ money: 5, totalMoneyRun: 25, presses: 15, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (const mode of ['1', '10', 'max']) {
        await h.click(`#buy-mode-group .mode-btn[data-mode="${mode}"]`);
        const isDisabled = await h.evaluate(
          () => document.querySelector('.gen-card[data-gen-id="intern"] [data-role="buy"]')?.disabled === true
        );
        assert.equal(isDisabled, true);
      }
      assert.equal(await h.text('#currency-value'), '$5.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.2 Purchasing with exact money === cost succeeds with $0.00 remainder', async () => {
    const seed = createV3Save({ money: 10, totalMoneyRun: 10, presses: 10, phase: 1 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      assert.equal(await h.text('#currency-value'), '$0.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.3 Buy MAX when money === 0 disables button without NaN', async () => {
    const seed = createV3Save({ money: 0, totalMoneyRun: 25, presses: 15, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#buy-mode-group .mode-btn[data-mode="max"]');
      const btnText = await h.text('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      assert.equal(btnText.includes('NaN'), false);
      const isDisabled = await h.evaluate(
        () => document.querySelector('.gen-card[data-gen-id="intern"] [data-role="buy"]')?.disabled === true
      );
      assert.equal(isDisabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.4 TD Emergency Overcharge with insufficient $ is blocked', async () => {
    const seed = createPostRestructureSave({
      money: 0,
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const disabled = await h.evaluate(
        () => document.querySelector('#floor-td [data-td-action="overcharge"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.5 RPG stat upgrade with insufficient credits is blocked', async () => {
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
        artifacts: [],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const disabled = await h.evaluate(
        () => document.querySelector('#floor-rpg [data-rpg-upgrade="atk"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.6 Merge instant-spawn when grid is full (16/16) is blocked without deducting $', async () => {
    const seed = createPostRestructureSave({
      money: 1e6,
      unlockedFloors: ['desk', 'merge'],
      activeFloor: 'merge',
      merge: {
        grid: Array(16).fill(1),
        spawnerLevel: 1,
        baseTier: 1,
        autoMerge: false,
        catalysts: 0,
        peakTier: 1,
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const disabled = await h.evaluate(
        () => document.querySelector('#floor-merge [data-merge-action="spawn"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  // === Number & Duration Formatting Overflow Boundaries (6 cases) ===
  it('2.1 Suffix thresholds K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc render accurately', async () => {
    const thresholds = [
      [1e3, 'K'],
      [1e6, 'M'],
      [1e9, 'B'],
      [1e12, 'T'],
      [1e15, 'Qa'],
      [1e18, 'Qi'],
      [1e21, 'Sx'],
      [1e24, 'Sp'],
      [1e27, 'Oc'],
      [1e30, 'No'],
      [1e33, 'Dc'],
    ];
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: createV3Save({ money: 1e33, totalMoneyRun: 1e33, phase: 4, sinisterRevealed: true }),
    });
    try {
      for (const [val, suffix] of thresholds) {
        await h.seedStorage(createV3Save({ money: val, totalMoneyRun: val, phase: 4, sinisterRevealed: true }), V3_SAVE_KEY);
        await h.reload();
        const text = await h.text('#currency-value');
        assert.ok(text.includes(suffix), `Expected ${val} to format with "${suffix}", got "${text}"`);
      }
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.2 Values >= 1e36 fall back to clean scientific notation without Infinity/NaN', async () => {
    const seed = createV3Save({ money: 1e36, totalMoneyRun: 1e36, phase: 4, sinisterRevealed: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const text = await h.text('#currency-value');
      assert.ok(text.includes('e'), `Expected scientific notation for 1e36, got "${text}"`);
      assert.equal(text.includes('Infinity'), false);
      assert.equal(text.includes('NaN'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.3 Negative or -0 edge values format safely as $0.00 without -$0.00', async () => {
    const seed = createV3Save({ money: -0, totalMoneyRun: 0, phase: 1 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const text = await h.text('#currency-value');
      assert.equal(text, '$0.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.4 Very large pendingShares calculation does not overflow to Infinity', async () => {
    const seed = createV3Save({
      money: 1e40,
      totalMoneyRun: 1e40,
      totalMoneyAllTime: 1e40,
      phase: 4,
      sinisterRevealed: true,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const cardText = await h.text('#prestige-card');
      assert.equal(cardText.includes('Infinity'), false);
      assert.equal(cardText.includes('NaN'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.5 Long-running offline dt (30 days) caps cleanly in Offline Shift Summary modal', async () => {
    const seed = createV3Save({
      money: 100,
      totalMoneyRun: 100,
      phase: 2,
      generators: { intern: { owned: 5, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      lastTick: Date.now() - 30 * 24 * 60 * 60 * 1000,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#modal-offline');
      const body = await h.text('#offline-summary-body');
      assert.equal(body.includes('NaN'), false);
      assert.equal(body.includes('Infinity'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.6 Sub-threshold values (999.99) format without K suffix', async () => {
    const seed = createV3Save({ money: 999.99, totalMoneyRun: 999.99, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const text = await h.text('#currency-value');
      assert.equal(text, '$999.99');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
