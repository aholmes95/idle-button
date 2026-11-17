# Explorer 2 Handoff: M1 UI & Visual Overhaul (`idle-button`)

## Overview
This handoff specifies the exact HTML, CSS, and DOM/UI module contracts for Milestone M1 of ButtonCorp™ (`idle-button`):
1. **Layout & Responsiveness** (wider `.app-shell`, sticky `.left-column` on desktop, clean mobile fallback).
2. **Button Station & Card Visual Polish** (SVG charge/pulse ring, sharper `.currency-card`, cleaner Division/Upgrade/R&D cards with badges).
3. **Collapsible "Owned / Completed" Drawers** (`<details>` drawers in Upgrades and R&D Lab).
4. **Facility Elevator / Portal Bar & Floor Containers** (`1F: DESK`, `B2: SECURITY`, `B4: FIELD OPS`, `B6: FORGE` + `#floor-td`, `#floor-rpg`, `#floor-merge`).
5. **In-App Modals** (`#modal-reset`, `#modal-save`, `#modal-offline`).
6. **Sinister Theme (`body.is-sinister`)** coverage across all new and existing components.

---

## 1. `index.html` Structure & Exact IDs

### 1.1 Top Bar (`#top-bar`)
Add a `SAVE` button inside `.top-controls` (`index.html` lines 28–31) to open the Export/Import modal:
```html
<div class="top-controls">
  <button class="icon-btn mono" id="btn-save-modal" type="button">SAVE</button>
  <button class="icon-btn mono" id="btn-sound" type="button">AUDIO: ON</button>
  <button class="icon-btn mono" id="btn-reset" type="button">RESET</button>
</div>
```

### 1.2 Facility Elevator / Portal Bar (`#elevator-bar`)
Insert directly after `</header>` (`#top-bar`) and before `<main class="workspace" id="workspace">`. Hidden at Phase 0 (`is-hidden`), shown when `state.phase >= 1`:
```html
<nav class="elevator-bar is-hidden" id="elevator-bar" aria-label="Facility Floors">
  <button class="elevator-btn mono active" type="button" data-floor="desk" id="floor-btn-desk"
    title="1F: Executive Desk — Core Button Station, Operations, Upgrades & R&D">
    <span class="floor-code">1F</span>
    <span class="floor-name">DESK</span>
  </button>
  <button class="elevator-btn mono is-locked" type="button" data-floor="td" id="floor-btn-td"
    title="B2: Security Perimeter (Locked) — Idle Tower Defense. Unlock via Boardroom Tree."
    aria-disabled="true">
    <span class="floor-code">B2</span>
    <span class="floor-name">SECURITY</span>
    <span class="floor-lock" aria-hidden="true">LOCKED</span>
  </button>
  <button class="elevator-btn mono is-locked" type="button" data-floor="rpg" id="floor-btn-rpg"
    title="B4: Field Ops (Locked) — Squad Auto-Battler & Artifacts. Unlock via Boardroom Tree."
    aria-disabled="true">
    <span class="floor-code">B4</span>
    <span class="floor-name">FIELD OPS</span>
    <span class="floor-lock" aria-hidden="true">LOCKED</span>
  </button>
  <button class="elevator-btn mono is-locked" type="button" data-floor="merge" id="floor-btn-merge"
    title="B6: Synthesis Forge (Locked) — Actuator Merge Grid. Unlock via Boardroom Tree."
    aria-disabled="true">
    <span class="floor-code">B6</span>
    <span class="floor-name">FORGE</span>
    <span class="floor-lock" aria-hidden="true">LOCKED</span>
  </button>
</nav>
```

