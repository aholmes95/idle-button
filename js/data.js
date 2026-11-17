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
  }
];

export const MILESTONES = [10, 25, 50, 100, 200];

export const MANAGERS = [
  { id: 'mgr_intern', name: 'Shift Lead', desc: 'Automates Coffee-Fueled Interns.', cost: 50, targetGen: 'intern' },
  { id: 'mgr_bird', name: 'Desk Supervisor', desc: 'Automates Drinking Birds.', cost: 300, targetGen: 'bird' },
  { id: 'mgr_solenoid', name: 'Maintenance Tech', desc: 'Automates Solenoid Rigs.', cost: 1800, targetGen: 'solenoid' },
  { id: 'mgr_pod', name: 'Floor Overseer', desc: 'Automates Call-Center Pods.', cost: 12000, targetGen: 'pod' },
  { id: 'mgr_sublevel', name: 'Handler 09', desc: 'Automates Sub-Level 3 Relays. Does not blink.', cost: 65000, targetGen: 'sublevel' },
  { id: 'mgr_conduit', name: 'The Listener', desc: 'Automates The Conduit. Keeps the rhythm steady.', cost: 400000, targetGen: 'conduit' }
];

export const UPGRADES = [
  { id: 'upg_keycap', name: 'Ergonomic Keycap', desc: 'Makes pressing feel 40% more executive.', effect: '+$1.00 base click', cost: 25, unlockMoney: 15 },
  { id: 'upg_espresso', name: 'Double-Shot Espresso', desc: 'Jittery fingers, faster quotas.', effect: '2x click power', cost: 90, unlockMoney: 50 },
  { id: 'upg_intern_manual', name: 'Motivational Posters', desc: '"Hang in there!" (Mandatory)', effect: '2x Intern payout', cost: 150, unlockMoney: 80 },
  { id: 'upg_bird_oil', name: 'Synthetic Joint Oil', desc: 'Reduces squeaking by 92%.', effect: '2x Drinking Bird payout', cost: 550, unlockMoney: 300 },
  { id: 'upg_synergy', name: 'Corporate Synergy', desc: 'Nobody knows what it means, but numbers go up.', effect: '1.5x all divisions', cost: 1200, unlockMoney: 700 },
  { id: 'upg_solenoid_amp', name: 'Overvolted Coils', desc: 'Smells faintly of ozone.', effect: '2x Solenoid Rig payout', cost: 4500, unlockMoney: 2200 },
  { id: 'upg_compliance', name: 'Mandatory Overtime', desc: 'Badge readers now only work on entry.', effect: '2x all divisions', cost: 25000, unlockMoney: 12000 },
  { id: 'upg_tether', name: 'Bio-Kinetic Tether', desc: 'Every pulse feeds directly from the floor.', effect: '+2% of $/sec per click', cost: 150000, unlockMoney: 75000 }
];

export const RESEARCH_PROJECTS = [
  {
    id: 'res_ergonomics',
    name: 'Click Ergonomics',
    desc: 'Optimize finger-to-actuator force transfer.',
    reward: 'Unlocks "Synergy Rush" protocol & 1.5x click power',
    rpCost: 8,
    duration: 5,
    requires: null
  },
  {
    id: 'res_workflow',
    name: 'Autonomous Workflow',
    desc: 'Streamline shift handoffs across all button divisions.',
    reward: 'All divisions run 20% faster',
    rpCost: 22,
    duration: 8,
    requires: 'res_ergonomics'
  },
  {
    id: 'res_acoustics',
    name: 'Sub-Floor Acoustics',
    desc: 'Investigate that rhythmic thumping beneath the breakroom.',
    reward: 'Unlocks "Power Surge" protocol & 1.5x all payouts',
    rpCost: 55,
    duration: 12,
    requires: 'res_workflow'
  },
  {
    id: 'res_compliance',
    name: 'Compliance Telemetry',
    desc: 'Decode the actual destination of ButtonCorp™ revenue.',
    reward: 'Reveals Restructure & 2x all payouts',
    rpCost: 130,
    duration: 16,
    requires: 'res_acoustics'
  },
  {
    id: 'res_vessel',
    name: 'Vessel Transfer Protocol',
    desc: 'Prepare the floor for complete cycle resetting.',
    reward: 'Unlocks "Deep Syphon" protocol & 2x Share bonus',
    rpCost: 260,
    duration: 22,
    requires: 'res_compliance'
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
  }
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
  }
];
