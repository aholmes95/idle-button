# Explorer 2 Handoff Report: Balance, Pacing & Content Gaps

**Core Finding:** ButtonCorp™ currently hits its content ceiling in **~5–10 minutes** because the highest-cost item is `$400,000` (`mgr_conduit`), the entire 5-project R&D tree costs only **475 RP / 63s**, and permanent multipliers stack to **10.8x** (up to **21.6x** with `ab_rush`) before Prestige 1. Meanwhile, `Restructure` uses an additive linear formula (`1 + shares * 0.25`) paired with a `sqrt(totalMoneyRun / 10000)` curve and **zero post-prestige content**, creating severe diminishing returns and no incentive to reset.

---

## 1. Observation

All observations are verified directly from `/home/antigravity/aholmes95/idle-button/js/data.js`, `js/state.js`, and `js/game.js`.

### 1.1 Current Generators, Scaling & ROI (`js/data.js:1-76`)
| ID | Name | Base Cost | Scale (`r`) | Cycle (s) | Base Payout | Base $/s | Base ROI (s) | RP/cycle | Manager Cost | Unlock $ |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `intern` | Coffee-Fueled Intern | $10 | 1.15 | 2.0s | $2 | $1.00 | 10.00s | 0.10 | $50 | $0 |
| `bird` | Drinking Bird | $65 | 1.16 | 3.5s | $12 | $3.43 | 18.96s | 0.35 | $300 | $40 |
| `solenoid` | Solenoid Rig | $380 | 1.17 | 5.0s | $75 | $15.00 | 25.33s | 1.00 | $1,800 | $220 |
| `pod` | Call-Center Pod | $2,400 | 1.18 | 8.0s | $480 | $60.00 | 40.00s | 3.00 | $12,000 | $1,400 |
| `sublevel` | Sub-Level 3 Relay | $16,000 | 1.19 | 12.0s | $3,400 | $283.33 | 56.47s | 8.00 | $65,000 | $9,000 |
| `conduit` | The Conduit | $110,000 | 1.20 | 18.0s | $24,000 | $1,333.33 | 82.50s | 20.00 | $400,000 | $60,000 |

- **Milestones (`js/data.js:76`, `js/game.js:102-108`)**: `MILESTONES = [10, 25, 50, 100, 200]`, each granting `2x` payout (max `32x` per generator).
- **Bulk Cost (`js/game.js:161-166`)**: Geometric series `first * ((r^count - 1) / (r - 1))`. At `r = 1.20` (Conduit), 10 units cost `$2,855,455`, 25 cost `$51.92M`, 50 cost `$5.00B`.

### 1.2 Click Power & Multipliers (`js/data.js:87-96`, `js/game.js:81-159`)
- **Base click (`js/game.js:148-159`)**:
  `base = (1 + (upg_keycap ? 1 : 0)) * (upg_espresso ? 2 : 1) * (res_ergonomics ? 1.5 : 1) * getShareMultiplier() * (ab_rush ? 2 : 1) * (ab_syphon ? 3 : 1) + (upg_tether ? 0.02 * passiveRate : 0)`
- **Global division multiplier (`js/game.js:86-94`)**:
  `getShareMultiplier() * 1.5 (upg_synergy, $1.2K) * 2 (upg_compliance, $25K) * 1.5 (res_acoustics, 55 RP) * 2 (res_compliance, 130 RP) * 2 (ab_rush)`
  - Permanent global payout multiplier (pre-prestige): `1.5 * 2 * 1.5 * 2 = 9.0x`.
  - Speed multiplier (`js/game.js:96-100`): `1.2x` (`res_workflow`, 22 RP).
  - Effective permanent throughput multiplier: `9.0 * 1.2 = 10.8x` (or `21.6x` during `ab_rush`).
- **Highest-cost upgrade**: `upg_tether` at **$150,000** (`js/data.js:95`).
- **Highest-cost manager**: `mgr_conduit` at **$400,000** (`js/data.js:84`).

