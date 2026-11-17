export const GENERATORS = [
  {
    id: 'intern',
    name: 'Coffee-Fueled Intern',
    desc: 'Presses the button with youthful, underpaid optimism.',
    baseCost: 10,
    costScale: 1.15,
    cycleTime: 2.0,
    basePayout: 2,
    rpPerCycle: 0.1,
    managerId: 'mgr_intern',
    unlockMoney: 0
  },
  {
    id: 'bird',
    name: 'Drinking Bird',
    desc: 'Classic desk toy. Never asks for dental or PTO.',
    baseCost: 65,
    costScale: 1.16,
    cycleTime: 3.5,
    basePayout: 12,
    rpPerCycle: 0.35,
    managerId: 'mgr_bird',
    unlockMoney: 40
  },
  {
    id: 'solenoid',
    name: 'Solenoid Rig',
    desc: 'Bolted straight to your desk. Sounds like an angry woodpecker.',
    baseCost: 380,
    costScale: 1.17,
    cycleTime: 5.0,
    basePayout: 75,
    rpPerCycle: 1.0,
    managerId: 'mgr_solenoid',
    unlockMoney: 220
  },
  {
    id: 'pod',
    name: 'Call-Center Pod',
    desc: 'Twelve operators pressing in unison. HR calls the chanting "team spirit."',
    baseCost: 2400,
    costScale: 1.18,
    cycleTime: 8.0,
    basePayout: 480,
    rpPerCycle: 3.0,
    managerId: 'mgr_pod',
    unlockMoney: 1400
  },
  {
    id: 'sublevel',
    name: 'Sub-Level 3 Relay',
    desc: 'Located beneath the basement. Nobody remembers pouring the concrete.',
    baseCost: 16000,
    costScale: 1.19,
    cycleTime: 12.0,
    basePayout: 3400,
    rpPerCycle: 8.0,
    managerId: 'mgr_sublevel',
    unlockMoney: 9000
  },
  {
    id: 'conduit',
    name: 'The Conduit',
    desc: 'It does not press the button. It answers what is waiting underneath.',
    baseCost: 110000,
    costScale: 1.2,
    cycleTime: 18.0,
    basePayout: 24000,
    rpPerCycle: 20.0,
    managerId: 'mgr_conduit',
    unlockMoney: 60000
  },
  {
    id: 'resonance',
    name: 'Resonance Array',
    desc: 'Harmonizes sub-floor vibrations into measurable compliance.',
    baseCost: 1200000,
    costScale: 1.21,
    cycleTime: 25.0,
    basePayout: 220000,
    rpPerCycle: 60.0,
    managerId: 'mgr_resonance',
    unlockMoney: 600000
  },
  {
    id: 'archive',
    name: 'Mnemonic Archive',
    desc: 'Stores every employee’s first-day memories on magnetized tape.',
    baseCost: 18000000,
    costScale: 1.22,
    cycleTime: 35.0,
    basePayout: 3200000,
    rpPerCycle: 180.0,
    managerId: 'mgr_archive',
    unlockMoney: 9000000
  },
  {
    id: 'rift',
    name: 'Borehole Singularity',
    desc: 'A vertical shaft with no bottom. Pressures rise from below.',
    baseCost: 300000000,
    costScale: 1.23,
    cycleTime: 48.0,
    basePayout: 52000000,
    rpPerCycle: 550.0,
    managerId: 'mgr_rift',
    unlockMoney: 150000000
  },
  {
    id: 'board',
    name: 'The Board',
    desc: 'They do not meet in a room. They are the architecture.',
    baseCost: 6500000000,
    costScale: 1.25,
    cycleTime: 65.0,
    basePayout: 1100000000,
    rpPerCycle: 1800.0,
    managerId: 'mgr_board',
    unlockMoney: 3000000000
  }
];

export const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 500];

export const MILESTONE_MULTIPLIERS = {
  10: 2,
  25: 2,
  50: 2,
  100: 2,
  150: 3,
  200: 3,
  300: 4,
  500: 4
};

