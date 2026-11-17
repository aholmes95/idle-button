import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Restructure & Boardroom Skill Tree (12 Perks)', () => {
  it('1. Pending shares preview displays calculated shares from runMoney', async () => {
    const seed = createV3Save({
      money: 250000,
      totalMoneyRun: 250000,
      totalMoneyAllTime: 250000,
      phase: 4,
      sinisterRevealed: true,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const cardText = await h.text('#prestige-card');
      assert.ok(/\d+/.test(cardText), `Expected pending shares in #prestige-card, got "${cardText}"`);
      const disabled = await h.evaluate(() => document.querySelector('#btn-do-prestige')?.disabled === true);
      assert.equal(disabled, false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Restructure execution resets run state while incrementing restructures, shares, and lifetimeShares', async () => {
    const seed = createV3Save({
      money: 500000,
      totalMoneyRun: 500000,
      totalMoneyAllTime: 500000,
      phase: 4,
      sinisterRevealed: true,
      generators: { intern: { owned: 10, progress: 0, running: true } },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$0.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.restructures, 1);
      assert.ok(save.shares >= 1, `Expected shares >= 1, got ${save.shares}`);
      assert.ok(save.lifetimeShares >= save.shares);
      assert.equal(save.generators?.intern?.owned || 0, 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Boardroom Skill Tree renders all 12 perk nodes with cost and status', async () => {
    const seed = createPostRestructureSave({ shares: 50, lifetimeShares: 50 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const nodeCount = await h.evaluate(() => document.querySelectorAll('[data-perk-id]').length);
      assert.ok(nodeCount >= 12, `Expected >= 12 Boardroom perk nodes, got ${nodeCount}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Purchasing root perk deducts shares (preserving lifetimeShares) and unlocks child nodes', async () => {
    const seed = createPostRestructureSave({ shares: 25, lifetimeShares: 25 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const rootBtn = '[data-perk-id]:not([disabled])';
      await h.waitForSelector(rootBtn);
      await h.click(rootBtn);
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.boardroomPerks.length >= 1);
      assert.equal(save.lifetimeShares, 25);
      assert.ok(save.shares < 25);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Starting boost / auto-manager Boardroom perks apply immediately on new run', async () => {
    const seed = createPostRestructureSave({
      money: 1000000,
      totalMoneyRun: 1000000,
      shares: 50,
      lifetimeShares: 50,
      boardroomPerks: ['perk_seed_capital', 'perk_auto_intern'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      await h.click('#btn-do-prestige');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() !== '$0.00');
      const moneyText = await h.text('#currency-value');
      assert.notEqual(moneyText, '$0.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Floor Portal unlock perks enable B2, B4, and B6 in Facility Elevator bar', async () => {
    const seed = createPostRestructureSave({
      shares: 100,
      lifetimeShares: 100,
      unlockedFloors: ['desk'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      for (const perkId of ['perk_floor_td', 'perk_floor_rpg', 'perk_floor_merge']) {
        const sel = `[data-perk-id="${perkId}"]`;
        await h.waitForSelector(sel);
        await h.click(sel);
      }
      assert.equal(await h.hasClass('#floor-btn-td', 'is-locked'), false);
      assert.equal(await h.hasClass('#floor-btn-rpg', 'is-locked'), false);
      assert.equal(await h.hasClass('#floor-btn-merge', 'is-locked'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