### 1.3 Button Housing SVG Ring (`#button-housing`)
Inside `.button-housing` (`index.html` lines 48–59), add an SVG charge/pulse ring behind `.main-button`:
```html
<div class="button-housing" id="button-housing">
  <div class="housing-screws" aria-hidden="true">
    <span></span><span></span><span></span><span></span>
  </div>
  <svg class="button-charge-ring" viewBox="0 0 180 180" aria-hidden="true">
    <circle class="ring-track" cx="90" cy="90" r="80" />
    <circle class="ring-fill" id="button-ring-fill" cx="90" cy="90" r="80" />
  </svg>
  <button class="main-button" id="main-button" type="button" aria-label="Press button">
    <span class="button-cap">
      <span class="button-label mono" id="button-label">PRESS</span>
      <span class="button-sub mono is-hidden" id="button-sub">+$1.00</span>
    </span>
  </button>
  <div class="floating-layer" id="floating-layer" aria-hidden="true"></div>
</div>
```
- `r="80"` gives circumference `2 * Math.PI * 80 ≈ 502.65`.
- On click, JS can increment a short-lived charge/combo meter or trigger a CSS `.is-pulsing` class on `#button-housing` (auto-removed after 220ms) and advance `stroke-dashoffset` on `#button-ring-fill` (e.g., 0–100% charge per 10 presses or decaying smoothly in `tick()`).

### 1.4 Collapsible Drawers in Upgrades & R&D Panels
In `#panel-upgrades` (`index.html` lines 108–119):
```html
<div class="upgrades-sections">
  <div class="upgrade-group-label mono">MANAGERS &amp; AUTOMATION</div>
  <div class="upgrades-grid" id="managers-list"></div>
  <div class="upgrade-group-label mono">EQUIPMENT &amp; SYNERGY</div>
  <div class="upgrades-grid" id="upgrades-list"></div>

  <details class="owned-drawer is-hidden" id="upgrades-owned-drawer">
    <summary class="drawer-summary mono">
      <span>OWNED UPGRADES &amp; MANAGERS (<span id="upgrades-owned-count">0</span>)</span>
      <span class="drawer-chevron" aria-hidden="true">▾</span>
    </summary>
    <div class="upgrades-grid drawer-content" id="upgrades-owned-list"></div>
  </details>
</div>
```

In `#panel-research` (`index.html` lines 122–131):
```html
<div class="research-list" id="research-list"></div>
<details class="owned-drawer is-hidden" id="research-completed-drawer">
  <summary class="drawer-summary mono">
    <span>COMPLETED PROJECTS (<span id="research-completed-count">0</span>)</span>
    <span class="drawer-chevron" aria-hidden="true">▾</span>
  </summary>
  <div class="research-list drawer-content" id="research-completed-list"></div>
</details>
```

### 1.5 Floor Mount Containers (`#floor-td`, `#floor-rpg`, `#floor-merge`)
Place inside `.app-shell` directly after `</main>` (`#workspace`):
```html
<section class="floor-container is-hidden" id="floor-td" data-floor-panel="td" aria-label="Floor B2: Security Perimeter">
  <div class="floor-placeholder">
    <div class="floor-placeholder-badge mono">B2 // SECURITY PERIMETER</div>
    <h2 class="floor-placeholder-title">Containment Perimeter Offline</h2>
    <p class="floor-placeholder-desc">Automated turret grid and breach defense systems are scheduled for Milestone M3. Unlock access via the Boardroom Skill Tree.</p>
    <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
  </div>
</section>

<section class="floor-container is-hidden" id="floor-rpg" data-floor-panel="rpg" aria-label="Floor B4: Field Ops">
  <div class="floor-placeholder">
    <div class="floor-placeholder-badge mono">B4 // FIELD OPS</div>
    <h2 class="floor-placeholder-title">Field Ops Dispatch Offline</h2>
    <p class="floor-placeholder-desc">Operative squad deployment and artifact recovery sectors are scheduled for Milestone M4. Unlock access via the Boardroom Skill Tree.</p>
    <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
  </div>
</section>

<section class="floor-container is-hidden" id="floor-merge" data-floor-panel="merge" aria-label="Floor B6: Synthesis Forge">
  <div class="floor-placeholder">
    <div class="floor-placeholder-badge mono">B6 // SYNTHESIS FORGE</div>
    <h2 class="floor-placeholder-title">Synthesis Forge Offline</h2>
    <p class="floor-placeholder-desc">Actuator core synthesis matrix and catalyst forging are scheduled for Milestone M5. Unlock access via the Boardroom Skill Tree.</p>
    <button class="icon-btn mono floor-return-btn" type="button" data-return-desk>RETURN TO 1F: DESK</button>
  </div>
</section>
```

