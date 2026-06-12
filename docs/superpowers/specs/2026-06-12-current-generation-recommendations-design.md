# Current-Generation Recommendations Design

## Goal

Recommended Options should prefer current-generation PC parts when the user's total upgrade budget and system balance justify them. Old parts must not remain the default recommendation merely because the target is 1080p.

## Decision Model

- Treat the entered amount as the total upgrade budget.
- Reserve part of that budget for dependencies such as PSU, CPU/platform balance, and installation headroom.
- Select a current-generation GPU tier from the remaining GPU allocation, target resolution, refresh rate, current GPU score, CPU score, and PSU readiness.
- Keep older parts only as clearly labeled value or drop-in alternatives when they offer a meaningful compatibility advantage.
- For CPU platform upgrades, prefer Ryzen 9000 X3D targets when the budget supports a new platform; retain AM4 X3D only as a drop-in value option.

## UI Behavior

- GPU cards show a current NVIDIA option and a current AMD alternative.
- Recommendation copy explains when the target is capped by CPU or PSU balance.
- A $1500 total upgrade budget must never default to RTX 3060 / RTX 4060.
- Prices remain rough estimates, not live listings.

## Testing

- Pure recommendation helpers cover budget allocation and target selection.
- Smoke checks reject obsolete fixed recommendation strings in the main GPU cards.
- Existing build, brand, parts-data, and smoke checks remain green.
