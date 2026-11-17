# ButtonCorp™ (`idle-button`) — E2E Test Readiness (`TEST_READY.md`)

## 1. Status Summary
- **CDP Harness & Helpers (`tests/e2e/helpers/`)**: **READY** (zero-dependency Node `v24.22.2` + `WebSocket` + `fetch` + `python3 -u -m http.server 0` + `/usr/bin/chromium`).
- **Baseline Smoke (`tests/e2e/baseline-smoke.e2e.test.mjs`)**: **PASSING (6 / 6)** against both `index.html` and standalone `idle_button.html`.
- **4-Tier Spec-Driven Suites (`tests/e2e/tier1..tier4/`)**: **IMPLEMENTED** (126 opaque-box E2E tests across 22 files, syntax-verified, ready to gate Milestones M1–M6).

---

## 2. Test Inventory & Counts

| Suite | Files | Test Cases | Scope |
|---|---:|---:|---|
| `baseline-smoke.e2e.test.mjs` | 1 | 6 | Immediate v0.2 + standalone `idle_button.html` smoke |
| `tier1/` (Feature Coverage) | 11 | 81 | >= 5 opaque-box cases per `PROJECT.md` feature |
| `tier2/` (Boundaries & Corner Cases) | 5 | 37 | Insufficient funds, formatting overflow, migration, locks, rapid input |
| `tier3/` (Cross-Feature Combinations) | 4 | 6 | Prestige+Boardroom, Cross-Floor synergies, Sinister+Anomalies, Protocol stacking |
| `tier4/` (End-to-End Playthroughs) | 2 | 2 | Run 0 -> Restructure 1; Multi-prestige all-floors + Export/Import/Reload |
| **Total** | **23** | **132** | **100% Opaque-Box (no `js/**` imports)** |

### Tier 1 File Breakdown
1. `01-button-and-phases.e2e.test.mjs` — 10 tests
2. `02-generators-managers-buymode.e2e.test.mjs` — 6 tests
3. `03-upgrades-and-drawer.e2e.test.mjs` — 5 tests
4. `04-research-and-protocols.e2e.test.mjs` — 10 tests
5. `05-restructure-and-boardroom.e2e.test.mjs` — 6 tests
6. `06-achievements-and-anomalies.e2e.test.mjs` — 10 tests
7. `07-floor-b2-td.e2e.test.mjs` — 6 tests
8. `08-floor-b4-rpg.e2e.test.mjs` — 6 tests
9. `09-floor-b6-merge.e2e.test.mjs` — 6 tests
10. `10-persistence-audio-modals.e2e.test.mjs` — 11 tests
11. `11-standalone-parity.e2e.test.mjs` — 5 tests

---

## 3. Verification Commands & Baseline Smoke Results

### Baseline Smoke (`node --test tests/e2e/baseline-smoke.e2e.test.mjs`)
- **Result**: **6 / 6 PASS** (`0` failures, `0` skipped, `0` console/page errors)
  1. Initial boot & clean console on `index.html` — PASS
  2. 5-click Phase 1 unlock reveals top-bar, console, and memo feed — PASS
  3. Buy Coffee-Fueled Intern and complete manual cycle payout — PASS
  4. Audio toggle persists to `localStorage` across full reload — PASS
  5. Reset confirmation dialog wipes progress back to Phase 0 — PASS
  6. Standalone `idle_button.html` parity smoke — PASS

### Syntax Check (`find tests/e2e -name '*.mjs' -print0 | xargs -0 -n1 node --check`)
- All 27 `.mjs` files (4 helpers + 23 test files) pass `node --check`.

---

## 4. M1–M6 Readiness Status

| Milestone | Gate Description | Relevant E2E Suites | Readiness |
|---|---|---|---|
| **M1** | Core Architecture, State v3, Modifiers, UI Overhaul & Modals | `baseline-smoke`, `tier1/10`, `tier1/11`, `tier2/02`, `tier2/05` | **READY** |
| **M2** | Multi-Prestige, Boardroom, T7–10, 24+ Upgrades, 12 R&D, Achievements, Anomalies | `tier1/01..06`, `tier2/01`, `tier2/03`, `tier3/01`, `tier3/03`, `tier3/04`, `tier4/01` | **READY** |
| **M3** | Floor B2: Security Perimeter (TD) | `tier1/07`, `tier2/04`, `tier3/02` | **READY** |
| **M4** | Floor B4: Field Ops (RPG) | `tier1/08`, `tier2/04`, `tier3/02` | **READY** |
| **M5** | Floor B6: Synthesis Forge (Merge) | `tier1/09`, `tier2/04`, `tier3/02` | **READY** |
| **M6** | Final Full E2E Pass & Standalone `idle_button.html` Sync | Full `tests/e2e/` suite + `tier4/02` | **READY** |
