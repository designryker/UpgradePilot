# Current-Generation Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Recommended Options budget-aware and current-generation-first without spending the entire upgrade budget on one unbalanced component.

**Architecture:** Add pure recommendation selection helpers to `src/recommendation-helpers.js`. `src/analyze.js` supplies system context and renders the returned products, while `tools/smoke-polish.mjs` verifies representative budgets and prevents regression to fixed legacy cards.

**Tech Stack:** Vanilla JavaScript ES modules, Node assert smoke tests, Vite.

---

### Task 1: Current GPU Recommendation Helper

**Files:**
- Modify: `src/recommendation-helpers.js`
- Test: `tools/smoke-polish.mjs`

- [x] Add failing tests proving a $1500 total budget selects current-generation upper-tier GPUs and weak CPU/PSU systems retain headroom.
- [x] Run `node tools/smoke-polish.mjs` and confirm the helper import fails.
- [x] Implement `getCurrentGpuRecommendations(context)` with budget allocation and balance caps.
- [x] Run `node tools/smoke-polish.mjs` and confirm it passes.

### Task 2: Render Dynamic Current-Generation Cards

**Files:**
- Modify: `src/analyze.js`
- Test: `tools/smoke-polish.mjs`

- [x] Add a failing source assertion rejecting fixed RTX 3060 / RTX 4060 primary cards.
- [x] Replace fixed GPU card branches with `getCurrentGpuRecommendations`.
- [x] Update CPU platform targets to Ryzen 7 9800X3D while preserving AM4 X3D as a drop-in option.
- [x] Run smoke tests and confirm the new behavior passes.

### Task 3: Full Verification

**Files:**
- Verify all modified files

- [x] Run `node tools/check-parts.mjs`.
- [x] Run `npm.cmd run check-brand`.
- [x] Run `git diff --check`.
- [x] Run `npm.cmd run check`.