### 1.3 R&D & Active Protocols (`js/data.js:98-171`)
- **5 Research Projects total**:
  1. `res_ergonomics` (8 RP, 5s)
  2. `res_workflow` (22 RP, 8s)
  3. `res_acoustics` (55 RP, 12s)
  4. `res_compliance` (130 RP, 16s) — unlocks Restructure & sinister phase
  5. `res_vessel` (260 RP, 22s) — unlocks Deep Syphon & 2x Share bonus
- **Total R&D cost**: `8 + 22 + 55 + 130 + 260 = 475 RP`, **63 seconds** total research time.
- **3 Active Protocols**: `ab_rush` (2x all for 15s / 35s CD), `ab_surge` (instant 15s passive income / 45s CD), `ab_syphon` (3x click & 2x RP for 20s / 60s CD).

### 1.4 Prestige / Restructure (`js/game.js:81-84`, `346-374`, `js/state.js:3-38`)
- **Pending Shares (`js/game.js:346-349`)**:
  `if (state.totalMoneyRun < 10000) return 0; return Math.floor(Math.sqrt(state.totalMoneyRun / 10000));`
- **Share Multiplier (`js/game.js:81-84`)**:
  `const perShare = hasResearch('res_vessel') ? 0.5 : 0.25; return 1 + state.shares * perShare;`
- **Preserved on Restructure (`js/game.js:355-363`)**: Only `shares`, `restructures`, `totalMoneyAllTime`, `sinisterRevealed`, `soundEnabled`. All generators, managers, upgrades, and **all completed research (including `res_vessel`)** are wiped.

### 1.5 Missing Systems (`js/state.js`, `js/game.js`)
- **Offline Progress**: `state.lastTick` is saved (`js/state.js:36`, `js/game.js:798,855`), but **never read on boot** to award offline earnings or research progress.
- **Number Formatting (`js/game.js:63-67`)**: `fmtMoney` only handles up to `B` (`1e9`); numbers at `1e12+` (Trillions, Quadrillions, etc.) display as `1000000.00B`.
- **No Achievements, No Golden/Anomaly Events, No Prestige Skill Tree, No Cross-Generator Synergies.**

---

## 2. Logic Chain: Why Progression Collapses

1. **Rapid End-State (~5–10 Minutes)**:
   - Early game (`$0`–`$16K`) has tight, fun ROI (10s–40s). Once the player reaches `sublevel` ($16K, 8 RP/cycle) and `conduit` ($110K, 20 RP/cycle), passive RP jumps to `~2.5–5.0 RP/sec` (`(8/12 + 20/18) * 1.2 = 2.13 RP/s` with just 1 of each, `4.26 RP/s` during `ab_syphon`).
   - Thus the entire 475 RP tech tree finishes in **<3 minutes** after unlocking Sublevel/Conduit.
   - Simultaneously, 10 Conduits (`$2.85M`) with permanent `10.8x` + `2x` milestone produce `1,333.33 * 10 * 10.8 * 2 = $288,000/sec`. With `ab_rush` (`2x`) + `ab_surge` (15s burst = `$8.64M` in one click), the player crosses `$10M+` within ~2 minutes of buying their first Conduit—having already bought every upgrade (`max $150K`), every manager (`max $400K`), and every research project.

2. **Why Restructure Has No Incentive**:
   - **Diminishing relative gain**: `1 + 0.25 * S` is linear. Going `0 → 10 Shares` ($1M run) gives `3.5x` (`+250%`), `10 → 20 Shares` gives `6.0x / 3.5x = 1.71x`, and `50 → 60 Shares` gives `16.0x / 13.5x = 1.18x`—while `sqrt(totalMoneyRun / 10000)` requires **100x more money for 10x more Shares** (`$1M` = 10, `$100M` = 100, `$10B` = 1000).
   - **Perverse regression on reset**: Because `res_vessel` is wiped on Restructure (`js/game.js:362`), your Share bonus *halves* from `+50%/share` to `+25%/share` at the start of Run 2 until you re-research all 5 R&D projects.
   - **Zero new content**: Run 2 has the exact same 6 generators, 8 upgrades, and 5 R&D projects. There is nothing new to unlock at `$10M`, `$1B`, `$1T`, or Prestige 2/3/5+.

---

## 3. Caveats

