import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createV3Save, createMidRunSave } from '../helpers/fixtures.mjs';

describe('Tier 1 — R&D Lab (2 Branches) & Active Protocols (4 Protocols)', () => {
  // === 3.5 R&D Lab (5 cases) ===
  it('1.1 #panel-research displays both Corporate Efficiency and Containment/Anomaly branches (12 projects)', async () => {
    const seed = createMidRunSave({ rp: 100 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      const totalItems = await h.evaluate(() => {
        return (
          document.querySelectorAll('#research-list .research-item').length +
          document.querySelectorAll('#research-completed-list .research-item').length
        );
      });
      assert.ok(totalItems >= 12, `Expected >= 12 total R&D projects, got ${totalItems}`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.2 Prerequisite gating prevents starting downstream projects before parent completes', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, rp: 500, presses: 30, phase: 3 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      const isComplianceDisabled = await h.evaluate(() => {
        const btn = document.querySelector('.btn-research[data-res-id="res_compliance"]');
        return !btn || btn.disabled === true;
      });
      assert.equal(isComplianceDisabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.3 Starting res_ergonomics deducts RP, populates #active-research-box, and completes', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, rp: 50, presses: 30, phase: 3 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      await h.click('.btn-research[data-res-id="res_ergonomics"]');
      await h.waitForSelector('#active-res-bar');
      await h.waitForCondition(() => !document.querySelector('#research-completed-drawer')?.classList.contains('is-hidden'), { timeoutMs: 15000 });
      assert.equal(await h.text('#research-completed-count'), '1');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.4 Completed research moves to collapsible #research-completed-drawer', async () => {
    const seed = createMidRunSave({ rp: 100 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      assert.equal(await h.hasClass('#research-completed-drawer', 'is-hidden'), false);
      await h.click('#research-completed-drawer summary');
      const open = await h.evaluate(() => document.querySelector('#research-completed-drawer')?.open === true);
      assert.equal(open, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('1.5 Concurrent research guard disables starting a second project while one is active', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, rp: 500, presses: 30, phase: 3 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#tab-btn-research');
      await h.click('.btn-research[data-res-id="res_ergonomics"]');
      await h.waitForSelector('#active-res-bar');
      const otherDisabled = await h.evaluate(() => {
        const btns = [...document.querySelectorAll('#research-list .btn-research')];
        return btns.every((b) => b.disabled === true);
      });
      assert.equal(otherDisabled, true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  // === 3.6 Active Protocols (5 cases) ===
  it('2.1 #abilities-bar stays hidden until res_ergonomics completes, then reveals ab_rush', async () => {
    const seed = createV3Save({ money: 1000, totalMoneyRun: 1000, rp: 50, presses: 30, phase: 3 });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#abilities-bar', 'is-hidden'), true);
      await h.click('#tab-btn-research');
      await h.click('.btn-research[data-res-id="res_ergonomics"]');
      await h.waitForCondition(() => !document.querySelector('#abilities-bar')?.classList.contains('is-hidden'), { timeoutMs: 15000 });
      await h.waitForSelector('.ability-btn[data-ab-id="ab_rush"]');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.2 Synergy Rush (ab_rush) activates 2x output and shows active countdown', async () => {
    const seed = createMidRunSave({ completedResearch: ['res_ergonomics'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const rateBefore = await h.text('#rate-money');
      await h.click('.ability-btn[data-ab-id="ab_rush"]');
      assert.equal(await h.hasClass('.ability-btn[data-ab-id="ab_rush"]', 'is-active'), true);
      const status = await h.text('.ability-btn[data-ab-id="ab_rush"] [data-role="status"]');
      assert.ok(status.startsWith('ACTIVE'), `Expected ACTIVE status, got "${status}"`);
      assert.notEqual(await h.text('#rate-money'), rateBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.3 Power Surge (ab_surge) grants instant 15s of passive $/sec and enters cooldown', async () => {
    const seed = createMidRunSave({ completedResearch: ['res_ergonomics', 'res_workflow'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const moneyBefore = await h.text('#currency-value');
      await h.click('.ability-btn[data-ab-id="ab_surge"]');
      const moneyAfter = await h.text('#currency-value');
      assert.notEqual(moneyAfter, moneyBefore);
      const status = await h.text('.ability-btn[data-ab-id="ab_surge"] [data-role="status"]');
      assert.ok(status.startsWith('CD'), `Expected cooldown status, got "${status}"`);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.4 Deep Syphon (ab_syphon) boosts click power 3x and RP gain 2x', async () => {
    const seed = createMidRunSave({ completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const subBefore = await h.text('#button-sub');
      await h.click('.ability-btn[data-ab-id="ab_syphon"]');
      assert.equal(await h.hasClass('.ability-btn[data-ab-id="ab_syphon"]', 'is-active'), true);
      assert.notEqual(await h.text('#button-sub'), subBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2.5 4th Protocol (ab_overclock) activates independently without colliding with other protocol timers', async () => {
    const seed = createMidRunSave({
      completedResearch: ['res_ergonomics', 'res_workflow', 'res_acoustics', 'res_compliance', 'res_overclock'],
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('.ability-btn[data-ab-id="ab_overclock"]');
      await h.click('.ability-btn[data-ab-id="ab_rush"]');
      await h.click('.ability-btn[data-ab-id="ab_overclock"]');
      assert.equal(await h.hasClass('.ability-btn[data-ab-id="ab_rush"]', 'is-active'), true);
      assert.equal(await h.hasClass('.ability-btn[data-ab-id="ab_overclock"]', 'is-active'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
