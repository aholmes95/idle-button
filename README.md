# Idle Button

An incremental / idle game that begins as a single mechanical button and gradually uncovers a deeper narrative beneath **Unit 04-B**.

## Current Scope (v0.1 — Act I)

- **Phase 0**: Just a button and a balance counter.
- **Phase 1**: System Log awakens as you press, recording initial transmissions.
- **Phase 2**: Hardware & Relays unlock — upgrade press yield and install automated actuators.
- **Phase 3**: Diagnostic Telemetry comes online, tracking presses, yield, and an anomalous depth reading.
- **Phase 4**: Casing inspection reveals what lies beneath the switch and unlocks Resonance.

## Running Locally

Open `index.html` directly via a local static server (required for ES modules):

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Project Structure

- `index.html` — Progressive disclosure UI shell
- `styles.css` — Tactile industrial-mystery styling
- `js/state.js` — `localStorage` persistence & state schema
- `js/upgrades.js` — Hardware upgrades, cost scaling, and yield math
- `js/narrative.js` — Story beats and intercepted transmissions
- `js/audio.js` — Synthesized Web Audio mechanical clicks and chimes
- `js/game.js` — Main loop, unlock progression, and DOM rendering