### 1.6 In-App Modals (outside `.app-shell`, before `<script>`)
```html
<!-- Reset Confirmation Modal -->
<div class="modal-backdrop is-hidden" id="modal-reset" role="dialog" aria-modal="true" aria-labelledby="modal-reset-title">
  <div class="modal-card">
    <div class="modal-header">
      <span class="modal-title mono" id="modal-reset-title">CONFIRM HARD RESET</span>
      <button class="modal-close mono" type="button" data-close-modal="modal-reset" aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <p>Reset all ButtonCorp™ progress, divisions, research, and Executive Shares? This action cannot be undone.</p>
    </div>
    <div class="modal-actions">
      <button class="icon-btn mono" id="btn-reset-cancel" type="button" data-close-modal="modal-reset">CANCEL</button>
      <button class="btn-danger mono" id="btn-reset-confirm" type="button">WIPE ALL DATA</button>
    </div>
  </div>
</div>

<!-- Save Export / Import Modal -->
<div class="modal-backdrop is-hidden" id="modal-save" role="dialog" aria-modal="true" aria-labelledby="modal-save-title">
  <div class="modal-card modal-card-wide">
    <div class="modal-header">
      <span class="modal-title mono" id="modal-save-title">SAVE DATA // EXPORT &amp; IMPORT</span>
      <button class="modal-close mono" type="button" data-close-modal="modal-save" aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <label class="modal-label mono" for="save-export-text">EXPORT SAVE STRING</label>
      <textarea class="modal-textarea mono" id="save-export-text" rows="3" readonly></textarea>
      <div class="modal-inline-actions">
        <button class="icon-btn mono" id="btn-save-copy" type="button">COPY TO CLIPBOARD</button>
        <span class="modal-status mono" id="save-copy-status"></span>
      </div>

      <label class="modal-label mono" for="save-import-text">IMPORT SAVE STRING</label>
      <textarea class="modal-textarea mono" id="save-import-text" rows="3" placeholder="Paste exported save string here..."></textarea>
      <div class="modal-inline-actions">
        <button class="btn-accent mono" id="btn-save-import" type="button">IMPORT &amp; LOAD</button>
        <span class="modal-status mono" id="save-import-status"></span>
      </div>
    </div>
  </div>
</div>

<!-- Offline Shift Summary Modal -->
<div class="modal-backdrop is-hidden" id="modal-offline" role="dialog" aria-modal="true" aria-labelledby="modal-offline-title">
  <div class="modal-card">
    <div class="modal-header">
      <span class="modal-title mono" id="modal-offline-title">OFFLINE SHIFT SUMMARY</span>
      <button class="modal-close mono" type="button" data-close-modal="modal-offline" aria-label="Close">×</button>
    </div>
    <div class="modal-body" id="offline-summary-body">
      <!-- Populated dynamically by ui.js -->
    </div>
    <div class="modal-actions">
      <button class="btn-accent mono" id="btn-offline-close" type="button" data-close-modal="modal-offline">RESUME SHIFT</button>
    </div>
  </div>
</div>
```

---

## 2. `styles.css` Design Specifications

### 2.1 Layout & Sticky Left Column
- **`.app-shell`** (`styles.css:64-71`):
  - Change `max-width: 1220px` → `max-width: 1400px;`
- **`.workspace.has-console`** (`styles.css:162-166`):
  - `grid-template-columns: minmax(320px, 380px) 1fr;`
  - `gap: 28px; align-items: start; justify-items: stretch;`
- **Sticky `.left-column`** (only when console is active so Phase 0 stays centered):
  ```css
  .workspace.has-console .left-column {
    position: sticky;
    top: 18px;
    align-self: start;
  }
  ```
- **Responsive `@media (max-width: 860px)`** (`styles.css:737-739`):
  ```css
  @media (max-width: 860px) {
    .app-shell { padding: 14px 14px 28px; }
    .top-bar { flex-wrap: wrap; gap: 10px; }
    .workspace.has-console { grid-template-columns: 1fr; }
    .workspace.has-console .left-column { position: static; top: auto; }
  }
  ```