export const MANAGERS = [
  { id: 'mgr_intern', name: 'Shift Lead', desc: 'Automates Coffee-Fueled Interns.', cost: 50, targetGen: 'intern' },
  { id: 'mgr_bird', name: 'Desk Supervisor', desc: 'Automates Drinking Birds.', cost: 300, targetGen: 'bird' },
  { id: 'mgr_solenoid', name: 'Maintenance Tech', desc: 'Automates Solenoid Rigs.', cost: 1800, targetGen: 'solenoid' },
  { id: 'mgr_pod', name: 'Floor Overseer', desc: 'Automates Call-Center Pods.', cost: 12000, targetGen: 'pod' },
  { id: 'mgr_sublevel', name: 'Handler 09', desc: 'Automates Sub-Level 3 Relays. Does not blink.', cost: 65000, targetGen: 'sublevel' },
  { id: 'mgr_conduit', name: 'The Listener', desc: 'Automates The Conduit. Keeps the rhythm steady.', cost: 400000, targetGen: 'conduit' },
  { id: 'mgr_resonance', name: 'Harmonic Director', desc: 'Automates Resonance Arrays.', cost: 4500000, targetGen: 'resonance' },
  { id: 'mgr_archive', name: 'Chief Archivist', desc: 'Automates Mnemonic Archives.', cost: 65000000, targetGen: 'archive' },
  { id: 'mgr_rift', name: 'Singularity Warden', desc: 'Automates Borehole Singularities.', cost: 1100000000, targetGen: 'rift' },
  { id: 'mgr_board', name: 'Executive Secretary', desc: 'Automates The Board. Never speaks aloud.', cost: 25000000000, targetGen: 'board' }
];

