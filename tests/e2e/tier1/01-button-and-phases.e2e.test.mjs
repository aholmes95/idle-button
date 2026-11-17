import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Button Clicking & Phase Unlocks', () => {
  // === 3.1 Button Clicking (5 cases) ===
  it('1.1 Initial click payout increments currency from $0.00 to $1.00', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      assert.equal(await h.text('#currency-value'), '$0.00');
      await h.click('#main-button');
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$1.00');
      assert.equal(await h.text('#currency-value'), '$1.00');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.presses, 1);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.2 Clicking #main-button spawns transient floating feedback in #floating-layer', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      await h.click('#main-button');
      const floaterText = await h.waitForCondition(() => {
        const el = document.querySelector('#floating-layer .float-delta');
        return el ? el.textContent.trim() : null;
      });
      assert.ok(floaterText.includes('+$1.00'), `Expected +$1.00 floater, got "${floaterText}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.3 Click power upgrades (upg_keycap + upg_espresso) scale #button-sub and click payout', async () => {
    const seed = createV3Save({
      money: 500,
      totalMoneyRun: 500,
      totalMoneyAllTime: 500,
      presses: 10,
      phase: 2,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_keycap"]');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_espresso"]');

      await h.waitForCondition(() => {
        const sub = document.querySelector('#button-sub')?.textContent.trim();
        return sub && sub.includes('$4.00');
      });

      const beforeText = await h.text('#currency-value');
      await h.click('#main-button');
      const afterText = await h.text('#currency-value');
      assert.notEqual(beforeText, afterText);
      const subText = await h.text('#button-sub');
      assert.ok(subText.includes('$4.00'), `Expected +$4.00 in #button-sub, got "${subText}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.4 Click-%-of-$/sec scaling (upg_tether) adds passive $/sec percentage to click power', async () => {
    const seed = createV3Save({
      money: 50000,
      totalMoneyRun: 50000,
      totalMoneyAllTime: 50000,
      presses: 25,
      phase: 3,
      generators: {
        intern: { owned: 10, progress: 0, running: true },
        bird: { owned: 10, progress: 0, running: true },
      },
      upgrades: ['mgr_intern', 'mgr_bird'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const subBefore = await h.text('#button-sub');
      await h.click('#tab-btn-upgrades');
      await h.click('#upgrades-list .btn-buy[data-upg-id="upg_tether"]');

      await h.waitForCondition(
        (prev) => document.querySelector('#button-sub')?.textContent.trim() !== prev,
      );
      const subAfter = await h.text('#button-sub');
      assert.notEqual(subAfter, subBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.5 Keyboard accessibility: Space and Enter on #main-button trigger clicks', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      await h.pressKey('Space', 'Space', { selector: '#main-button' });
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$1.00');
      await h.pressKey('Enter', 'Enter', { selector: '#main-button' });
      await h.waitForCondition(() => document.querySelector('#currency-value')?.textContent.trim() === '$2.00');
      assert.equal(await h.text('#currency-value'), '$2.00');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  // === 3.2 Phase Unlocks (5 cases) ===
  it('2.1 Phase 0 -> 1 unlocks at 5 presses', async () => {
    const h = await E2EHarness.create({ rootDir: REPO_ROOT });
    try {
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), true);
      for (let i = 0; i < 5; i++) {
        await h.click('#main-button');
      }
      await h.waitForSelector('#top-bar');
      assert.equal(await h.hasClass('#top-bar', 'is-hidden'), false);
      assert.equal(await h.hasClass('#right-column', 'is-hidden'), false);
      assert.equal(await h.hasClass('#memo-box', 'is-hidden'), false);
      assert.equal(await h.hasClass('#currency-label', 'is-hidden'), false);
      assert.equal(await h.hasClass('#button-sub', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.2 Phase 1 -> 2 unlocks #tab-btn-upgrades and #currency-rates at totalMoneyRun >= 25', async () => {
    const seed = createV3Save({ money: 24, totalMoneyRun: 24, totalMoneyAllTime: 24, presses: 24, phase: 1 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#tab-btn-upgrades', 'is-hidden'), true);
      await h.click('#main-button');
      await h.waitForSelector('#tab-btn-upgrades');
      assert.equal(await h.hasClass('#tab-btn-upgrades', 'is-hidden'), false);
      assert.equal(await h.hasClass('#currency-rates', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.3 Phase 2 -> 3 unlocks #tab-btn-research, #pill-rp, and #rate-rp at totalMoneyRun >= 200', async () => {
    const seed = createV3Save({ money: 199, totalMoneyRun: 199, totalMoneyAllTime: 199, presses: 50, phase: 2 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#tab-btn-research', 'is-hidden'), true);
      await h.click('#main-button');
      await h.waitForSelector('#tab-btn-research');
      assert.equal(await h.hasClass('#tab-btn-research', 'is-hidden'), false);
      assert.equal(await h.hasClass('#pill-rp', 'is-hidden'), false);
      assert.equal(await h.hasClass('#rate-rp', 'is-hidden'), false);
      assert.equal(await h.hasClass('#rate-rp-sep', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.4 Phase 3 -> 4 (Sinister Reveal) unlocks #tab-btn-prestige, #pill-shares, and body.is-sinister', async () => {
    const seed = createV3Save({
      money: 5000,
      totalMoneyRun: 5000,
      totalMoneyAllTime: 5000,
      rp: 500,
      presses: 60,
      phase: 3,
      completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      await h.click('#research-list .btn-research[data-res-id="res_compliance"]');
      await h.waitForCondition(() => document.body.classList.contains('is-sinister'), { timeoutMs: 20000 });
      assert.equal(await h.hasClass('#tab-btn-prestige', 'is-hidden'), false);
      assert.equal(await h.hasClass('#pill-shares', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.5 Phase monotonicity: spending money down to $0.00 never re-hides unlocked tabs', async () => {
    const seed = createV3Save({
      money: 10,
      totalMoneyRun: 250,
      totalMoneyAllTime: 250,
      presses: 30,
      phase: 3,
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('.gen-card[data-gen-id="intern"] [data-role="buy"]');
      assert.equal(await h.text('#currency-value'), '$0.00');
      assert.equal(await h.hasClass('#tab-btn-upgrades', 'is-hidden'), false);
      assert.equal(await h.hasClass('#tab-btn-research', 'is-hidden'), false);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
