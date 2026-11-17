import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, createPostRestructureSave } from '../helpers/fixtures.mjs';

describe('Tier 2 — Locked Floor, Research & Prestige Boundaries', () => {
  it('1. Clicking locked B2/B4/B6 buttons in Elevator bar keeps activeFloor === desk', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (const floor of ['td', 'rpg', 'merge']) {
        const disabled = await h.evaluate(
          (f) => {
            const btn = document.querySelector(`#floor-btn-${f}`);
            return btn?.classList.contains('is-locked') || btn?.getAttribute('aria-disabled') === 'true';
          },
          floor
        );
        assert.equal(disabled, true);
      }
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Seeding activeFloor: td when td is NOT in unlockedFloors falls back to desk', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk'], activeFloor: 'td' });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#workspace');
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), false);
      assert.equal(await h.hasClass('#floor-td', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. 0-share Restructure disables #btn-do-prestige', async () => {
    const seed = createV3Save({
      money: 100,
      totalMoneyRun: 100,
      phase: 4,
      sinisterRevealed: true,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const disabled = await h.evaluate(() => document.querySelector('#btn-do-prestige')?.disabled === true);
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Starting R&D project when rp < rpCost is blocked', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, rp: 0, presses: 30, phase: 3 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      const disabled = await h.evaluate(
        () => document.querySelector('.btn-research[data-res-id="res_ergonomics"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Purchasing a Boardroom perk whose parent node is unowned is blocked', async () => {
    const seed = createPostRestructureSave({ shares: 100, lifetimeShares: 100, boardroomPerks: [] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-prestige');
      const hasLocked = await h.evaluate(() => {
        const lockedNodes = document.querySelectorAll('[data-perk-id][disabled], [data-perk-id].is-locked');
        return lockedNodes.length > 0;
      });
      assert.equal(hasLocked, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Activating an Active Protocol while on cooldown is blocked', async () => {
    const seed = createV3Save({
      money: 1000,
      totalMoneyRun: 1000,
      phase: 3,
      completedResearch: ['res_ergonomics'],
      abilities: {
        ab_rush: { activeRemaining: 0, cooldownRemaining: 20 },
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const disabled = await h.evaluate(
        () => document.querySelector('.ability-btn[data-ab-id="ab_rush"]')?.disabled === true
      );
      assert.equal(disabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
