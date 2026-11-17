import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import {
  REPO_ROOT,
  STANDALONE_DIR,
  STANDALONE_PAGE,
  createPostRestructureSave,
} from '../helpers/fixtures.mjs';

describe('Tier 1 — Standalone idle_button.html Parity', () => {
  it('1. Self-contained bundle loads with zero console or page errors', async () => {
    const h = await E2EHarness.create({ rootDir: STANDALONE_DIR, pagePath: STANDALONE_PAGE });
    try {
      await h.waitForSelector('#main-button');
      assert.equal(await h.text('#currency-value'), '$0.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Full UI parity: top-bar, elevator-bar, right-column tabs, and modals exist', async () => {
    const seed = createPostRestructureSave();
    const h = await E2EHarness.create({
      rootDir: STANDALONE_DIR,
      pagePath: STANDALONE_PAGE,
      initialState: seed,
    });
    try {
      await h.waitForSelector('#top-bar');
      await h.waitForSelector('#elevator-bar');
      await h.waitForSelector('#right-column');
      await h.waitForSelector('#tab-btn-operations');
      await h.waitForSelector('#tab-btn-upgrades');
      await h.waitForSelector('#tab-btn-research');
      await h.waitForSelector('#tab-btn-prestige');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. All 3 floors (B2, B4, B6) render cleanly in standalone bundle', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'td', 'rpg', 'merge'] });
    const h = await E2EHarness.create({
      rootDir: STANDALONE_DIR,
      pagePath: STANDALONE_PAGE,
      initialState: seed,
    });
    try {
      for (const floor of ['td', 'rpg', 'merge']) {
        await h.click(`#floor-btn-${floor}`);
        assert.equal(await h.hasClass(`#floor-${floor}`, 'is-hidden'), false);
      }
      await h.click('#floor-btn-desk');
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Save exported from index.html imports cleanly into idle_button.html', async () => {
    const seed = createPostRestructureSave({ money: 12345 });
    const hDev = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    let exported = '';
    try {
      await hDev.click('#btn-save-modal');
      await hDev.waitForSelector('#save-export-text');
      exported = await hDev.evaluate(() => document.querySelector('#save-export-text')?.value || '');
      assert.ok(exported.length > 20);
    } finally {
      await hDev.close();
    }

    const hStandalone = await E2EHarness.create({ rootDir: STANDALONE_DIR, pagePath: STANDALONE_PAGE });
    try {
      for (let i = 0; i < 5; i++) await hStandalone.click('#main-button');
      await hStandalone.click('#btn-save-modal');
      await hStandalone.type('#save-import-text', exported);
      await hStandalone.click('#btn-save-import');
      await hStandalone.waitForCondition(() => document.querySelector('#brand-name')?.textContent.includes('CONTAINMENT'));
      hStandalone.assertNoErrors();
    } finally {
      await hStandalone.close();
    }
  });

  it('5. Full smoke gameplay in standalone idle_button.html yields zero errors', async () => {
    const h = await E2EHarness.create({ rootDir: STANDALONE_DIR, pagePath: STANDALONE_PAGE });
    try {
      for (let i = 0; i < 10; i++) await h.click('#main-button');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="run"]');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$2.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
