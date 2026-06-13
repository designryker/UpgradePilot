# Result Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the result analysis, add conditional CPU/GPU line-art, and fix visible Turkish/mobile presentation bugs.

**Architecture:** Add a focused pure artwork module and keep result rendering decisions in `analyze.js`. Replace the visible deep-analysis markup with three concise sections while retaining hidden legacy targets for compatibility.

**Tech Stack:** Vanilla JavaScript, inline SVG, CSS, Node assertions, jsdom.

---

### Task 1: Conditional Result Artwork

**Files:**
- Create: `src/result-artwork.js`
- Modify: `index.html`
- Modify: `src/analyze.js`
- Test: `tools/recommendation-scenarios.mjs`

- [ ] Add failing assertions for GPU/CPU artwork and hidden non-CPU/GPU artwork.
- [ ] Implement pure CPU/GPU inline SVG render helpers.
- [ ] Render artwork only for desktop CPU/GPU recommendations.
- [ ] Run `npm.cmd run test:recommendations`.

### Task 2: Simplified Detailed Analysis

**Files:**
- Modify: `index.html`
- Modify: `src/analyze.js`
- Modify: `src/styles.css`
- Test: `tools/smoke-polish.mjs`

- [ ] Add failing structure checks for the three visible decision sections.
- [ ] Replace visible technical clutter with Why, Verify, and Next Step sections.
- [ ] Populate concise verification and action lists from the existing diagnosis.
- [ ] Hide compatibility-only legacy render targets.
- [ ] Run smoke and recommendation tests.

### Task 3: Language And Mobile Polish

**Files:**
- Modify: `src/events.js`
- Modify: `src/ui-parts.js`
- Modify: `src/memory-compat.js`
- Modify: `src/i18n.js`
- Modify: `src/styles.css`
- Test: `tools/smoke-polish.mjs`

- [ ] Add checks for translated dynamic focus labels and mobile wrapping.
- [ ] Replace visible ASCII Turkish fallbacks with proper Turkish.
- [ ] Make Virtual PC summary values wrap on narrow screens.
- [ ] Run the full release check.

### Task 4: Final Verification And Commit

**Files:**
- Review all modified files.

- [ ] Run `npm.cmd run check`.
- [ ] Run `node tools/check-parts.mjs`.
- [ ] Run `git diff --check`.
- [ ] Review the final diff for unrelated changes.
- [ ] Commit the completed release polish.
