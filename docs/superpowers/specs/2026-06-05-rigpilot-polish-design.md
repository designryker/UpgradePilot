# RigPilot Polish Design

## Goal

Make the current RigPilot result flow cleaner, easier to scan, and more confident without redesigning the app or adding major new product areas.

## Scope

- Tighten the result intro and recommendation copy.
- Reduce result-page text density.
- Simplify example and tier recommendation cards.
- Restrict hover effects to controls, links, and clearly interactive elements.
- Rewrite free optimization checks into short, actionable items.
- Add lightweight BIOS guidance only when RAM/platform/upgrade context makes it useful.
- Improve CPU/GPU search matching for common shorthand and older parts.

## Non-Goals

- No new layout system.
- No new framework or dependency.
- No live product recommendation API.
- No large hardware database expansion.

## Approach

The app already has the right structure: a wizard, a result summary, free fixes, validation, and upgrade examples. The polish pass will keep those sections but reduce copy length and visual movement. New behavior will be small and local: alias-based select matching and conditional BIOS checklist items.

## Verification

- Add a small Node smoke test for alias normalization and BIOS recommendation conditions.
- Run the smoke test.
- Run `npm run build`.
