import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 3 — Prestige + Boardroom + Floor Unlocks + Preserved Meta', () => {
  it('Restructure -> earn Shares -> buy Boardroom floor unlocks -> verify Elevator & preserved meta', async () => {
    const seed = createV3Save({
      money: 5e7,
      totalMoneyRun: 5e7,
      totalMoneyAllTime: 5e7,
      phase: 4,
      sinisterRevealed: true,
      soundEnabled: false,
      achievements: ['ach_first_press'],
      unlockedFloors: ['desk'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');

      for (const perkId of ['perk_floor_td', 'perk_floor_rpg', 'perk_floor_merge']) {
        const sel = `[data-perk-id="${perkId}"]`;
        await h.waitForSelector(sel);
        await h.click(sel);
      }

      assert.equal(await h.hasClass('#floor-btn-td', 'is-locked'), false);
      assert.equal(await h.hasClass('#floor-btn-rpg', 'is-locked'), false);
      assert.equal(await h.hasClass('#floor-btn-merge', 'is-locked'), false);

      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.soundEnabled, false);
      assert.ok(save.achievements.includes('ach_first_press'));
      assert.ok(save.restructures >= 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
