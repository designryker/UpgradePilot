# UpgradePilot Visual Refresh Design

## Goal

Make UpgradePilot feel more modern, trustworthy, and advisor-like without changing layout, adding features, or touching recommendation logic.

## Scope

This is a focused visual refresh. The implementation should update the effective CSS theme and state colors only. The existing wizard, result sections, analysis flow, translations, and recommendation/scoring logic remain unchanged.

## Color Direction

The global accent moves away from neon green to a calm blue-cyan used for primary actions, focus states, neutral guidance, loading progress, and interactive highlights.

Green becomes a semantic success color only. It remains for healthy/good system states, positive badges, completed checklist indicators, and other explicitly successful outcomes.

Amber is used for warning, bottleneck risk, medium priority, and caution states. Red is used for critical blockers, unsafe/blocked upgrade decisions, and high-risk states.

## Surface Direction

The dark theme should use neutral slate backgrounds, quieter card surfaces, softer borders, and reduced glow. Result cards should read like a serious PC upgrade advisor rather than an RGB dashboard.

## Interaction Direction

Buttons and clickable elements keep subtle hover feedback, but the feedback should be blue/cyan and restrained. Green hover glows should not be used for generic interactivity.

The virtual PC hover/focus system should use blue/cyan as neutral guidance. Green should only appear when the represented state is positive or healthy.

## Non-Goals

Do not redesign the layout. Do not add animations. Do not add new sections. Do not change the analysis sequence timing. Do not change form fields, recommendation logic, scoring, or result data.

## Acceptance Criteria

- Primary buttons no longer use neon green.
- Generic hover/focus states no longer glow green.
- Green is reserved for success/healthy states.
- Amber and red warning/critical states remain visually distinct.
- Result cards use calmer surfaces and clearer visual hierarchy.
- Existing smoke checks and production build pass.
