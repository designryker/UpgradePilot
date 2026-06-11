# UpgradePilot Brand Migration Design

## Goal

Make UpgradePilot the only project and product name. No tracked source file,
documentation path, local workspace name, or GitHub repository name should
retain the former brand.

## Scope

- Replace every case-insensitive former-brand reference with `UpgradePilot`.
- Rename historical documentation files that contain the former brand.
- Add an automated brand check and include it in `npm run check`.
- Rename the GitHub repository to `UpgradePilot` and update `origin`.
- Rename the local workspace directory to `UpgradePilot`.

## Verification

- The brand check reports zero forbidden references in tracked project files.
- Part-map consistency, production build, and smoke tests pass.
- Git working tree is clean after commit and push.
- `origin` points to the renamed GitHub repository.
- The local workspace path ends in `UpgradePilot`.
