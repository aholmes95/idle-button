import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 4 — Multi-Prestige All-Floors Playthrough & Export/Import Persistence', () => {
  it('Unlocks B2/B4/B6 -> interacts across all 3 floors -> Export -> Reset -> Import -> Reload', async () => {
    const seed = createPostRestructureSave({
      money: 1e7,
      totalMoneyRun: 1e7,
      rp: 2000,
      shares: 100,
      lifetimeShares: 100,
      unlockedFloors: ['desk'],
      achievements: ['ach_first_press'],
      rpg: {
        sector: 2,
        stage: 1,
        highestSector: 1,
        credits: 500,
        intel: 20,
        shards: 0,
        squad: [{ name: 'Operative-01', atk: 15, hp: 100, maxHp: 100, def: 5, spd: 1 }],
        artifacts: [{ id: 'art_run', name: 'Lead Signet', bonusType: 'clickMult', bonusVal: 0.25 }],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      // Unlock all 3 floors in Boardroom
      await h.click('#tab-btn-prestige');
      for (const perkId of ['perk_floor_td', 'perk_floor_rpg', 'perk_floor_merge']) {
        await h.click(`[data-perk-id="${perkId}"]`);
      }

      // Play B2 TD
      await h.click('#floor-btn-td');
      await h.click('#floor-td [data-td-action="buy-pad"]');
      await h.click('#floor-td [data-td-turret-type="laser"]');

      // Play B4 RPG
      await h.click('#floor-btn-rpg');
      await h.click('#floor-rpg [data-rpg-upgrade="atk"]');
      await h.click('#floor-rpg [data-rpg-action="equip"][data-art-id="art_run"]');

      // Play B6 Merge
      await h.click('#floor-btn-merge');
      await h.click('#floor-merge [data-merge-action="spawn"]');
      await h.click('#floor-merge [data-merge-action="spawn"]');
      await h.click('#floor-merge [data-merge-action="toggle-automerge"]');

      // Export Save
      await h.click('#floor-btn-desk');
      await h.click('#btn-save-modal');
      await h.waitForSelector('#save-export-text');
      const exported = await h.evaluate(() => document.querySelector('#save-export-text')?.value || '');
      assert.ok(exported.length > 50);
      await h.click('#modal-save [data-close-modal="modal-save"]');

      // Hard Reset
      await h.click('#btn-reset');
      await h.waitForSelector('#btn-reset-confirm');
      await h.click('#btn-reset-confirm');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');

      // Import Save & Reload
      for (let i = 0; i < 5; i++) await h.click('#main-button');
      await h.click('#btn-save-modal');
      await h.type('#save-import-text', exported);
      await h.click('#btn-save-import');
      await h.waitForCondition(() => document.querySelector('#brand-name')?.textContent.includes('CONTAINMENT'));
      await h.reload();

      const restored = await h.readStorage(V3_SAVE_KEY);
      assert.ok(restored.unlockedFloors.includes('td'));
      assert.ok(restored.unlockedFloors.includes('rpg'));
      assert.ok(restored.unlockedFloors.includes('merge'));
      assert.ok(restored.td.turrets.length >= 1);
      assert.ok(restored.rpg.equipped.includes('art_run'));
      assert.equal(restored.merge.autoMerge, true);
      assert.ok(restored.achievements.includes('ach_first_press'));
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