- **UI/CSS & Audio not audited here**: Explorer 1 handles UI/layout/visuals; this report focuses on math, state schema, data structures, and progression systems.
- **Standalone artifact sync**: Per `ORIGINAL_REQUEST.md`, `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html` must stay in sync with any `js/` changes.
- **Future Minigames (TD / Combat / Merge)**: User requested these *"at some point later on"* via portals or factory floors; this proposal includes concrete **hook points** (Floor Unlocks in the Boardroom Tree + `unlockedFloors` state) without bloating the immediate core loop.

---

## 4. Conclusion: Concrete Progression & Content Expansion

### 4.1 Multi-Prestige Scaling & Shares Formula
Replace the flat single-tier prestige with a **2-part prestige economy**:
1. **Prestige Currency — `Executive Shares` (Spendable + Passive)**:
   - **Formula**: Lower entry threshold slightly or keep `$25,000` minimum, and scale with a smoother exponent:
     `pendingShares(runMoney) = runMoney < 25000 ? 0 : Math.floor(Math.pow(runMoney / 25000, 0.42))`
     *(Comparison: `$100K` → 1, `$1M` → 4, `$10M` → 12, `$1B` → 85, `$1T` → 1,550. Prevents runaway numbers while rewarding pushing further.)*
   - **Passive Bonus**: Track `lifetimeShares` (never decreases when spending Shares in the Boardroom!).
     Each `lifetimeShare` grants **+15% base** (upgradable via Boardroom perks) **multiplied by** `1 + 0.25 * restructures` (so Prestige 1, 2, 3, 5+ each scale multiplicatively!).
   - **Spendable Shares (`shares`)**: Spent on the **Boardroom Skill Tree** (`js/data.js` → `BOARDROOM_PERKS`).
2. **Pacing Targets per Prestige**:
   - **Run 0 (First Run)**: ~12–18 min to first Restructure (`~$250K–$1M`, 3–5 Shares). Unlocks Tier 1–7 generators, R&D Branch A, first Anomaly events.
   - **Prestige 1–2**: ~15–25 min runs reaching `$100M–$10B` (15–40 Shares). Unlocks Tier 8 generator, starting cash & auto-Interns, Achievement multipliers, R&D Branch B.
   - **Prestige 3–4**: Reaches `$1T–$1Qa` (100–500 Shares). Unlocks Tier 9–10 generators, auto-buyers, Floor Portals (Sub-Level Defense / Containment Arena / Synthesis Grid teasers).
   - **Prestige 5+**: Deep scaling (`$1Qi+`), endless milestones (`300`, `500`, `1000`), and full multi-floor synergy.

### 4.2 Boardroom Skill Tree (Prestige Perks)
Add `boardroomPerks: []` to `state.js` (preserved across Restructures). Organize into 4 categories:

| ID | Name | Cost (Shares) | Req | Effect |
|---|---|---|---|---|
| `perk_golden_parachute` | Golden Parachute | 1 | — | Start every Restructure with `$500` & `phase = 2` unlocked |
| `perk_severance` | Severance Package | 2 | `perk_golden_parachute` | Start with `10x` Interns & `Shift Lead` auto-hired |
| `perk_insider_trading` | Insider Trading | 3 | — | `+15%` per Share (additive to base Share power) & keep `res_vessel` permanent |
| `perk_fast_track` | Executive Fast-Track | 4 | `perk_insider_trading` | All R&D durations `-40%` and RP gain `+50%` |
| `perk_bulk_discount` | Creative Accounting | 5 | `perk_severance` | All generator costs `-10%` & click power `+1%` of $/sec permanently |
| `perk_auto_mgr` | HR Algorithm | 8 | `perk_bulk_discount` | Automatically hires Managers as soon as you can afford them |
| `perk_anomaly_attractor` | Reality Leak | 6 | `perk_fast_track` | Anomaly / Memo events spawn `2x` more often with `+50%` duration |
| `perk_offline_rig` | Night Shift Protocol | 5 | `perk_golden_parachute` | Offline earnings increased from `25%` to `75%` (up to 12h) |
| `perk_synergy_core` | Synergistic Restructuring | 12 | `perk_auto_mgr` | Each Restructure completed grants a multiplicative `1.5x` global bonus |
| `perk_floor_defense` | Unlock: Sub-Level 4 (Defense) | 15 | `perk_synergy_core` | Opens portal hook for future **Idle Tower Defense** floor (`unlockedFloors.push('defense')`) |
| `perk_floor_arena` | Unlock: Containment Pit (Combat) | 30 | `perk_floor_defense` | Opens portal hook for future **Enemy Battling** floor (`unlockedFloors.push('arena')`) |
| `perk_floor_merge` | Unlock: Synthesis Lab (Merge) | 60 | `perk_floor_arena` | Opens portal hook for future **Merge** floor (`unlockedFloors.push('merge')`) |

