# UpgradePilot — Session Change Log
**Last updated:** June 2026  
**Status:** ✅ Ready for push — v0.5.0-stable

---

## Summary of all changes this session

### Entry point
- `src/app.js` confirmed as sole entry point (via `index.html` script tag)
- Deprecated monolith moved from `src/main.js` to `deprecated/main.deprecated.js` — not loaded by the app

---

## New files
| File | Purpose |
|---|---|
| `src/result-page.js` | Result dashboard — reads from hidden `#result`, renders into `#rp-dashboard` inside wizard step 4 |
| `src/gpu-detect.js` | WebGL GPU auto-detect — 92 regex patterns, maps browser GPU string to exact `GPU_SCORE` key |

---

## Modified files

### `src/analyze.js`
- Wrapped in `try-catch` — `analyze()` calls `_analyze()`, errors show `showAnalysisError()` UI
- All 5 critical input elements null-checked with `safeEl()`
- `CPU_SCORE[cpuKey]` and `GPU_SCORE[gpuKey]` validated — `undefined` stops analysis with a clear message
- Placeholder/empty select guard: CPU, GPU, RAM required before proceeding
- `result.classList.add('show')` removed — dashboard shown via `showResultPage()` instead
- `showResultPage` imported from `./result-page.js`

### `src/result-page.js` (rewritten)
- No longer a fullscreen overlay — renders inside wizard step 4 as inline dashboard
- `initResultPage()` — wires Edit/Copy/RunAgain buttons
- `showResultPage()` — calls `goToWizardStep(3)`, populates all dashboard sections, animates in
- `hideResultPage()` — hides dashboard, goes to step 0
- Reads data from: `system-score-value`, `main-bottleneck-value`, `uname`, `usub`, `estimated-gain-value`, `upgrade-priority-value`, `confidence-value`, `ft`, `final-box`, `why-box`, `upgrade-path`, `action-plan-list`, `checklist`
- Health bars inferred from bottleneck label + system score
- SVG arc ring animates on show

### `src/styles.css` (full rewrite — cleaned)
- **Before:** 4,265 lines · 104 duplicate selectors · 15 stacked "pass" layers
- **After:** 1,891 lines · 2 duplicates (intentional responsive overrides) · 13 structured sections
- Single `:root` with all 29 CSS variables
- All hover rules consolidated: `.field:hover` → `rgba(105,167,255,.55)` blue border everywhere
- All `@keyframes` in one block, all `@media` queries in one block
- `#result { display: none !important }` — data container always hidden

### `src/ui-parts.js`
- Added `CPU_TIER` / `GPU_TIER` imports
- `updatePartTierBadge(partId)` — shows tier badge below CPU/GPU select on change
- `initTierBadges()` — wires change + search listeners
- `filterSelectOptions()` now calls `updatePartTierBadge()` after match
- `initClickableFields()` — removed `control.click()` for SELECT elements (was causing open/close bug)

### `src/utils.js`
- Added `safeEl(id)` — like `el()` but logs a console error if element missing
- Added `showAnalysisError(message)` — renders recoverable error card inside `#loading-card`

### `src/events.js`
- Added `detectAndApplyGpu` import from `./gpu-detect.js`
- Added `updatePartTierBadge` import from `./ui-parts.js`
- `#gpu-detect-btn` click handler: calls `detectAndApplyGpu`, shows feedback, updates tier badge
- Search input listener calls `updatePartTierBadge` after filtering
- `#result-adjust`, `#result-copy`, `#result-rerun` buttons wired (IDs now in wizard step 4)

### `src/parts-data.js`
- Added `r5_7600x3d: 7` to `CPU_SCORE`
- Added `r5_7600x3d` to `CPU_TIER` (upper-mid, AM5, 3D V-Cache)
- `CPU_TIER` and `CPU_SCORE` fully in sync — 98 CPU / 91 GPU, zero mismatches

### `src/app.js`
- Added `initResultPage()` call in `boot()`
- Added `initTierBadges()` call in `boot()`
- Added `initFieldValueStates()` — accent border on field when value differs from default
- `initResultPage` and `initTierBadges` imported

### `src/reset.js`
- `.has-value` class cleared from all fields on reset

### `src/i18n.js`
- Added EN + TR keys: `versionBadge`, `heroH1`, `heroSub`, `heroCta`, `trustFree`, `trustNoAccount`, `trustNoInstall`, `detectGpu`, `selectCpu`, `selectGpu`, `selectRam`, `selectRamType`, `selectRamSpeed`, `selectChannel`, `selectGoal`, `selectGame`
- `gameDrive` label shortened: `"System / Games Drive"` → `"Game Drive"` / `"Oyun Diski"`

### `index.html`
- Hero section fully rewritten: H1, subtitle, CTA button, trust signals, version badge
- All default `selected` attributes removed from CPU, GPU, RAM, Goal, Game, Resolution, Hz
- Placeholder `disabled selected` options added to each of those selects
- `data-pc-part` added to Resolution, Refresh Rate, CPU Cooling fields (hover sync)
- `#cpu-tier-badge` and `#gpu-tier-badge` divs added below respective selects
- `#gpu-detect-row` + `#gpu-detect-btn` + `#gpu-detect-feedback` added to GPU field
- Result step (data-step="result") completely restructured:
  - Hidden `#result` div — all original data IDs preserved for `analyze.js`
  - New `#rp-dashboard` div — visible inline dashboard

---

## Architecture notes for next agent

**Entry point:** `src/app.js` → boot() → bindEvents() + initWizard() + initResultPage()

**Analysis flow:**
1. User fills wizard steps 1–3
2. "Diagnose" button → `analyze()` → loading animation → `_analyze()`
3. `_analyze()` writes all data to hidden `#result` DOM elements
4. `showResultPage()` → `goToWizardStep(3)` → `populate()` reads `#result` → renders `#rp-dashboard`

**State:** `src/state.js` — mutable globals with setter functions, imported by name

**Scoring:** `src/parts-data.js`
- `CPU_SCORE` / `GPU_SCORE` — integer maps 0–10, used in `analyze.js`
- `CPU_TIER` / `GPU_TIER` — display metadata only, used in `ui-parts.js` for badges
- **Always run cross-check after editing:** `node tools/check-parts.mjs`

**CSS variables:** All in single `:root` block at top of `styles.css`. Accent = `#69a7ff` (blue).

**Language:** `currentLang` in `state.js` · `inTr(en, tr)` for inline strings · `I18N[lang][key]` for i18n strings · `data-i18n` attributes updated by `setLanguage()`

**Do not use `deprecated/main.deprecated.js`** — it is only kept as a reference copy of the old monolith.

---

## Known backlog (v0.6.0)

- [ ] Step 2 form sadeleştirme — 12 field'ı "Core" + "Details (skip)" olarak böl
- [ ] Health bars exact scores — şu an bottleneck label'dan tahmin ediliyor; `analyze.js`'den `lastResult` objesi export edilip doğrudan beslenebilir
- [ ] Timer cancel on reset — analiz yüklenirken reset'e basılınca `analyze(true)` hala tetiklenebilir
- [ ] Free fixes checklist persistence — Run Again'de tiklenenler sıfırlanıyor
- [x] `src/main.js` aktif kaynak ağacından çıkarıldı; referans kopya `deprecated/` altında tutuluyor
