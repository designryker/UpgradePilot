# Result Clarity Design

## Goal

Make the result screen easier to understand, reduce repeated technical information, and add a restrained component illustration only when UpgradePilot recommends a desktop CPU or GPU.

## Result Artwork

- Show a brand-neutral line-art GPU when the primary desktop recommendation is GPU.
- Show a brand-neutral line-art CPU when the primary desktop recommendation is CPU.
- Hide the artwork for RAM, PSU, laptop options, and no-upgrade results.
- Use inline SVG so the artwork stays sharp, loads instantly, and follows the existing blue/gray visual system.

## Detailed Analysis

Replace the visible technical stack with three short sections:

1. Why this recommendation
2. Verify before buying
3. Next step

Keep legacy render targets hidden so the existing recommendation engine remains stable during this release-focused change.

## Language And Mobile Polish

- Translate dynamic Virtual PC focus labels instead of showing English labels in Turkish mode.
- Use proper Turkish characters in the visible Virtual PC summary.
- Allow long component summaries to wrap cleanly on narrow screens.

## Verification

- Add automated checks for conditional CPU/GPU artwork.
- Add automated checks for the three-section analysis structure.
- Extend recommendation scenarios to verify artwork visibility by recommendation type.
- Run the full build, smoke checks, parts checks, and recommendation scenarios.
