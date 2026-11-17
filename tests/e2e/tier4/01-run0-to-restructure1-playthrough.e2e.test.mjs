import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 4 — Full Run 0 to Restructure 1 Playthrough', () => {
  it('Progresses from $0.00 -> Phase 1 -> Operations -> Upgrades -> R&D -> Sinister Reveal -> Restructure 1', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      // Phase 0 -> 1
      for (let i = 0; i < 10; i++) {
        await h.click('#main-button');
      }
      await h.waitForSelector('#top-bar');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      await h.click('.gen-card[data-gen-id="intern"] [data-role="run"]');

      // Reach Phase 2 via clicks
      for (let i = 0; i < 25; i++) {
        await h.click('#main-button');
      }
      await h.waitForCondition(() => !document.querySelector('#tab-btn-upgrades')?.classList.contains('is-hidden'));
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_keycap"]');

      // Seed late-run milestone to test R&D -> Sinister -> Restructure 1 in bounded E2E time
      await h.seedStorage(
        createV3Save({
          money: 500000,
          totalMoneyRun: 500000,
          totalMoneyAllTime: 500000,
          rp: 500,
          presses: 35,
          phase: 3,
          completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics'],
        }),
        V3_SAVE_KEY
      );
      await h.reload();

      await h.click('#tab-btn-research');
      await h.click('.btn-research[data-res-id="res_compliance"]');
      await h.waitForCondition(() => document.body.classList.contains('is-sinister'), { timeoutMs: 20000 });

      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');

      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.restructures, 1);
      assert.ok(save.shares >= 1);
      assert.equal(save.sinisterRevealed, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
