import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createMidRunSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 3 — Sinister Theme Transition & Anomaly Buff Stacking', () => {
  it('Pre-sinister Golden Memo -> res_compliance Sinister Reveal -> crimson Anomaly + ab_rush stack', async () => {
    const seed = createMidRunSave({
      money: 5000,
      totalMoneyRun: 5000,
      rp: 500,
      phase: 3,
      sinisterRevealed: false,
      completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.evaluate(() => document.body.classList.contains('is-sinister')), false);
      await h.click('#tab-btn-research');
      await h.click('.btn-research[data-res-id="res_compliance"]');
      await h.waitForCondition(() => document.body.classList.contains('is-sinister'), { timeoutMs: 20000 });

      await h.click('.ability-btn[data-ab-id="ab_rush"]');
      assert.equal(await h.hasClass('.ability-btn[data-ab-id="ab_rush"]', 'is-active'), true);

      await h.waitForSelector('.anomaly-floater.is-sinister', { timeoutMs: 25000 });
      await h.click('.anomaly-floater.is-sinister');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.anomaliesCaught >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
