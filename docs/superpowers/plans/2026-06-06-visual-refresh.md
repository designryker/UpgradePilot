# UpgradePilot Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh UpgradePilot's color system so it feels like a modern technical advisor instead of a neon hacker dashboard.

**Architecture:** Add a focused final CSS override layer that changes effective theme tokens and component states without restructuring existing CSS or touching JavaScript recommendation logic. Add smoke assertions that guard the semantic color hierarchy.

**Tech Stack:** Vanilla CSS, Vite build, Node smoke test script.

---

## File Structure

- Modify: `src/styles.css`
  - Add a final visual refresh layer near the end of the file.
  - Override effective theme tokens, buttons, hover states, result cards, diagnostic states, and virtual PC highlights.
- Modify: `tools/smoke-polish.mjs`
  - Add CSS assertions confirming the refresh uses blue/cyan as the primary accent and green only through success tokens.
- Verify: `npm.cmd run build`
  - Ensure the app still builds after CSS/test changes.

### Task 1: Add Visual Refresh CSS Layer

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add final theme tokens**

Append a final CSS section named `UpgradePilot visual refresh layer` near the end of `src/styles.css`. The section defines:

```css
:root{
  --bg:#0b0f16;
  --surface:#141922;
  --surface2:#1b2230;
  --surface3:#232c3a;
  --border:#303a48;
  --border-soft:rgba(255,255,255,.07);
  --accent:#69a7ff;
  --accent2:#8ed8ff;
  --success:#35d07f;
  --text:#eef2f7;
  --muted:#a1a8b3;
  --danger:#ef6461;
  --warn:#f2a93b;
  --info:#8ed8ff;
  --accent-soft:rgba(105,167,255,.11);
  --accent-border:rgba(105,167,255,.30);
  --accent2-soft:rgba(142,216,255,.10);
  --accent2-border:rgba(142,216,255,.26);
  --success-soft:rgba(53,208,127,.10);
  --success-border:rgba(53,208,127,.28);
}
```

- [ ] **Step 2: Override background and card surfaces**

In the same final layer, set body and core cards to neutral dark surfaces:

```css
body{
  background:
    radial-gradient(circle at 50% -16%,rgba(105,167,255,.11),transparent 34rem),
    radial-gradient(circle at 92% 18%,rgba(142,216,255,.055),transparent 24rem),
    linear-gradient(180deg,#0d1118 0%,#0b0f16 48%,#090c12 100%);
}
.wizard,.r-card,.pc-visual,.loading-card{
  border-color:var(--border-soft);
  background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),rgba(20,25,34,.88);
  box-shadow:0 18px 54px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04);
}
```

- [ ] **Step 3: Override CTAs and neutral interactivity**

Primary buttons use blue/cyan with restrained shadows:

```css
.wizard-btn-primary,.btn,.route-btn-primary{
  background:linear-gradient(180deg,#83bdff 0%,var(--accent) 100%);
  border-color:rgba(105,167,255,.62);
  color:#07111f;
  box-shadow:0 12px 30px rgba(105,167,255,.18);
}
.wizard-btn-primary:hover,.btn:hover,.route-btn-primary:hover{
  box-shadow:0 16px 38px rgba(105,167,255,.22);
}
```

- [ ] **Step 4: Override semantic success, warning, and critical states**

Use success tokens for healthy states and keep warning/critical tokens distinct:

```css
.vb-upgrade,.fb-upgrade,.pv-ok,.cbox.on{
  background:var(--success-soft);
  border-color:var(--success-border);
  color:var(--success);
}
.c-hi,.c-wlo,.c-byes,.score-card .score-num{
  color:var(--success);
}
.vb-maybe,.fb-maybe,.pv-warn,.dp-ram{
  background:rgba(242,169,59,.10);
  border-color:rgba(242,169,59,.30);
  color:var(--warn);
}
.vb-hold,.pv-bad,.dp-psu{
  background:rgba(239,100,97,.10);
  border-color:rgba(239,100,97,.30);
  color:var(--danger);
}
```

- [ ] **Step 5: Override virtual PC and form hover accents**

Generic hover/focus highlights use blue/cyan:

```css
.field[data-pc-part]:hover,
.field[data-pc-part].is-field-hover,
.field[data-pc-part].is-field-active,
.field[data-pc-part].is-active,
.field[data-pc-part]:focus-within{
  border-color:rgba(105,167,255,.36);
  background:
    radial-gradient(circle at calc(100% - 52px) 1.1rem,rgba(105,167,255,.12),transparent 7rem),
    linear-gradient(180deg,rgba(105,167,255,.07),rgba(255,255,255,.018)),
    rgba(28,32,41,.86);
}
.pc-visual[data-active-part="cpu"] .pc-cpu,
.pc-visual[data-active-part="gpu"] .pc-gpu,
.pc-visual[data-active-part="ram"] .pc-ram,
.pc-visual[data-active-part="psu"] .pc-psu,
.pc-visual[data-active-part="system"] .pc-system-zone{
  border-color:rgba(105,167,255,.56);
  background:var(--accent-soft);
  box-shadow:0 0 0 1px rgba(105,167,255,.10),0 0 22px rgba(105,167,255,.12);
}
```

### Task 2: Add Smoke Coverage

**Files:**
- Modify: `tools/smoke-polish.mjs`

- [ ] **Step 1: Add visual refresh assertions**

Add checks after `styleSource` is read:

```js
assert.ok(styleSource.includes('UpgradePilot visual refresh layer'), 'visual refresh CSS layer should be present');
assert.ok(styleSource.includes('--accent:#69a7ff'), 'primary accent should be calm blue, not neon green');
assert.ok(styleSource.includes('--success:#35d07f'), 'success green should be a dedicated semantic token');
assert.ok(styleSource.includes('--success-soft'), 'success states should have their own soft token');
assert.ok(styleSource.includes('background:linear-gradient(180deg,#83bdff 0%,var(--accent) 100%)'), 'primary CTA should use the blue accent');
assert.ok(!/--accent:#00e479/.test(styleSource), 'neon green should not be the final effective accent token');
```

- [ ] **Step 2: Run smoke test**

Run: `node tools/smoke-polish.mjs`

Expected output:

```text
polish smoke checks passed
```

### Task 3: Build Verification

**Files:**
- Verify only.

- [ ] **Step 1: Build the app**

Run: `npm.cmd run build`

Expected output includes:

```text
vite
built
```

- [ ] **Step 2: Review changed files**

Run: `git diff -- src/styles.css tools/smoke-polish.mjs docs/superpowers/specs/2026-06-06-visual-refresh-design.md docs/superpowers/plans/2026-06-06-visual-refresh.md`

Expected: only visual CSS overrides, smoke assertions, and Superpowers docs are changed.

## Self-Review

Spec coverage: The plan covers reduced green usage, neutral dark surfaces, semantic green/amber/red/blue hierarchy, calmer CTAs, result card trust, and no logic changes.

Placeholder scan: No placeholder tasks remain. Every implementation step names exact files, snippets, commands, and expected outputs.

Type consistency: The plan only adds CSS tokens/classes and Node assertions; no JavaScript runtime APIs are introduced.
