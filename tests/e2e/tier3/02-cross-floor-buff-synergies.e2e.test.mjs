import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { E2EHarness } from '../helpers/harness.mjs';
import { REPO_ROOT, createPostRestructureSave } from '../helpers/fixtures.mjs';

describe('Tier 3 — Cross-Floor Buff Synergies (Core <-> TD <-> RPG <-> Merge)', () => {
  it('1. TD highestWave boosts Core $/sec and RP/sec', async () => {
    const lowWaveSeed = createPostRestructureSave({
      generators: { intern: { owned: 10, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      td: { wave: 1, highestWave: 0, scrap: 0, overcharge: 0, turrets: [], waveProgress: 0 },
    });
    const highWaveSeed = createPostRestructureSave({
      generators: { intern: { owned: 10, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      td: { wave: 20, highestWave: 20, scrap: 0, overcharge: 0, turrets: [], waveProgress: 0 },
    });

    const h1 = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: lowWaveSeed });
    let lowRate = '';
    try {
      lowRate = await h1.text('#rate-money');
      h1.assertNoErrors();
    } finally {
      await h1.close();
    }

    const h2 = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: highWaveSeed });
    try {
      const highRate = await h2.text('#rate-money');
      assert.notEqual(highRate, lowRate);
      h2.assertNoErrors();
    } finally {
      await h2.close();
    }
  });

  it('2. Equipped RPG Containment Artifact boosts Click power on 1F: DESK', async () => {
    const unequippedSeed = createPostRestructureSave({
      rpg: {
        sector: 2,
        stage: 1,
        highestSector: 1,
        credits: 0,
        intel: 0,
        shards: 0,
        squad: [],
        artifacts: [{ id: 'art_click', name: 'Lead Signet', bonusType: 'clickMult', bonusVal: 1.0 }],
        equipped: [],
      },
    });
    const h = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: unequippedSeed });
    try {
      const clickBefore = await h.text('#button-sub');
      await h.click('#floor-btn-rpg');
      await h.click('#floor-rpg [data-rpg-action="equip"][data-art-id="art_click"]');
      await h.click('#floor-btn-desk');
      const clickAfter = await h.text('#button-sub');
      assert.notEqual(clickAfter, clickBefore);
      h.assertNoErrors();
    } finally {
      await h.close();
    }
  });

  it('3. Merge Grid Actuator Cores boost Core $/sec on 1F: DESK', async () => {
    const emptyGridSeed = createPostRestructureSave({
      generators: { intern: { owned: 10, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      merge: { grid: Array(16).fill(null), spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 0, peakTier: 0 },
    });
    const populatedGrid = Array(16).fill(null);
    populatedGrid[0] = 6;
    populatedGrid[1] = 6;
    const activeGridSeed = createPostRestructureSave({
      generators: { intern: { owned: 10, progress: 0, running: true } },
      upgrades: ['mgr_intern'],
      merge: { grid: populatedGrid, spawnerLevel: 1, baseTier: 1, autoMerge: false, catalysts: 2, peakTier: 6 },
    });

    const h1 = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: emptyGridSeed });
    let rateEmpty = '';
    try {
      rateEmpty = await h1.text('#rate-money');
    } finally {
      await h1.close();
    }

    const h2 = await E2EHarness.create({ rootDir: REPO_ROOT, initialState: activeGridSeed });
    try {
      const rateActive = await h2.text('#rate-money');
      assert.notEqual(rateActive, rateEmpty);
      h2.assertNoErrors();
    } finally {
      await h2.close();
    }
  });
});
