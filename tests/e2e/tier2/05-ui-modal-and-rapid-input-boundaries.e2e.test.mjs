import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createMidRunSave, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 2 — UI, Modal & Rapid Input Boundaries', () => {
  it('1. Opening Reset modal and clicking Cancel preserves localStorage and money', async () => {
    const seed = createMidRunSave({ money: 4321 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-reset');
      await h.waitForSelector('#modal-reset');
      await h.click('#btn-reset-cancel');
      assert.equal(await h.hasClass('#modal-reset', 'is-hidden'), true);
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 4321);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Opening Export/Import modal and clicking Close leaves state unchanged', async () => {
    const seed = createMidRunSave({ money: 4321 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#btn-save-modal');
      await h.waitForSelector('#modal-save');
      await h.click('#modal-save [data-close-modal="modal-save"]');
      assert.equal(await h.hasClass('#modal-save', 'is-hidden'), true);
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.money >= 4321);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Rapid-clicking #main-button 50 times registers all 50 presses accurately', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      for (let i = 0; i < 50; i++) {
        await h.click('#main-button');
      }
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$50.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.presses, 50);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Rapidly switching tabs leaves exactly one .active tab panel', async () => {
    const seed = createPostRestructureSave();
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (const tab of ['operations', 'upgrades', 'research', 'prestige', 'operations']) {
        await h.click(`#tab-btn-${tab}`);
      }
      const activeCount = await h.evaluate(() => document.querySelectorAll('.tab-panel.active').length);
      assert.equal(activeCount, 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Rapidly switching floors leaves exactly one visible floor container', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'td', 'rpg', 'merge'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      for (const floor of ['td', 'rpg', 'merge', 'desk']) {
        await h.click(`#floor-btn-${floor}`);
      }
      const visibleWorkspace = await h.hasClass('#workspace', 'is-hidden');
      const hiddenFloors = await h.evaluate(() => {
        return ['td', 'rpg', 'merge'].every((f) =>
          document.querySelector(`#floor-${f}`)?.classList.contains('is-hidden')
        );
      });
      assert.equal(visibleWorkspace, false);
      assert.equal(hiddenFloors, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Narrow mobile viewport (375x812) renders without horizontal overflow', async () => {
    const seed = createPostRestructureSave();
    const h = await E2EHarness.create({
      rootDir: REPO_ROOT,
      initialState: seed,
      viewport: { width: 375, height: 812 },
    });
    try {
      const noOverflow = await h.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      );
      assert.equal(noOverflow, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
