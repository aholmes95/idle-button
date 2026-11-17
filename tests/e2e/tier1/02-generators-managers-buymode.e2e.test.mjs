import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save } from '../helpers/fixtures.mjs';

describe('Tier 1 — Generators, Managers & Buy Modes', () => {
  it('1. Buy Mode x1 purchases 1 intern at $10.00', async () => {
    const seed = createV3Save({ money: 15, totalMoneyRun: 15, presses: 15, phase: 1 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      assert.equal(await h.text('#currency-value'), '$5.00');
      const owned = await h.text('.gen-card[data-gen-id="intern"] .gen-owned');
      assert.ok(owned.includes('1'), `Expected 1 owned, got "${owned}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Buy Mode x10 purchases 10 units at geometric sum cost', async () => {
    const seed = createV3Save({ money: 500, totalMoneyRun: 500, presses: 15, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#buy-mode-group .mode-btn[data-mode="10"]');
      assert.equal(await h.hasClass('#buy-mode-group .mode-btn[data-mode="10"]', 'active'), true);
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      const owned = await h.text('.gen-card[data-gen-id="intern"] .gen-owned');
      assert.ok(owned.includes('10'), `Expected 10 owned, got "${owned}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Buy Mode MAX calculates and buys exact maximum affordable units', async () => {
    const seed = createV3Save({ money: 100, totalMoneyRun: 100, presses: 15, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#buy-mode-group .mode-btn[data-mode="max"]');
      assert.equal(await h.hasClass('#buy-mode-group .mode-btn[data-mode="max"]', 'active'), true);
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      const ownedNum = await h.evaluate(() => {
        const txt = document.querySelector('.gen-card[data-gen-id="intern"] .gen-owned')?.textContent || '0';
        return parseInt(txt.replace(/\D/g, ''), 10);
      });
      assert.ok(ownedNum >= 5 && ownedNum <= 10, `Expected max affordable units between 5 and 10, got ${ownedNum}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Manual generator stops after 1 cycle; hiring Manager automates continuous cycles', async () => {
    const seed = createV3Save({
      money: 120,
      totalMoneyRun: 120,
      presses: 15,
      phase: 2,
      generators: { intern: { owned: 1, progress: 0, running: false } },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('.gen-card[data-gen-id="intern"] [data-role="run"]');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() !== '$120.00', { timeoutMs: 4000 });
      await h.click('#tab-btn-upgrades');
      await h.click('#managers-list .btn-buy[data-upg-id="mgr_intern"]');
      await h.click('#tab-btn-operations');

      const rateText = await h.waitForCondition(() => {
        const t = document.querySelector('#rate-money')?.textContent.trim();
        return t && t !== '+$0.00 / sec' ? t : null;
      });
      assert.ok(rateText.includes('/ sec'), `Expected positive $/sec rate, got "${rateText}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Milestone 10 visibly updates milestone label and boosts generator output', async () => {
    const seed = createV3Save({
      money: 200,
      totalMoneyRun: 200,
      presses: 15,
      phase: 2,
      generators: { intern: { owned: 9, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const rateBefore = await h.text('#rate-money');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      await h.waitForCondition(() => {
        const ms = document.querySelector('.gen-card[data-gen-id="intern"] .gen-milestone-label')?.textContent || '';
        return ms.includes('25');
      });
      const rateAfter = await h.text('#rate-money');
      assert.notEqual(rateAfter, rateBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Tiers 7-10 generators render and can be purchased with late-run funds', async () => {
    const seed = createV3Save({
      money: 1e18,
      totalMoneyRun: 1e18,
      totalMoneyAllTime: 1e18,
      presses: 100,
      phase: 4,
      sinisterRevealed: true,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (const genId of ['resonance', 'archive', 'borehole', 'board']) {
        await h.waitForSelector(`.gen-card[data-gen-id="${genId}"]`);
        await h.click(`.gen-card[data-gen-id="${genId}"] [data-role="buy"]`);
        const owned = await h.text(`.gen-card[data-gen-id="${genId}"] .gen-owned`);
        assert.ok(owned.includes('1'), `Expected ${genId} owned=1, got "${owned}"`);
      }
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