export const UPGRADES = [
  { id: 'upg_keycap', name: 'Ergonomic Keycap', desc: 'Makes pressing feel 40% more executive.', effect: '+$1.00 base click', cost: 25, unlockMoney: 15, category: 'click' },
  { id: 'upg_espresso', name: 'Double-Shot Espresso', desc: 'Jittery fingers, faster quotas.', effect: '2x click power', cost: 90, unlockMoney: 50, category: 'click' },
  { id: 'upg_intern_manual', name: 'Motivational Posters', desc: '"Hang in there!" (Mandatory)', effect: '2x Intern payout', cost: 150, unlockMoney: 80, category: 'division' },
  { id: 'upg_bird_oil', name: 'Synthetic Joint Oil', desc: 'Reduces squeaking by 92%.', effect: '2x Drinking Bird payout', cost: 550, unlockMoney: 300, category: 'division' },
  { id: 'upg_synergy', name: 'Corporate Synergy', desc: 'Nobody knows what it means, but numbers go up.', effect: '1.5x all divisions', cost: 1200, unlockMoney: 700, category: 'synergy' },
  { id: 'upg_solenoid_amp', name: 'Overvolted Coils', desc: 'Smells faintly of ozone.', effect: '2x Solenoid Rig payout', cost: 4500, unlockMoney: 2200, category: 'division' },
  { id: 'upg_compliance', name: 'Mandatory Overtime', desc: 'Badge readers now only work on entry.', effect: '2x all divisions', cost: 25000, unlockMoney: 12000, category: 'synergy' },
  { id: 'upg_pod_script', name: 'Synchronized Scripts', desc: 'Forty-eight syllables per minute, zero deviation.', effect: '2x Call-Center Pod payout', cost: 30000, unlockMoney: 15000, category: 'division' },
  { id: 'upg_intern_coffee', name: 'IV Drip Cold Brew', desc: 'Replaces lunch breaks with continuous infusion.', effect: '3x Intern payout', cost: 60000, unlockMoney: 30000, category: 'division' },
  { id: 'upg_tether', name: 'Bio-Kinetic Tether', desc: 'Every pulse feeds directly from the floor.', effect: '+2% of $/sec per click', cost: 150000, unlockMoney: 75000, category: 'click' },
  { id: 'upg_sublevel_coolant', name: 'Cryo-Brine Coolant', desc: 'Keeps the concrete from sweating.', effect: '2x Sub-Level 3 Relay payout', cost: 250000, unlockMoney: 120000, category: 'division' },
  { id: 'upg_intern_conduit', name: 'Middle Management Sacrifice', desc: 'Interns work harder when The Conduit hums nearby.', effect: '+25% Intern payout per Conduit', cost: 500000, unlockMoney: 250000, category: 'synergy' },
  { id: 'upg_bird_counterweight', name: 'Tungsten Beaks', desc: 'Delivers a decisive, rhythmic strike.', effect: '3x Drinking Bird payout', cost: 850000, unlockMoney: 400000, category: 'division' },
  { id: 'upg_conduit_tuning', name: 'Harmonic Copper Sleeve', desc: 'Amplifies whatever answers from below.', effect: '2x The Conduit payout', cost: 2000000, unlockMoney: 1000000, category: 'division' },
  { id: 'upg_kinetic_grid', name: 'Kinetic Grid', desc: 'Redirects floor torque into your actuator.', effect: '+3% of $/sec per click', cost: 5000000, unlockMoney: 2500000, category: 'click' },
  { id: 'upg_bird_resonance', name: 'Harmonic Dipping', desc: 'Plastic beaks lock into the bedrock frequency.', effect: '+5% Resonance Array payout per Bird', cost: 15000000, unlockMoney: 7500000, category: 'synergy' },
  { id: 'upg_resonance_crystal', name: 'Quartz Tuning Forks', desc: 'Shatters glass on floors 1 through 4.', effect: '2x Resonance Array payout', cost: 25000000, unlockMoney: 12000000, category: 'division' },
  { id: 'upg_solenoid_quantum', name: 'Flux-Core Solenoids', desc: 'Strikes before the signal is even sent.', effect: '3x Solenoid Rig payout', cost: 55000000, unlockMoney: 25000000, category: 'division' },
  { id: 'upg_all_synergy_2', name: 'Vertical Integration', desc: 'Every sub-level answers to the same ledger.', effect: '3x all divisions', cost: 100000000, unlockMoney: 50000000, category: 'synergy' },
  { id: 'upg_archive_index', name: 'Infinite Microfiche', desc: 'Stores memories that have not happened yet.', effect: '2x Mnemonic Archive payout', cost: 400000000, unlockMoney: 200000000, category: 'division' },
  { id: 'upg_neural_link', name: 'Neural Actuator Link', desc: 'Your pulse and the button share one nerve.', effect: '+5% $/sec per click & +0.5 RP/click', cost: 500000000, unlockMoney: 250000000, category: 'click' },
  { id: 'upg_pod_hive', name: 'Choral Recursion', desc: 'Twelve voices become one continuous tone.', effect: '3x Call-Center Pod payout', cost: 1500000000, unlockMoney: 750000000, category: 'division' },
  { id: 'upg_rift_stabilizer', name: 'Event Horizon Gasket', desc: 'Prevents the shaft from widening past HR.', effect: '2x Borehole Singularity payout', cost: 8000000000, unlockMoney: 4000000000, category: 'division' },
  { id: 'upg_all_synergy_3', name: 'Total Compliance', desc: 'All divisions operate as a single organism.', effect: '5x all divisions', cost: 50000000000, unlockMoney: 25000000000, category: 'synergy' },
  { id: 'upg_board_quorum', name: 'Unanimous Quorum', desc: 'The Board votes yes before the motion is read.', effect: '2x The Board payout', cost: 150000000000, unlockMoney: 75000000000, category: 'division' },
  { id: 'upg_sublevel_deep', name: 'Sub-Level 4 Expansion', desc: 'More concrete. Deeper relays.', effect: '3x Sub-Level 3 Relay payout', cost: 600000000000, unlockMoney: 300000000000, category: 'division' }
];

