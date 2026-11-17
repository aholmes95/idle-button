import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import {
  REPO_ROOT,
  createV2Save,
  createMidRunSave,
  createOfflineSave,
  V2_SAVE_KEY,
  V3_SAVE_KEY,
} from '../helpers/fixtures.mjs';

describe('Tier 1 — Save/Export/Import/Reset/Offline & Audio Toggle', () => {
  // === 3.13 Persistence & Modals (6 cases) ===
  it('1.1 Auto-save writes version: 3 payload to idle_button_v3_save', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save && save.version === 3, `Expected v3 save, got ${JSON.stringify(save)}`);
      assert.equal(save.presses, 5);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.2 Export Save modal displays non-empty save string', async () => {
    const seed = createMidRunSave();
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.waitForSelector('#modal-save');
      const exportVal = await h.evaluate(() => document.querySelector('#save-export-text')?.value || '');
      assert.ok(exportVal.length > 20, `Expected non-empty export string, got length ${exportVal.length}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.3 Import Save modal restores exported state cleanly', async () => {
    const seed = createMidRunSave({ money: 7777, totalMoneyRun: 17777 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.waitForSelector('#save-export-text');
      const exported = await h.evaluate(() => document.querySelector('#save-export-text')?.value || '');
      await h.click('#modal-save [data-close-modal="modal-save"]');

      // Reset via modal
      await h.click('#btn-reset');
      await h.waitForSelector('#btn-reset-confirm');
      await h.click('#btn-reset-confirm');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');

      // Re-open Save modal and import
      for (let i = 0; i < 5; i++) await h.click('#main-button');
      await h.click('#btn-save-modal');
      await h.type('#save-import-text', exported);
      await h.click('#btn-save-import');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() !== '$5.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 7777);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.4 In-app Reset modal wipes save back to Phase 0 without window.confirm', async () => {
    const seed = createMidRunSave();
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-reset');
      await h.waitForSelector('#modal-reset');
      await h.click('#btn-reset-confirm');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      assert.equal(h.dialogs.length, 0);
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.5 Offline Shift Summary modal displays elapsed time and offline earnings', async () => {
    const seed = createOfflineSave(30 * 60 * 1000);
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#modal-offline');
      const bodyText = await h.text('#offline-summary-body');
      assert.ok(bodyText.length > 0, 'Expected non-empty offline summary body');
      await h.click('#btn-offline-close');
      assert.equal(await h.hasClass('#modal-offline', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.6 Automatic v2 -> v3 migration preserves money, shares, and soundEnabled', async () => {
    const v2 = createV2Save({
      money: 4200,
      totalMoneyRun: 4200,
      totalMoneyAllTime: 4200,
      presses: 40,
      phase: 3,
      shares: 3,
      restructures: 1,
      soundEnabled: false,
    });
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: v2,
      storageKey: V2_SAVE_KEY,
    });
    try {
      await h.waitForSelector('#top-bar');
      const v3 = await h.readStorage(V3_SAVE_KEY);
      assert.ok(v3 && v3.version === 3);
      assert.equal(v3.shares, 3);
      assert.equal(v3.restructures, 1);
      assert.equal(v3.soundEnabled, false);
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  // === 3.14 Audio Toggle (5 cases) ===
  it('2.1 Audio button initializes to AUDIO: ON', async () => {
    const seed = createMidRunSave({ soundEnabled: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.text('#btn-sound'), 'AUDIO: ON');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.2 Clicking #btn-sound toggles AUDIO: ON <-> AUDIO: OFF', async () => {
    const seed = createMidRunSave({ soundEnabled: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      await h.click('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: ON');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.3 Toggled audio state persists across full reload', async () => {
    const seed = createMidRunSave({ soundEnabled: true });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      await h.reload();
      await h.waitForSelector('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.4 Audio preference (OFF) is preserved across Restructure', async () => {
    const seed = createMidRunSave({
      money: 500000,
      totalMoneyRun: 500000,
      phase: 4,
      sinisterRevealed: true,
      soundEnabled: false,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.soundEnabled, false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.5 Clicking and buying with Audio ON and OFF produces zero WebAudio page errors', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      for (let i = 0; i < 10; i++) await h.click('#main-button');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      await h.click('#btn-sound');
      for (let i = 0; i < 5; i++) await h.click('#main-button');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
