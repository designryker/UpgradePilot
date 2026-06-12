# Free Performance Fixes Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace verbose and low-value Free Performance Fixes with concise, diagnosis-relevant actions.

**Architecture:** Keep the existing conditional checklist generator, but rewrite core actions and remove low-value branches. Smoke tests enforce required actions and rejected wording.

**Tech Stack:** JavaScript ES modules, Node assert smoke tests, Vite

---

### Task 1: Lock The Content Contract

**Files:**
- Modify: `tools/smoke-polish.mjs`

- [ ] Require concise startup, power, monitor, and before-gaming actions.
- [ ] Reject temporary-file cleanup and generic heavy-background wording.
- [ ] Run smoke checks and confirm they fail.

### Task 2: Rewrite Free Fixes

**Files:**
- Modify: `src/analyze.js`

- [ ] Replace verbose core Windows actions with concise actions.
- [ ] Separate desktop and laptop power actions.
- [ ] Remove temporary-file cleanup.
- [ ] Shorten conditional GPU, CPU, memory, cooling, and storage actions.
- [ ] Run smoke checks and confirm they pass.

### Task 3: Verify

- [ ] Run brand and part consistency checks.
- [ ] Run production build and smoke checks.
- [ ] Inspect the final diff for unrelated changes.