### 4.3 Expanded Content Blueprint

#### A. Number Formatting (`fmtMoney` in `js/game.js`)
Extend `fmtMoney` with standard suffixes: `['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']` (for `>= 1e6` use `M`, `B`, `T`, `Qa`, `Qi`, etc.) so late-game scaling remains readable.

#### B. 4 New Generator Tiers (10 Total, `js/data.js`)
Keep Tiers 1–6 (adjusting `conduit` slightly or keeping it as the Prestige 0/1 bridge) and add Tiers 7–10 for multi-prestige scaling:

| Tier | ID | Name | Base Cost | Scale | Cycle | Base Payout | RP/cycle | Manager Cost | Unlock $ |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| 7 | `resonance` | Resonance Array | $1.2M | 1.21 | 25s | $220K | 60 | $4.5M | $600K |
| 8 | `archive` | Mnemonic Archive | $18M | 1.22 | 35s | $3.2M | 180 | $65M | $9M |
| 9 | `rift` | Borehole Singularity | $300M | 1.23 | 48s | $52M | 550 | $1.1B | $150M |
| 10 | `board` | The Board | $6.5B | 1.25 | 65s | $1.1B | 1,800 | $25B | $3B |

**Expanded Milestones**: `MILESTONES = [10, 25, 50, 100, 150, 200, 300, 500]` (with `2x` at 10/25/50/100, `3x` at 150/200, `4x` at 300/500) so pushing high unit counts remains rewarding in Prestige 3+.

#### C. Expanded Upgrades (8 → 24+ Upgrades)
Add **Cross-Division Synergies** and **Late-Game Multipliers** (e.g., in `UPGRADES`):
- **Generator-specific 2x/3x upgrades** for Pod (`$30K`), Sublevel (`$250K`), Conduit (`$2M`), Resonance (`$25M`), Archive (`$400M`), Rift (`$8B`), Board (`$150B`).
- **Click Scaling**: `upg_kinetic_grid` (`$5M`, `+3% $/sec per click`), `upg_neural_link` (`$500M`, `+5% $/sec per click` + clicks grant `0.5 RP`).
- **Cross-Synergies**:
  - `upg_intern_conduit` ("Middle Management Sacrifice", `$500K`): Each Conduit boosts Intern payout by `+25%`.
  - `upg_bird_resonance` ("Harmonic Dipping", `$15M`): Each Drinking Bird boosts Resonance Array by `+5%`.
  - `upg_all_synergy_2` ("Vertical Integration", `$100M`): `3x` all divisions.
  - `upg_all_synergy_3` ("Total Compliance", `$50B`): `5x` all divisions.

#### D. Expanded R&D Lab (5 → 12 Projects, 2 Branches)
- **Branch A — Corporate Efficiency** (continues from `res_workflow`):
  - `res_lean_six` (120 RP, 20s): All divisions `25%` faster.
  - `res_automated_kpi` (450 RP, 30s): Milestones grant `+25%` extra multiplier.
  - `res_quantum_payroll` (2,000 RP, 45s): All payouts `3x`.
- **Branch B — Containment & Anomaly** (branches from `res_compliance`):
  - `res_anomaly_harness` (350 RP, 25s): Unlocks **Anomaly Events** (`2x` reward).
  - `res_protocol_overclock` (900 RP, 35s): Unlocks 4th Active Protocol **"Containment Overclock"** (all cycles run `3x` faster for 12s, 75s CD).
  - `res_deep_bore` (3,500 RP, 50s): Unlocks Tier 9–10 visibility & `2x` RP gain.
  - `res_cosmic_audit` (12,000 RP, 75s): `5x` all output & reveals final narrative arc.

