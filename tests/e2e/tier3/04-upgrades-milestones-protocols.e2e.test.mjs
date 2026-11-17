import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createMidRunSave } from '../helpers/fixtures.mjs';

describe('Tier 3 — Upgrades + Milestones + Active Protocols Multiplicative Stacking', () => {
  it('Combines Milestone 10 + division upgrade + Corporate Synergy + ab_rush + ab_syphon + ab_surge', async () => {
    const seed = createMidRunSave({
      money: 50000,
      totalMoneyRun: 50000,
      phase: 3,
      generators: {
        intern: { owned: 10, progress: 0, running: true },
        bird: { owned: 10, progress: 0, running: true },
      },
      upgrades: ['mgr_intern', 'mgr_bird'],
      completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const baseRate = await h.text('#rate-money');
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_intern_manual"]');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_synergy"]');
      await h.click('#tab-btn-operations');

      await h.click('.ability-btn[data-ab-id="ab_rush"]');
      await h.click('.ability-btn[data-ab-id="ab_syphon"]');
      const boostedRate = await h.text('#rate-money');
      assert.notEqual(boostedRate, baseRate);

      const moneyBeforeSurge = await h.text('#currency-value');
      await h.click('.ability-btn[data-ab-id="ab_surge"]');
      const moneyAfterSurge = await h.text('#currency-value');
      assert.notEqual(moneyAfterSurge, moneyBeforeSurge);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