export const RESEARCH_PROJECTS = [
  {
    id: 'res_ergonomics',
    name: 'Click Ergonomics',
    desc: 'Optimize finger-to-actuator force transfer.',
    reward: 'Unlocks "Synergy Rush" protocol & 1.5x click power',
    rpCost: 8,
    duration: 5,
    requires: null,
    branch: 'efficiency'
  },
  {
    id: 'res_workflow',
    name: 'Autonomous Workflow',
    desc: 'Streamline shift handoffs across all button divisions.',
    reward: 'All divisions run 20% faster',
    rpCost: 22,
    duration: 8,
    requires: 'res_ergonomics',
    branch: 'efficiency'
  },
  {
    id: 'res_acoustics',
    name: 'Sub-Floor Acoustics',
    desc: 'Investigate that rhythmic thumping beneath the breakroom.',
    reward: 'Unlocks "Power Surge" protocol & 1.5x all payouts',
    rpCost: 55,
    duration: 12,
    requires: 'res_workflow',
    branch: 'efficiency'
  },
  {
    id: 'res_lean_six',
    name: 'Lean Six-Sigma',
    desc: 'Eliminate wasted motion between button actuations.',
    reward: 'All divisions run 25% faster',
    rpCost: 120,
    duration: 20,
    requires: 'res_workflow',
    branch: 'efficiency'
  },
  {
    id: 'res_automated_kpi',
    name: 'Automated KPIs',
    desc: 'Algorithmic quota bonuses on every division milestone.',
    reward: 'Milestones grant +25% extra multiplier',
    rpCost: 450,
    duration: 30,
    requires: 'res_lean_six',
    branch: 'efficiency'
  },
  {
    id: 'res_quantum_payroll',
    name: 'Quantum Payroll',
    desc: 'Compensation exists in a superposition until spent.',
    reward: 'All division payouts 3x',
    rpCost: 2000,
    duration: 45,
    requires: 'res_automated_kpi',
    branch: 'efficiency'
  },
  {
    id: 'res_compliance',
    name: 'Compliance Telemetry',
    desc: 'Decode the actual destination of ButtonCorp™ revenue.',
    reward: 'Reveals Restructure & 2x all payouts',
    rpCost: 130,
    duration: 16,
    requires: 'res_acoustics',
    branch: 'containment'
  },
  {
    id: 'res_vessel',
    name: 'Vessel Transfer Protocol',
    desc: 'Prepare the floor for complete cycle resetting.',
    reward: 'Unlocks "Deep Syphon" protocol & +15% per Share',
    rpCost: 260,
    duration: 22,
    requires: 'res_compliance',
    branch: 'containment'
  },
  {
    id: 'res_anomaly_harness',
    name: 'Anomaly Harnessing',
    desc: 'Stabilize rogue memos and containment leaks for extraction.',
    reward: '2x rewards from Memo & Anomaly events',
    rpCost: 350,
    duration: 25,
    requires: 'res_compliance',
    branch: 'containment'
  },
  {
    id: 'res_protocol_overclock',
    name: 'Protocol Overclocking',
    desc: 'Override thermal safeties across all sub-floor relays.',
    reward: 'Unlocks "Containment Overclock" protocol (3x cycle speed)',
    rpCost: 900,
    duration: 35,
    requires: 'res_anomaly_harness',
    branch: 'containment'
  },
  {
    id: 'res_deep_bore',
    name: 'Deep Bore Telemetry',
    desc: 'Lower sensors past Sub-Level 9 into the dark.',
    reward: '2x RP gain & deep-bore telemetry unlocked',
    rpCost: 3500,
    duration: 50,
    requires: 'res_protocol_overclock',
    branch: 'containment'
  },
  {
    id: 'res_cosmic_audit',
    name: 'The Cosmic Audit',
    desc: 'Reconcile the final ledger with whatever sits below.',
    reward: '5x all output & reveals final narrative arc',
    rpCost: 12000,
    duration: 75,
    requires: 'res_deep_bore',
    branch: 'containment'
  }
];

