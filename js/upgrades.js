export const UPGRADES = [
  {
    id: 'reinforced_spring',
    name: 'Reinforced Spring',
    desc: 'Heavier return tension for cleaner contact.',
    effectLabel: '+$1.00 / press',
    baseCost: 15,
    costScale: 1.45,
    maxLevel: null,
    isUnlocked: (state) => state.phase >= 2
  },
  {
    id: 'solenoid_arm',
    name: 'Solenoid Auto-Presser',
    desc: 'A rhythmic actuator mounted over the cap.',
    effectLabel: '+$1.00 / sec',
    baseCost: 30,
    costScale: 1.42,
    maxLevel: null,
    isUnlocked: (state) => state.phase >= 2
  },
  {
    id: 'copper_contacts',
    name: 'Silver-Clad Contacts',
    desc: 'Reduces resistance across the switch.',
    effectLabel: '1.5x press yield',
    baseCost: 75,
    costScale: 2.2,
    maxLevel: 3,
    isUnlocked: (state) => state.phase >= 2 && (state.totalMoney >= 55 || (state.upgrades.reinforced_spring || 0) >= 1)
  },
  {
    id: 'subfloor_relay',
    name: 'Sub-Floor Relay',
    desc: 'Taps directly into the conduit beneath the concrete.',
    effectLabel: '+$6.00 / sec',
    baseCost: 180,
    costScale: 1.5,
    maxLevel: null,
    isUnlocked: (state) => state.phase >= 3
  },
  {
    id: 'acoustic_dampener',
    name: 'Acoustic Dampener',
    desc: 'Muffles the metallic echo rising from below.',
    effectLabel: '+$5.00 / press',
    baseCost: 320,
    costScale: 1.75,
    maxLevel: null,
    isUnlocked: (state) => state.phase >= 3
  },
  {
    id: 'resonance_coil',
    name: 'Resonance Coil',
    desc: 'Synchronizes actuation with the deeper hum.',
    effectLabel: '+$22.00 / sec',
    baseCost: 650,
    costScale: 1.6,
    maxLevel: null,
    isUnlocked: (state) => state.casingInspected
  }
];

export function getUpgradeLevel(state, id) {
  return state.upgrades[id] || 0;
}

export function getUpgradeCost(upgrade, level) {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costScale, level));
}

export function getPressValue(state) {
  const spring = getUpgradeLevel(state, 'reinforced_spring');
  const dampener = getUpgradeLevel(state, 'acoustic_dampener');
  const contacts = getUpgradeLevel(state, 'copper_contacts');
  const base = 1 + spring * 1 + dampener * 5;
  const multiplier = Math.pow(1.5, contacts);
  const resonanceBonus = state.casingInspected ? 1.25 : 1;
  return base * multiplier * resonanceBonus;
}

export function getPassiveRate(state) {
  const solenoids = getUpgradeLevel(state, 'solenoid_arm');
  const relays = getUpgradeLevel(state, 'subfloor_relay');
  const coils = getUpgradeLevel(state, 'resonance_coil');
  return solenoids * 1 + relays * 6 + coils * 22;
}
