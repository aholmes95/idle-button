export const NARRATIVE_BEATS = [
  {
    id: 'wake_up',
    condition: (state) => state.presses >= 5,
    type: 'system',
    text: 'Signal registered. Unit 04-B online. Keep pressing to meet initial quota.'
  },
  {
    id: 'first_ten',
    condition: (state) => state.presses >= 12,
    type: 'narrative',
    text: 'Every actuation sends a pulse down the line. Somewhere, a ledger ticks upward.'
  },
  {
    id: 'unlock_hardware',
    condition: (state) => state.totalMoney >= 15,
    type: 'system',
    text: 'Requisition terminal unlocked. Hardware modules are now available.'
  },
  {
    id: 'first_auto',
    condition: (state) => (state.upgrades.solenoid_arm || 0) >= 1,
    type: 'narrative',
    text: 'The solenoid clicks on its own now. You are no longer the only one pressing.'
  },
  {
    id: 'telemetry_online',
    condition: (state) => state.totalMoney >= 110 || state.presses >= 45,
    type: 'system',
    text: 'Diagnostic telemetry restored. Warning: depth sensor is reporting non-zero values.'
  },
  {
    id: 'subfloor_hum',
    condition: (state) => (state.upgrades.subfloor_relay || 0) >= 1,
    type: 'narrative',
    text: 'The relay draws current from beneath the slab. The floor feels faintly warm.'
  },
  {
    id: 'depth_ten',
    condition: (state) => state.depthMeters >= 12,
    type: 'transmission',
    text: '[INTERCEPT] "...count is climbing. Tell Sector 2 the circuit is still closed..."'
  },
  {
    id: 'casing_available',
    condition: (state) => state.totalMoney >= 420,
    type: 'system',
    text: 'Hairline vibration detected in the button housing. Manual inspection recommended.'
  },
  {
    id: 'casing_opened',
    condition: (state) => state.casingInspected,
    type: 'transmission',
    text: 'Beneath the switch, there is no circuit board—only a vertical shaft and a faint, rhythmic answer to every press. [ACT I COMPLETE — MORE TO UNEARTH]'
  }
];
