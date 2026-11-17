import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save } from '../helpers/fixtures.mjs';

describe('Tier 1 — Upgrades & Owned Drawer', () => {
  it('1. #badge-upgrades shows accurate count of affordable upgrades', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, presses: 20, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#badge-upgrades');
      const count = parseInt(await h.text('#badge-upgrades'), 10);
      assert.ok(count > 0, `Expected affordable upgrade badge count > 0, got ${count}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Purchasing an upgrade moves its card into #upgrades-owned-drawer', async () => {
    const seed = createV3Save({ money: 500, totalMoneyRun: 500, presses: 20, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_keycap"]');
      await h.waitForCondition(() => !document.querySelector('#upgrades-owned-drawer')?.classList.contains('is-hidden'));
      const ownedCount = await h.text('#upgrades-owned-count');
      assert.equal(ownedCount, '1');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Owned drawer toggles open/closed and updates #upgrades-summary', async () => {
    const seed = createV3Save({
      money: 500,
      totalMoneyRun: 500,
      presses: 20,
      phase: 2,
      upgrades: ['upg_keycap'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-upgrades');
      const summary = await h.text('#upgrades-summary');
      assert.ok(summary.startsWith('1 /'), `Expected summary starting with "1 /", got "${summary}"`);
      await h.click('#upgrades-owned-drawer summary');
      const isOpen = await h.evaluate(() => document.querySelector('#upgrades-owned-drawer')?.open === true);
      assert.equal(isOpen, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Division-specific multiplier (upg_intern_manual) doubles Intern payout only', async () => {
    const seed = createV3Save({
      money: 500,
      totalMoneyRun: 500,
      presses: 20,
      phase: 2,
      generators: {
        intern: { owned: 1, progress: 0, running: true },
        bird: { owned: 1, progress: 0, running: true },
      },
      upgrades: ['mgr_intern', 'mgr_bird'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const birdYieldBefore = await h.text('.gen-card[data-gen-id="bird"] [data-role="yield"]');
      const internYieldBefore = await h.text('.gen-card[data-gen-id="intern"] [data-role="yield"]');
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_intern_manual"]');
      await h.click('#tab-btn-operations');
      const internYieldAfter = await h.text('.gen-card[data-gen-id="intern"] [data-role="yield"]');
      const birdYieldAfter = await h.text('.gen-card[data-gen-id="bird"] [data-role="yield"]');
      assert.notEqual(internYieldAfter, internYieldBefore);
      assert.equal(birdYieldAfter, birdYieldBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Cross-division synergy upgrade boosts all active divisions and #rate-money', async () => {
    const seed = createV3Save({
      money: 5000,
      totalMoneyRun: 5000,
      presses: 20,
      phase: 2,
      generators: {
        intern: { owned: 5, progress: 0, running: true },
        bird: { owned: 5, progress: 0, running: true },
      },
      upgrades: ['mgr_intern', 'mgr_bird'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const rateBefore = await h.text('#rate-money');
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_synergy"]');
      await h.waitForCondition((prev) => document.querySelector('#rate-money')?.textContent.trim() !== prev);
      const rateAfter = await h.text('#rate-money');
      assert.notEqual(rateAfter, rateBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
