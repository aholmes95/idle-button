import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import {
  REPO_ROOT,
  createMidRunSave,
  V2_SAVE_KEY,
  V3_SAVE_KEY,
} from '../helpers/fixtures.mjs';

describe('Tier 2 — Save, Migration & Import/Export Boundaries', () => {
  it('1. Empty string in Import Save modal shows validation error and leaves state untouched', async () => {
    const seed = createMidRunSave({ money: 1234 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.type('#save-import-text', '');
      await h.click('#btn-save-import');
      const status = await h.text('#save-import-status');
      assert.ok(status.length > 0, 'Expected validation status message for empty import');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 1234);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Corrupt JSON "{bad json" in Import Save modal is rejected gracefully', async () => {
    const seed = createMidRunSave({ money: 1234 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.type('#save-import-text', '{bad json');
      await h.click('#btn-save-import');
      const status = await h.text('#save-import-status');
      assert.ok(status.length > 0);
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 1234);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Wrong schema object {"foo":"bar"} in Import Save modal is rejected without crashing', async () => {
    const seed = createMidRunSave({ money: 1234 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.type('#save-import-text', '{"foo":"bar"}');
      await h.click('#btn-save-import');
      const status = await h.text('#save-import-status');
      assert.ok(status.length > 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Corrupt localStorage JSON at idle_button_v3_save falls back to clean initial state', async () => {
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: '{not-valid-json',
      storageKey: V3_SAVE_KEY,
    });
    try {
      await h.waitForSelector('#main-button');
      assert.equal(await h.text('#currency-value'), '$0.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. v2 -> v3 migration with partial/missing fields populates v3 defaults cleanly', async () => {
    const partialV2 = { money: 300, totalMoneyRun: 300, presses: 15, phase: 2 };
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: partialV2,
      storageKey: V2_SAVE_KEY,
    });
    try {
      await h.waitForSelector('#top-bar');
      const v3 = await h.readStorage(V3_SAVE_KEY);
      assert.equal(v3.version, 3);
      assert.deepEqual(v3.unlockedFloors, ['desk']);
      assert.ok(v3.td && v3.rpg && v3.merge);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. v2 -> v3 migration preserves shares, restructures, totalMoneyAllTime, sinisterRevealed, soundEnabled', async () => {
    const v2 = {
      money: 1000,
      totalMoneyRun: 1000,
      totalMoneyAllTime: 99000,
      presses: 50,
      phase: 4,
      shares: 7,
      restructures: 2,
      sinisterRevealed: true,
      soundEnabled: false,
    };
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: v2,
      storageKey: V2_SAVE_KEY,
    });
    try {
      await h.waitForSelector('#top-bar');
      const v3 = await h.readStorage(V3_SAVE_KEY);
      assert.equal(v3.shares, 7);
      assert.equal(v3.restructures, 2);
      assert.equal(v3.totalMoneyAllTime, 99000);
      assert.equal(v3.sinisterRevealed, true);
      assert.equal(v3.soundEnabled, false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('7. Offline catch-up with future lastTick clamps dt to 0 without negative money', async () => {
    const seed = createMidRunSave({
      money: 500,
      lastTick: Date.now() + 3600 * 1000,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#currency-value');
      assert.equal(await h.hasClass('#modal-offline', 'is-hidden'), true);
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 500);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