### 2.2 Button Station, Charge Ring & Currency Card Polish
- **`.currency-card`**:
  - Give it a subtle surface container when console is active or always clean padding:
    `width: 100%; padding: 14px 16px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--radius-md);`
  - `.currency-value`: `text-shadow: 0 2px 12px rgba(0,0,0,0.45);` and in `body.is-sinister .currency-value`: `text-shadow: 0 0 18px rgba(224, 82, 82, 0.25);`
  - `.currency-rates`: `flex-wrap: wrap; justify-content: center; padding-top: 4px; border-top: 1px solid var(--border-hairline); width: 100%;`
- **`.button-charge-ring`**:
  ```css
  .button-charge-ring {
    position: absolute;
    inset: 14px;
    width: calc(100% - 28px);
    height: calc(100% - 28px);
    transform: rotate(-90deg);
    pointer-events: none;
  }
  .ring-track {
    fill: none;
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 4;
  }
  .ring-fill {
    fill: none;
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 502.65;
    stroke-dashoffset: 502.65;
    transition: stroke-dashoffset 0.14s ease-out, stroke 0.4s ease;
    filter: drop-shadow(0 0 6px var(--accent-glow));
  }
  .button-housing.is-pulsing {
    border-color: var(--accent);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55), 0 0 22px var(--accent-dim), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  ```
- **`.float-delta`**:
  - Add `text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85); will-change: transform, opacity;` and slightly smoother `0.75s` rise (`-48px`).

### 2.3 Division, Upgrade & R&D Card Hierarchy + Badges
- Add reusable `.tier-badge` / `.cat-badge` pills:
  ```css
  .card-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    color: var(--text-secondary);
  }
  .card-badge.is-accent { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
  .card-badge.is-info { border-color: var(--info); color: var(--info); background: var(--info-dim); }
  .card-badge.is-good { border-color: var(--good); color: var(--good); background: var(--good-dim); }
  .card-badge.is-danger { border-color: var(--danger); color: var(--danger); background: var(--danger-dim); }
  ```
- **`.gen-card`**:
  - Add subtle hover border (`transition: border-color 0.15s ease; &:hover { border-color: var(--border-strong); }`).
  - Include tier badge (`T1`, `T2`, ...) next to `.gen-name`.
- **`.upgrade-card`** & **`.research-item`**:
  - Add top row `.card-head` with title + category badge (`MANAGER`, `CLICK`, `DIVISION`, `SYNERGY` for upgrades; `EFFICIENCY`, `CONTAINMENT` for R&D).
  - Keep `.upgrade-card-effect` / `.research-reward` visually distinct as a crisp callout line.

### 2.4 Collapsible Owned/Completed Drawers
```css
.owned-drawer {
  margin-top: 8px;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.18);
}
.drawer-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.drawer-summary::-webkit-details-marker { display: none; }
.drawer-summary:hover { color: var(--text-primary); }
.drawer-chevron { transition: transform 0.18s ease; }
.owned-drawer[open] .drawer-chevron { transform: rotate(180deg); }
.drawer-content { padding: 0 12px 12px; }
```

### 2.5 Elevator / Portal Bar & Floor Containers
```css
.elevator-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
  padding: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}
.elevator-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}
.elevator-btn:hover:not(.is-locked) {
  color: var(--text-primary);
  background: var(--bg-elevated);
}
.elevator-btn.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
}
.elevator-btn.is-locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.floor-code {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hairline);
  font-size: 10px;
}
.elevator-btn.active .floor-code {
  border-color: var(--accent);
}
.floor-lock {
  font-size: 9px;
  color: var(--text-muted);
  border: 1px solid var(--border-hairline);
  padding: 1px 4px;
  border-radius: 3px;
}
.floor-container {
  width: 100%;
  animation: fadeIn 0.25s ease-out;
}
.floor-placeholder {
  padding: 36px 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.floor-placeholder-badge {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--accent);
  padding: 3px 10px;
  border: 1px solid var(--accent);
  background: var(--accent-dim);
  border-radius: 4px;
}
.floor-placeholder-title { margin: 0; font-size: 18px; color: var(--text-primary); }
.floor-placeholder-desc { margin: 0; max-width: 520px; font-size: 13px; color: var(--text-secondary); }
```