export const ABILITIES = [
  {
    id: 'ab_rush',
    name: 'Synergy Rush',
    desc: '2x all division & click output for 15s',
    duration: 15,
    cooldown: 35,
    unlockResearch: 'res_ergonomics'
  },
  {
    id: 'ab_surge',
    name: 'Power Surge',
    desc: 'Instantly collect 15s of passive income',
    duration: 0,
    cooldown: 45,
    unlockResearch: 'res_acoustics'
  },
  {
    id: 'ab_syphon',
    name: 'Deep Syphon',
    desc: '3x click power & 2x RP gain for 20s',
    duration: 20,
    cooldown: 60,
    unlockResearch: 'res_vessel'
  },
  {
    id: 'ab_overclock',
    name: 'Containment Overclock',
    desc: 'All division cycles run 3x faster for 12s',
    duration: 12,
    cooldown: 75,
    unlockResearch: 'res_protocol_overclock'
  }
];

export const BOARDROOM_PERKS = [
  {
    id: 'perk_golden_parachute',
    name: 'Golden Parachute',
    desc: 'Start every Restructure with $500 and Upgrades unlocked.',
    cost: 1,
    requires: null,
    category: 'foundation'
  },
  {
    id: 'perk_severance',
    name: 'Severance Package',
    desc: 'Start every Restructure with 10 Interns & Shift Lead hired.',
    cost: 2,
    requires: 'perk_golden_parachute',
    category: 'foundation'
  },
  {
    id: 'perk_insider_trading',
    name: 'Insider Trading',
    desc: '+15% per Share (additive) & keep Vessel Transfer Protocol permanent.',
    cost: 3,
    requires: null,
    category: 'shares'
  },
  {
    id: 'perk_fast_track',
    name: 'Executive Fast-Track',
    desc: 'All R&D durations -40% and RP gain +50%.',
    cost: 4,
    requires: 'perk_insider_trading',
    category: 'research'
  },
  {
    id: 'perk_bulk_discount',
    name: 'Creative Accounting',
    desc: 'All generator costs -10% & click power +1% of $/sec permanently.',
    cost: 5,
    requires: 'perk_severance',
    category: 'economy'
  },
  {
    id: 'perk_offline_rig',
    name: 'Night Shift Protocol',
    desc: 'Offline earnings boosted from 25% to 75% (up to 12h).',
    cost: 5,
    requires: 'perk_golden_parachute',
    category: 'economy'
  },
  {
    id: 'perk_anomaly_attractor',
    name: 'Reality Leak',
    desc: 'Memo & Anomaly events spawn 2x more often with +50% duration.',
    cost: 6,
    requires: 'perk_fast_track',
    category: 'anomaly'
  },
  {
    id: 'perk_auto_mgr',
    name: 'HR Algorithm',
    desc: 'Automatically hires Managers as soon as you can afford them.',
    cost: 8,
    requires: 'perk_bulk_discount',
    category: 'automation'
  },
  {
    id: 'perk_synergy_core',
    name: 'Synergistic Restructuring',
    desc: 'Each Restructure grants a multiplicative 1.5x global & Share bonus.',
    cost: 12,
    requires: 'perk_auto_mgr',
    category: 'shares'
  },
  {
    id: 'perk_floor_defense',
    name: 'Unlock: B2 Security Perimeter',
    desc: 'Opens elevator access to Floor B2 (Idle Tower Defense).',
    cost: 15,
    requires: 'perk_synergy_core',
    category: 'floors',
    unlockFloor: 'td'
  },
  {
    id: 'perk_floor_arena',
    name: 'Unlock: B4 Field Ops',
    desc: 'Opens elevator access to Floor B4 (Squad Auto-Battler).',
    cost: 30,
    requires: 'perk_floor_defense',
    category: 'floors',
    unlockFloor: 'rpg'
  },
  {
    id: 'perk_floor_merge',
    name: 'Unlock: B6 Synthesis Forge',
    desc: 'Opens elevator access to Floor B6 (Actuator Merge Grid).',
    cost: 60,
    requires: 'perk_floor_arena',
    category: 'floors',
    unlockFloor: 'merge'
  }
];

