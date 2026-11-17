export function getCrossFloorBonuses(state) {
  // Single source of truth for cross-floor multipliers across Core, TD, RPG, and Merge.
  let moneyMult = 1;
  let rpMult = 1;
  let clickMult = 1;
  const speedMult = 1;
  let sharePotencyMult = 1;

  let tdDamageMult = 1;
  let tdFireRateMult = 1;
  let tdScrapMult = 1;

  let rpgAtkMult = 1;
  let rpgDefMult = 1;
  let rpgHpMult = 1;
  let mergeSpeedMult = 1;

  if (state) {
    const achCount = Array.isArray(state.achievements) ? state.achievements.length : 0;
    if (achCount > 0) {
      moneyMult *= Math.pow(1.05, achCount);
    }
    const perks = Array.isArray(state.boardroomPerks) ? state.boardroomPerks : [];
    const restructures = state.restructures || 0;
    if (perks.includes('perk_synergy_core') && restructures > 0) {
      moneyMult *= Math.pow(1.5, restructures);
      tdScrapMult *= 1 + 0.1 * restructures;
    }

    // Floor B2 (TD) -> Core: Containment Integrity
    const highestWave = state.td?.highestWave || 0;
    if (highestWave > 0) {
      moneyMult *= 1 + 0.10 * highestWave;
      rpMult *= 1 + 0.05 * highestWave;
    }

    // Core -> Floor B2 (TD) inputs
    const research = Array.isArray(state.completedResearch) ? state.completedResearch : [];
    if (research.includes('res_compliance')) tdDamageMult *= 1.25;
    if (research.includes('res_cosmic_audit')) tdDamageMult *= 2;
    if (research.includes('res_workflow')) {
      tdFireRateMult *= 1.15;
      mergeSpeedMult *= 1.15;
    }
    if (research.includes('res_automated_kpi')) tdScrapMult *= 1.25;

    const abilities = state.abilities || {};
    if ((abilities.ab_rush?.activeRemaining || 0) > 0) {
      tdDamageMult *= 1.5;
      rpgAtkMult *= 1.25;
    }
    if ((abilities.ab_overclock?.activeRemaining || 0) > 0) {
      tdFireRateMult *= 1.5;
      mergeSpeedMult *= 1.35;
    }

    // Floor B4 (RPG) -> Cross-Floor: Equipped Artifacts & Highest Sector
    const rpg = state.rpg;
    if (rpg) {
      const highestSector = rpg.highestSector || 0;
      if (highestSector > 1) {
        sharePotencyMult *= 1 + 0.08 * (highestSector - 1);
      }
      const equipped = Array.isArray(rpg.equipped) ? rpg.equipped : [];
      const artifacts = Array.isArray(rpg.artifacts) ? rpg.artifacts : [];
      for (const eqId of equipped) {
        const art = artifacts.find((a) => a.id === eqId);
        if (!art || !art.bonusVal) continue;
        if (art.bonusType === 'clickMult') clickMult *= 1 + art.bonusVal;
        else if (art.bonusType === 'moneyMult') moneyMult *= 1 + art.bonusVal;
        else if (art.bonusType === 'tdDamageMult') tdDamageMult *= 1 + art.bonusVal;
        else if (art.bonusType === 'rpgAtkMult') rpgAtkMult *= 1 + art.bonusVal;
        else if (art.bonusType === 'mergeSpeedMult') mergeSpeedMult *= 1 + art.bonusVal;
      }
    }

    // Floor B6 (Merge) -> Cross-Floor: Grid Aura & Catalysts
    const merge = state.merge;
    if (merge) {
      const grid = Array.isArray(merge.grid) ? merge.grid : [];
      let aura = 0;
      for (const cell of grid) {
        if (typeof cell === 'number' && cell > 0) {
          aura += Math.pow(2, cell - 1);
        }
      }
      if (aura > 0) {
        moneyMult *= 1 + aura * 0.05;
        clickMult *= 1 + aura * 0.05;
      }
      const catalysts = merge.catalysts || 0;
      if (catalysts > 0) {
        rpMult *= 1 + catalysts * 0.10;
        sharePotencyMult *= 1 + catalysts * 0.05;
      }
    }
  }

  return {
    moneyMult,
    rpMult,
    clickMult,
    speedMult,
    tdDamageMult,
    tdFireRateMult,
    tdScrapMult,
    rpgAtkMult,
    rpgDefMult,
    rpgHpMult,
    mergeSpeedMult,
    sharePotencyMult
  };
}
