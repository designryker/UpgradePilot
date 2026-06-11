# UpgradePilot Brand Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the former brand everywhere and make UpgradePilot the enforced canonical project name.

**Architecture:** Add a repository-level brand guard, mechanically migrate tracked text and paths, then rename external repository and workspace identifiers. Existing application behavior remains unchanged.

**Tech Stack:** Node.js, Vite, Git, GitHub CLI

---

### Task 1: Add Brand Guard

**Files:**
- Create: `tools/check-brand.mjs`
- Modify: `package.json`

- [ ] Add a check that scans tracked files and filenames case-insensitively.
- [ ] Run it before migration and confirm it fails on former-brand references.
- [ ] Add `check-brand` to the main `check` command.

### Task 2: Migrate Tracked Content And Paths

**Files:**
- Modify: all tracked text files containing the former brand
- Rename: historical documentation filenames containing the former brand

- [ ] Replace former-brand text with `UpgradePilot`.
- [ ] Rename former-brand documentation paths.
- [ ] Run the brand guard and confirm it passes.

### Task 3: Verify And Publish

- [ ] Run part consistency, full check, and Git diff checks.
- [ ] Commit and push the migration.
- [ ] Rename the GitHub repository and update `origin`.
- [ ] Rename the local workspace directory and verify final identifiers.
