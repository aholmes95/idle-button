# E2E Testing Track Orchestrator — Briefing

- **Project**: ButtonCorp™ (`idle-button`) Expansion & UI Overhaul
- **Track**: E2E Testing Track (Opaque-Box, Requirement-Driven)
- **Working Directory**: `/home/antigravity/aholmes95/idle-button`
- **State Folder**: `/home/antigravity/aholmes95/idle-button/.agents/teamwork/e2e_orch`
- **Parent**: `92400dedc922e66f33c790a33b542756` (Project Orchestrator)

## Key Constraints
1. **Do NOT modify any game source files** (`index.html`, `styles.css`, `js/**`, `scripts/**`).
2. **Only create/modify**:
   - `/home/antigravity/aholmes95/idle-button/TEST_INFRA.md`
   - `/home/antigravity/aholmes95/idle-button/TEST_READY.md`
   - `/home/antigravity/aholmes95/idle-button/tests/e2e/**`
3. **Zero external npm dependencies**: Use Node `v24.22.2` (`node:test`, `node:assert`, built-in `WebSocket`/`fetch`), `python3 -m http.server` on an ephemeral free port, and `/usr/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=...`.
4. **Standalone Artifact Parity**: Support testing both the served repo (`index.html`) and `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html`.
5. **4-Tier Opaque-Box E2E Suite** covering all features in `PROJECT.md § Feature Inventory`.