export const ACHIEVEMENTS = [
  { id: 'ach_press_100', name: 'Carpal Warmup', desc: 'Press the button 100 times.', category: 'Presses', condition: (s) => s.presses >= 100 },
  { id: 'ach_press_1000', name: 'Quota Devotee', desc: 'Press the button 1,000 times.', category: 'Presses', condition: (s) => s.presses >= 1000 },
  { id: 'ach_press_10000', name: 'Obsessive Actuator', desc: 'Press the button 10,000 times.', category: 'Presses', condition: (s) => s.presses >= 10000 },
  { id: 'ach_wealth_1k', name: 'Seed Capital', desc: 'Earn $1,000 all-time.', category: 'Wealth', condition: (s) => s.totalMoneyAllTime >= 1000 },
  { id: 'ach_wealth_1m', name: 'Seven Figures', desc: 'Earn $1,000,000 all-time.', category: 'Wealth', condition: (s) => s.totalMoneyAllTime >= 1e6 },
  { id: 'ach_wealth_1b', name: 'Billion-Dollar Rig', desc: 'Earn $1,000,000,000 all-time.', category: 'Wealth', condition: (s) => s.totalMoneyAllTime >= 1e9 },
  { id: 'ach_wealth_1t', name: 'Trillionaire Compliance', desc: 'Earn $1T all-time.', category: 'Wealth', condition: (s) => s.totalMoneyAllTime >= 1e12 },
  { id: 'ach_wealth_1qa', name: 'Post-Monetary', desc: 'Earn $1Qa all-time.', category: 'Wealth', condition: (s) => s.totalMoneyAllTime >= 1e15 },
  { id: 'ach_intern_50', name: 'Open-Plan Nightmare', desc: 'Own 50 Coffee-Fueled Interns.', category: 'Divisions', condition: (s) => (s.generators.intern?.owned || 0) >= 50 },
  { id: 'ach_intern_100', name: 'Infinite Internship', desc: 'Own 100 Coffee-Fueled Interns.', category: 'Divisions', condition: (s) => (s.generators.intern?.owned || 0) >= 100 },
  { id: 'ach_conduit_1', name: 'First Contact', desc: 'Acquire The Conduit.', category: 'Divisions', condition: (s) => (s.generators.conduit?.owned || 0) >= 1 },
  { id: 'ach_conduit_10', name: 'Harmonic Chorus', desc: 'Own 10 Conduits.', category: 'Divisions', condition: (s) => (s.generators.conduit?.owned || 0) >= 10 },
  { id: 'ach_resonance_1', name: 'Bedrock Frequency', desc: 'Build a Resonance Array.', category: 'Divisions', condition: (s) => (s.generators.resonance?.owned || 0) >= 1 },
  { id: 'ach_archive_1', name: 'Tape Memory', desc: 'Commission a Mnemonic Archive.', category: 'Divisions', condition: (s) => (s.generators.archive?.owned || 0) >= 1 },
  { id: 'ach_rift_1', name: 'Into the Shaft', desc: 'Open a Borehole Singularity.', category: 'Divisions', condition: (s) => (s.generators.rift?.owned || 0) >= 1 },
  { id: 'ach_board_1', name: 'Seat at the Table', desc: 'Convene The Board.', category: 'Divisions', condition: (s) => (s.generators.board?.owned || 0) >= 1 },
  { id: 'ach_restructure_1', name: 'Fresh Stationery', desc: 'Complete your 1st Restructure.', category: 'Restructures', condition: (s) => s.restructures >= 1 },
  { id: 'ach_restructure_3', name: 'Serial Executive', desc: 'Complete 3 Restructures.', category: 'Restructures', condition: (s) => s.restructures >= 3 },
  { id: 'ach_restructure_5', name: 'Vessel Veteran', desc: 'Complete 5 Restructures.', category: 'Restructures', condition: (s) => s.restructures >= 5 },
  { id: 'ach_restructure_10', name: 'Eternal Shift', desc: 'Complete 10 Restructures.', category: 'Restructures', condition: (s) => s.restructures >= 10 },
  { id: 'ach_anomaly_1', name: 'Caught in Transit', desc: 'Intercept 1 Memo or Anomaly.', category: 'Events', condition: (s) => (s.anomaliesCaught || 0) >= 1 },
  { id: 'ach_anomaly_10', name: 'Leak Containment', desc: 'Intercept 10 Memos or Anomalies.', category: 'Events', condition: (s) => (s.anomaliesCaught || 0) >= 10 },
  { id: 'ach_anomaly_50', name: 'Reality Auditor', desc: 'Intercept 50 Memos or Anomalies.', category: 'Events', condition: (s) => (s.anomaliesCaught || 0) >= 50 },
  { id: 'ach_research_all', name: 'Full Clearance', desc: 'Complete all 12 R&D projects.', category: 'Events', condition: (s) => s.completedResearch.length >= RESEARCH_PROJECTS.length },
  { id: 'ach_td_wave_5', name: 'Perimeter Held', desc: 'Clear Wave 5 in B2 Security Perimeter.', category: 'Security', condition: (s) => (s.td?.highestWave || 0) >= 5 },
  { id: 'ach_td_wave_20', name: 'Containment Bastion', desc: 'Clear Wave 20 in B2 Security Perimeter.', category: 'Security', condition: (s) => (s.td?.highestWave || 0) >= 20 }
];

