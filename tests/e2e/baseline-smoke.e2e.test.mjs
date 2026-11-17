import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from './helpers/harness.mjs';
import { REPO_ROOT, STANDALONE_DIR, STANDALONE_PAGE, V2_SAVE_KEY, V3_SAVE_KEY } from './helpers/fixtures.mjs';

describe('Baseline Smoke Suite (v0.2 + Standalone Parity)', () => {
  it('1. Initial boot & clean console on index.html', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' });
    try {
      await h.waitForSelector('#main-button');
      assert.equal(await h.text('#currency-value'), '$0.00');
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), true);
      assert.equal(await h.hasClass('#right-column', 'is-hidden'), true);
      assert.equal(await h.isVisible('#main-button'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. 5-click Phase 1 unlock reveals top-bar, console, and memo feed', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' });
    try {
      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }

      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$5.00');
      assert.equal(await h.text('#currency-value'), '$5.00');
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), false);
      assert.equal(await h.hasClass('#right-column', 'is-hidden'), false);
      assert.equal(await h.hasClass('#memo-box', 'is-hidden'), false);
      assert.equal(await h.hasClass('#workspace', 'has-console'), true);

      const memoCount = await h.evaluate(() => document.querySelectorAll('#memo-feed .memo-entry').length);
      assert.ok(memoCount >= 1, `Expected at least 1 memo entry, got ${memoCount}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Buy Coffee-Fueled Intern and complete manual cycle payout', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' });
    try {
      for (let i = 0; i < 10; i++) {
        await h.click('#main-button');
      }
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$10.00');

      const buySelector = '.gen-card[data-gen-id="intern"] [data-role="buy"]';
      await h.waitForSelector(buySelector);
      await h.click(buySelector);

      assert.equal(await h.text('#currency-value'), '$0.00');
      const ownedText = await h.text('.gen-card[data-gen-id="intern"] .gen-owned');
      assert.ok(ownedText.includes('1'), `Expected owned count 1, got "${ownedText}"`);

      const runSelector = '.gen-card[data-gen-id="intern"] [data-role="run"]';
      await h.click(runSelector);

      await h.waitForCondition(
        () => document.querySelector('#currency-value')?.textContent.trim() === '$2.00',
        { timeoutMs: 5000 }
      );
      assert.equal(await h.text('#currency-value'), '$2.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Audio toggle persists to localStorage across full reload', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' });
    try {
      // Unlock Phase 1 so #top-bar / #btn-sound is visible
      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }
      await h.waitForSelector('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: ON');

      await h.click('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');

      const saved = (await h.readStorage(V3_SAVE_KEY)) || (await h.readStorage(V2_SAVE_KEY));
      assert.ok(saved && typeof saved === 'object', 'Expected save object in localStorage');
      assert.equal(saved.soundEnabled, false);

      await h.reload();
      await h.waitForSelector('#btn-sound');
      assert.equal(await h.text('#btn-sound'), 'AUDIO: OFF');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Reset wipes progress back to Phase 0 (supports modal or confirm dialog)', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, pagePath: '/index.html' });
    try {
      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }
      await h.waitForSelector('#btn-reset');
      h.setDialogResponse(true);
      await h.click('#btn-reset');

      const hasModal = await h.evaluate(() => {
        const m = document.querySelector('#modal-reset');
        return Boolean(m && !m.classList.contains('is-hidden'));
      });
      if (hasModal) {
        await h.click('#btn-reset-confirm');
      } else {
        assert.ok(h.dialogs.length >= 1, 'Expected window.confirm dialog to fire');
      }

      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), true);
      assert.equal(await h.hasClass('#right-column', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Standalone idle_button.html parity smoke', async () => {
    const h = await E2EHarness.create({
      rootDir: STANDALONE_DIR,
      pagePath: STANDALONE_PAGE,
    });
    try {
      await h.waitForSelector('#main-button');
      assert.equal(await h.text('#currency-value'), '$0.00');

      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }

      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$5.00');
      assert.equal(await h.text('#currency-value'), '$5.00');
      assert.equal(await h.hasClass('#right-column', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