#### E. Achievements System (with Real Bonuses)
Add `achievements: []` (preserved across Restructures) and `ACHIEVEMENTS` array (20+ achievements). Each unlocked achievement grants **+5% multiplicative global output** (compounding: 20 achievements = `1.05^20 = 2.65x`, or +10% additive/tiered).
Categories:
- **Presses**: 100, 1,000, 10,000 clicks
- **Wealth**: `$1K`, `$1M`, `$1B`, `$1T`, `$1Qa` all-time
- **Divisions**: Own 50 Interns, 100 Interns, 1 Conduit, 10 Conduits, 1 Board
- **Restructures**: 1st, 3rd, 5th, 10th Restructure
- **Events & Speed**: Catch 1 / 10 / 50 Golden Memos/Anomalies; Restructure in under 5 minutes.

#### F. Golden / Anomaly Clicker Events
Every `60–120s` (random interval), spawn a floating clickable target on screen for `12s`:
- **Pre-sinister (`sinisterRevealed === false`)**: **"Urgent Executive Memo"** (gold/amber). Effects:
  - *Quarterly Bonus*: Instant `30s` of passive income (min `25x` click).
  - *Caffeine Surge*: `5x` click & `2x` division output for `20s`.
- **Post-sinister (`sinisterRevealed === true`)**: **"Containment Anomaly"** (crimson/glitch). Effects:
  - *Reality Fracture*: `7x` all output for `15s`.
  - *Data Leak*: Instant `+20s` RP + `45s` of passive income.
  - *Rift Echo*: Reduces all Active Protocol cooldowns by `50%`.

#### G. Offline Progress (Fixing `lastTick`)
On boot in `js/game.js`, compute `elapsed = Math.min((Date.now() - state.lastTick) / 1000, maxOfflineSeconds)` (default `4h`, `12h` with `perk_offline_rig`). Award `getPassiveMoneyRate() * elapsed * offlineEfficiency` (`0.25` base, `0.75` with `perk_offline_rig`) and `getPassiveRpRate() * elapsed * offlineEfficiency`, and show a concise "Shift Summary" memo/toast.

#### H. Narrative Beats (Corporate Satire → Cosmic Horror)
Add 8–10 new beats tied to Tiers 7–10, Restructures 2/3/5, and Anomaly clicks:
- *Restructure 2*: `"HR Note: Your badge photo updated itself overnight. You don't remember posing in a subterranean stairwell."`
- *Resonance Array*: `"The Resonance Arrays aren't generating power. They are matching a frequency already present in the bedrock."`
- *Mnemonic Archive*: `"Every employee's memories of their first day at ButtonCorp™ are identical, down to the smudge on the breakroom napkin."`
- *Borehole Singularity*: `"Sub-Level 9 has no ceiling and no floor. Only the Button, suspended in the dark."`
- *The Board*: `"The Board has reviewed your compliance metrics. The Board has always been here. The Board is pleased."`

---

## 5. Verification Method

1. **Inspect existing math**:
   - `js/data.js:1-171` (generators, milestones, upgrades, R&D)
   - `js/game.js:81-166` (multipliers & bulk cost) and `346-374` (Restructure)
   - `js/state.js:1-38` (preserved state keys)
2. **Run progression simulation** (e.g., Node/Python script modeling `GENERATORS`, `UPGRADES`, `RESEARCH_PROJECTS`, `BOARDROOM_PERKS`, and `pendingShares`) to verify:
   - Run 0 reaches `$250K–$1M` (3–5 Shares) in 12–18 minutes of active-idle play.
   - Prestige 1 (`3–5` Shares) meaningfully unlocks `Golden Parachute` / `Insider Trading` and reaches Tier 7–8 (`$10M–$1B`) in ~15–20 minutes.
   - Prestige 3–5 reaches Tier 9–10 (`$1B–$1T+`) and unlocks Floor Portal perks without hitting dead-end walls.
3. **Invalidation condition**: If the implementer changes `baseCost`, `costScale`, or `pendingShares` exponents without re-running the ROI/time-to-prestige check, the target run durations (12–25 min per prestige) will drift.
