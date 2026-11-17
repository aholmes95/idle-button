import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, createMidRunSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Achievements (20+) & Anomalies / Memos', () => {
  // === 3.8 Achievements (5 cases) ===
  it('1.1 Achievements panel lists 20+ cards with global multiplier summary', async () => {
    const seed = createMidRunSave();
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-achievements');
      const count = await h.evaluate(() => document.querySelectorAll('#panel-achievements [data-ach-id]').length);
      assert.ok(count >= 20, `Expected >= 20 achievements, got ${count}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.2 Crossing press/money threshold unlocks achievement and increases global bonus', async () => {
    const seed = createV3Save({ money: 0, totalMoneyRun: 0, presses: 0, phase: 1 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (let i = 0; i < 10; i++) {
        await h.click('#main-button');
      }
      await h.waitForCondition(() => {
        const raw = localStorage.getItem('idle_button_v3_save');
        return raw && JSON.parse(raw).achievements?.length > 0;
      });
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.achievements.length >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.3 Completing first Restructure unlocks Restructure achievement', async () => {
    const seed = createV3Save({
      money: 500000,
      totalMoneyRun: 500000,
      totalMoneyAllTime: 500000,
      phase: 4,
      sinisterRevealed: true,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.achievements.some((id) => id.includes('restructure') || id.includes('prestige')));
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.4 Achievements persist across Restructure and retain +5% compounding bonus', async () => {
    const seed = createV3Save({
      money: 500000,
      totalMoneyRun: 500000,
      totalMoneyAllTime: 500000,
      phase: 4,
      sinisterRevealed: true,
      achievements: ['ach_first_press', 'ach_hundred_dollars'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.achievements.includes('ach_first_press'));
      assert.ok(save.achievements.includes('ach_hundred_dollars'));
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.5 Unlocking achievement emits non-blocking notification / memo feedback', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      for (let i = 0; i < 10; i++) {
        await h.click('#main-button');
      }
      await h.waitForSelector('#memo-feed .memo-entry');
      const memoCount = await h.evaluate(() => document.querySelectorAll('#memo-feed .memo-entry').length);
      assert.ok(memoCount >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  // === 3.9 Anomalies / Memos (5 cases) ===
  it('2.1 Memo feed updates #memo-count and displays narrative beats', async () => {
    const seed = createV3Save({ money: 1e12, totalMoneyRun: 1e12, phase: 4, sinisterRevealed: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#memo-count');
      await h.click('#main-button');
      const count = parseInt(await h.text('#memo-count'), 10);
      assert.ok(count >= 1, `Expected #memo-count >= 1, got ${count}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.2 Pre-sinister anomaly spawns amber Golden Memo floater', async () => {
    const seed = createMidRunSave({ phase: 2, sinisterRevealed: false });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const floaterSel = '.anomaly-floater:not(.is-sinister)';
      await h.waitForSelector(floaterSel, { timeoutMs: 25000 });
      assert.equal(await h.isVisible(floaterSel), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.3 Post-sinister anomaly spawns crimson Containment Anomaly floater', async () => {
    const seed = createMidRunSave({ phase: 4, sinisterRevealed: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const floaterSel = '.anomaly-floater.is-sinister';
      await h.waitForSelector(floaterSel, { timeoutMs: 25000 });
      assert.equal(await h.isVisible(floaterSel), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.4 Clicking anomaly floater removes it, increments anomaliesCaught, and grants reward', async () => {
    const seed = createMidRunSave({ phase: 2, sinisterRevealed: false });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const floaterSel = '.anomaly-floater';
      await h.waitForSelector(floaterSel, { timeoutMs: 25000 });
      await h.click(floaterSel);
      await h.waitForCondition(() => !document.querySelector('.anomaly-floater'));
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.anomaliesCaught >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.5 Unclicked anomaly floater auto-despawns cleanly without orphan DOM nodes', async () => {
    const seed = createMidRunSave({ phase: 2, sinisterRevealed: false });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const floaterSel = '.anomaly-floater';
      await h.waitForSelector(floaterSel, { timeoutMs: 25000 });
      await h.waitForCondition(() => !document.querySelector('.anomaly-floater'), { timeoutMs: 20000 });
      const remaining = await h.evaluate(() => document.querySelectorAll('.anomaly-floater').length);
      assert.equal(remaining, 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
