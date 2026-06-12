# Display And Memory Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser resolution detection visibly reliable and conditionally show memory-type selection only for CPUs that support both DDR4 and DDR5.

**Architecture:** Move display classification and CPU memory support into testable data helpers. UI update functions consume those helpers, synchronize hidden selects with visible toggle groups, and expose concise feedback.

**Tech Stack:** JavaScript ES modules, DOM, Node assert smoke tests, Vite

---

### Task 1: Add Failing Behavior Checks

**Files:**
- Modify: `tools/smoke-polish.mjs`
- Modify: `tools/check-parts.mjs`

- [ ] Assert scaled 2560x1440 and 3840x2160 displays classify correctly.
- [ ] Assert representative CPU memory modes are correct.
- [ ] Assert every CPU score key has memory metadata.
- [ ] Run checks and confirm failure before implementation.

### Task 2: Implement Display Detection

**Files:**
- Modify: `src/budget-display.js`
- Modify: `index.html`
- Modify: `src/i18n.js`
- Modify: `src/styles.css`

- [ ] Add physical-dimension estimation and resolution classification helpers.
- [ ] Synchronize the visible resolution toggle and dispatch a change event.
- [ ] Add an accessible feedback element showing the detected estimate.
- [ ] Run smoke checks and confirm display checks pass.

### Task 3: Implement Conditional Memory Choice

**Files:**
- Modify: `src/parts-data.js`
- Modify: `src/memory-compat.js`
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `tools/check-parts.mjs`

- [ ] Add explicit memory mode metadata for every CPU.
- [ ] Hide memory-type choice before CPU selection and for single-type CPUs.
- [ ] Show memory-type choice only for dual-memory CPUs.
- [ ] Keep RAM speeds and visible toggle state synchronized.
- [ ] Run part-map and smoke checks.

### Task 4: Full Verification

- [ ] Run `npm run check-brand`.
- [ ] Run `node tools/check-parts.mjs`.
- [ ] Run `npm run check`.
- [ ] Inspect the final Git diff and report any residual browser-detection limitations.
