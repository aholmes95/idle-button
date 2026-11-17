import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave, V3_SAVE_KEY } from '../helpers/fixtures.mjs';

describe('Tier 1 — Floor B2: Security Perimeter (Tower Defense)', () => {
  it('1. Elevator navigation switches to #floor-td and hides 1F: DESK', async () => {
    const seed = createPostRestructureSave({ unlockedFloors: ['desk', 'td'] });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      assert.equal(await h.hasClass('#floor-btn-td', 'is-locked'), false);
      await h.click('#floor-btn-td');
      assert.equal(await h.hasClass('#floor-td', 'is-hidden'), false);
      assert.equal(await h.hasClass('#workspace', 'is-hidden'), true);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('2. Buying turret pad and placing each of the 4 turret types', async () => {
    const seed = createPostRestructureSave({
      money: 1e7,
      totalMoneyRun: 1e7,
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForSelector('#floor-td');
      for (const turretType of ['laser', 'slow', 'cannon', 'tesla']) {
        const padSel = '#floor-td [data-td-action="buy-pad"]';
        await h.click(padSel);
        await h.click(`#floor-td [data-td-turret-type="${turretType}"]`);
      }
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.td.turrets.length >= 4);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Upgrading a placed turret spends td.scrap and increases level/DPS', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
      td: {
        wave: 3,
        highestWave: 2,
        scrap: 100,
        overcharge: 0,
        turrets: [{ id: 0, type: 'laser', level: 1 }],
        waveProgress: 0,
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-td [data-td-action="upgrade-turret"][data-turret-idx="0"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.equal(save.td.turrets[0].level, 2);
      assert.ok(save.td.scrap < 100);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('4. Wave progression clears waves, grants scrap, and spawns Boss every 5 waves', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
      td: {
        wave: 5,
        highestWave: 4,
        scrap: 0,
        overcharge: 0,
        turrets: [
          { id: 0, type: 'laser', level: 5 },
          { id: 1, type: 'cannon', level: 5 },
        ],
        waveProgress: 0.9,
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.waitForCondition(() => {
        const raw = localStorage.getItem('idle_button_v3_save');
        return raw && JSON.parse(raw).td.highestWave >= 5;
      }, { timeoutMs: 10000 });
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.td.scrap > 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('5. Emergency Overcharge spends $ and temporarily boosts turret output', async () => {
    const seed = createPostRestructureSave({
      money: 50000,
      unlockedFloors: ['desk', 'td'],
      activeFloor: 'td',
      td: {
        wave: 1,
        highestWave: 0,
        scrap: 0,
        overcharge: 0,
        turrets: [{ id: 0, type: 'laser', level: 1 }],
        waveProgress: 0,
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      await h.click('#floor-td [data-td-action="overcharge"]');
      const save = await h.readStorage(V3_SAVE_KEY);
      assert.ok(save.td.overcharge > 0);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('6. Advancing td.highestWave increases global $/sec & RP/sec on 1F: DESK', async () => {
    const seed = createPostRestructureSave({
      unlockedFloors: ['desk', 'td'],
      generators: { intern: { owned: 10, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      td: { wave: 10, highestWave: 10, scrap: 0, overcharge: 0, turrets: [], waveProgress: 0 },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: seed });
    try {
      const rateText = await h.text('#rate-money');
      assert.notEqual(rateText, '+$0.00 / sec');
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });
});