### 2.6 Modals
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5, 7, 10, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.modal-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
  overflow: hidden;
  animation: fadeIn 0.18s ease-out;
}
.modal-card-wide { max-width: 560px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-hairline);
  background: rgba(0, 0, 0, 0.2);
}
.modal-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: var(--text-primary); }
.modal-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
}
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary); }
.modal-label { font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted); margin-top: 4px; }
.modal-textarea {
  width: 100%;
  background: var(--bg-void);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 8px 10px;
  font-size: 11px;
  resize: vertical;
}
.modal-inline-actions { display: flex; align-items: center; gap: 10px; }
.modal-status { font-size: 11px; color: var(--good); }
.modal-status.is-error { color: var(--danger); }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-hairline);
}
.btn-accent {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.btn-accent:hover { background: var(--accent-glow); }
.btn-danger {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--danger);
  background: var(--danger-dim);
  color: var(--danger);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
```

### 2.7 Sinister Theme (`body.is-sinister`) Enhancements
`body.is-sinister` already overrides `--bg-void`, `--bg-surface`, `--bg-elevated`, `--border-hairline`, `--border-strong`, `--accent` (`#e05252`), `--accent-dim`, and `--accent-glow`. Because `.elevator-btn.active`, `.ring-fill`, `.btn-accent`, `.floor-placeholder-badge`, `.button-housing.is-pulsing`, and `.card-badge.is-accent` all consume `var(--accent)` / `var(--accent-dim)` / `var(--accent-glow)`, they automatically shift to crimson. Add explicit sinister polish:
- `body.is-sinister .currency-value { text-shadow: 0 0 18px rgba(224, 82, 82, 0.25); }`
- `body.is-sinister .modal-card { border-color: rgba(224, 82, 82, 0.4); }`

---

## 3. `js/ui.js` & `js/game.js` Integration Notes
- **Floor switching (`switchFloor(floorId)`)**:
  - Checks `state.unlockedFloors.includes(floorId)` (for M1, only `'desk'` is unlocked; locked buttons remain disabled/no-op).
  - Toggles `is-hidden` on `#workspace` (`floorId !== 'desk'`) and each `[data-floor-panel]` (`dataset.floorPanel !== floorId`).
  - Updates `.elevator-btn.active` and `.is-locked` / `aria-disabled` based on `state.unlockedFloors`.
- **Button ring pulse**:
  - Track a lightweight UI counter `pressCharge = (pressCharge + 1) % 10` (or `0..1` decaying in `tick()`) and set `#button-ring-fill.style.strokeDashoffset = 502.65 * (1 - charge)`. Toggle `.is-pulsing` on `#button-housing` for 200ms on each press.
- **Drawers**:
  - `renderUpgrades()` appends unowned items to `#managers-list` / `#upgrades-list`, and owned items to `#upgrades-owned-list`. Updates `#upgrades-owned-count` and toggles `is-hidden` on `#upgrades-owned-drawer` when `ownedCount === 0`.
  - `renderResearch()` appends uncompleted (prerequisite-met) projects to `#research-list`, and completed projects to `#research-completed-list`. Updates `#research-completed-count` and toggles `is-hidden` on `#research-completed-drawer` when `completedCount === 0`.
- **Modals**:
  - `openModal(id)` / `closeModal(id)` toggles `is-hidden`. Pressing `Escape` or clicking `.modal-backdrop` directly closes the open modal.
  - `#btn-reset` opens `#modal-reset`; `#btn-reset-confirm` calls `resetAllState()`, re-renders, and closes `#modal-reset`.
  - `#btn-save-modal` populates `#save-export-text` with `exportSave(state)`, clears status text, and opens `#modal-save`.
  - On boot, if `offlineReport` is returned from `loadState()` / offline catch-up (`elapsedSeconds > 60`), populate `#offline-summary-body` and open `#modal-offline`.