export const NARRATIVE_BEATS = [
  {
    id: 'welcome',
    condition: (s) => s.presses >= 5,
    type: 'fun',
    text: 'Welcome to ButtonCorp™! Management is thrilled with your enthusiasm. Here is a breakroom napkin.'
  },
  {
    id: 'first_intern',
    condition: (s) => (s.generators.intern?.owned || 0) >= 1,
    type: 'fun',
    text: 'You hired your first Intern! They asked what the button actually does. You told them "synergy."'
  },
  {
    id: 'unlock_upgrades',
    condition: (s) => s.totalMoneyRun >= 25,
    type: 'system',
    text: 'Upgrades tab unlocked! Hire Managers to automate your divisions.'
  },
  {
    id: 'first_manager',
    condition: (s) => s.upgrades.some((id) => id.startsWith('mgr_')),
    type: 'fun',
    text: 'Your new Manager is watching the clock so you don’t have to. Productivity is soaring!'
  },
  {
    id: 'unlock_research',
    condition: (s) => s.totalMoneyRun >= 200,
    type: 'system',
    text: 'R&D Lab unlocked! Divisions now generate Research Points (RP) on every cycle.'
  },
  {
    id: 'bird_memo',
    condition: (s) => (s.generators.bird?.owned || 0) >= 5,
    type: 'fun',
    text: 'HR Memo: The Drinking Birds have unionized. Just kidding—they are plastic. Keep pressing!'
  },
  {
    id: 'pod_eerie',
    condition: (s) => (s.generators.pod?.owned || 0) >= 1,
    type: 'eerie',
    text: 'Memo: Please ignore the faint chanting from Call-Center Pod B. It helps them stay synchronized.'
  },
  {
    id: 'sublevel_eerie',
    condition: (s) => (s.generators.sublevel?.owned || 0) >= 1,
    type: 'eerie',
    text: 'The elevator doesn’t list Sub-Level 3, yet the power meter down there is drawing 400 amps.'
  },
  {
    id: 'sinister_reveal',
    condition: (s) => s.completedResearch.includes('res_compliance'),
    type: 'sinister',
    text: 'DECODED: "Dollars" are a UI abstraction. Every press feeds kinetic compliance into the chamber below. ButtonCorp™ is a containment rig—and you are the operator.'
  },
  {
    id: 'conduit_sinister',
    condition: (s) => (s.generators.conduit?.owned || 0) >= 1,
    type: 'sinister',
    text: 'The Conduit is humming. Something beneath the concrete just pressed back.'
  },
  {
    id: 'tier_resonance',
    condition: (s) => (s.generators.resonance?.owned || 0) >= 1,
    type: 'sinister',
    text: 'The Resonance Arrays aren’t generating power. They are matching a frequency already present in the bedrock.'
  },
  {
    id: 'tier_archive',
    condition: (s) => (s.generators.archive?.owned || 0) >= 1,
    type: 'sinister',
    text: 'Every employee’s memories of their first day at ButtonCorp™ are identical, down to the smudge on the breakroom napkin.'
  },
  {
    id: 'tier_rift',
    condition: (s) => (s.generators.rift?.owned || 0) >= 1,
    type: 'sinister',
    text: 'Sub-Level 9 has no ceiling and no floor. Only the Button, suspended in the dark.'
  },
  {
    id: 'tier_board',
    condition: (s) => (s.generators.board?.owned || 0) >= 1,
    type: 'sinister',
    text: 'The Board has reviewed your compliance metrics. The Board has always been here. The Board is pleased.'
  },
  {
    id: 'restructure_2',
    condition: (s) => s.restructures >= 2,
    type: 'sinister',
    text: 'HR Note: Your badge photo updated itself overnight. You don’t remember posing in a subterranean stairwell.'
  },
  {
    id: 'restructure_3',
    condition: (s) => s.restructures >= 3,
    type: 'sinister',
    text: 'Shift Log #3: The desk chair still holds your posture, even when you swear this is your first day.'
  },
  {
    id: 'restructure_5',
    condition: (s) => s.restructures >= 5,
    type: 'sinister',
    text: 'Personnel File Redacted: There is no exit stairwell on Floor 1. There never was.'
  },
  {
    id: 'anomaly_first',
    condition: (s) => (s.anomaliesCaught || 0) >= 1,
    type: 'eerie',
    text: 'Intercepted Memo: "DO NOT READ THE REDACTED LINES." The ink was still wet.'
  },
  {
    id: 'anomaly_five',
    condition: (s) => (s.anomaliesCaught || 0) >= 5,
    type: 'sinister',
    text: 'Containment Note: The leaks aren’t errors in the terminal. Something is trying to pass notes up the shaft.'
  },
  {
    id: 'cosmic_audit_done',
    condition: (s) => s.completedResearch.includes('res_cosmic_audit'),
    type: 'sinister',
    text: 'FINAL AUDIT COMPLETE: The quota is infinite, the containment is mutual, and the button will never stop.'
  },
  {
    id: 'td_unlocked',
    condition: (s) => Array.isArray(s.unlockedFloors) && s.unlockedFloors.includes('td'),
    type: 'system',
    text: 'Elevator clearance granted for B2: Security Perimeter. Automated turrets are standing by to hold the line.'
  },
  {
    id: 'td_boss_5',
    condition: (s) => (s.td?.highestWave || 0) >= 5,
    type: 'sinister',
    text: 'Security Log: The Rogue AI breach on Wave 5 wasn’t external. Its signature originated from Sub-Level 9.'
  }
];

export const FLOORS = [
  {
    id: 'desk',
    code: '1F',
    name: 'DESK',
    label: '1F: DESK',
    title: 'Executive Desk',
    unlockHint: 'Core Button Station, Operations, Upgrades & R&D'
  },
  {
    id: 'td',
    code: 'B2',
    name: 'SECURITY',
    label: 'B2: SECURITY',
    title: 'Security Perimeter',
    unlockHint: 'Idle Tower Defense — Unlock via Boardroom Skill Tree'
  },
  {
    id: 'rpg',
    code: 'B4',
    name: 'FIELD OPS',
    label: 'B4: FIELD OPS',
    title: 'Field Ops',
    unlockHint: 'Squad Auto-Battler & Artifacts — Unlock via Boardroom Skill Tree (M4)'
  },
  {
    id: 'merge',
    code: 'B6',
    name: 'FORGE',
    label: 'B6: FORGE',
    title: 'Synthesis Forge',
    unlockHint: 'Actuator Merge Grid — Unlock via Boardroom Skill Tree (M5)'
  }
];
