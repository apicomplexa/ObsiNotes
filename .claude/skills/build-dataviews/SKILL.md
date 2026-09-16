---
name: build-dataviews
description: Rebuild the vault's TypeScript Dataview bundles. Use after editing any view.ts under _.Settings/Templates/dataviews/.
---

# build-dataviews

Compile the TypeScript Dataview sources into the `dist/` bundles the notes load at runtime.

## Steps

1. Run the build:
   ```
   cd _.Settings/Templates && npm run build:dv
   ```
   (This runs `node build-dataviews.cjs`, which uses the local `tsc`.)
2. If it fails on missing deps, run `npm install` in `_.Settings/Templates` first, then retry.
3. Confirm the bundles were regenerated — check that files under `_.Settings/Templates/dist/dataviews/<name>/view.js` have fresh timestamps.
4. Report which views were rebuilt and any compiler warnings/errors.

## Notes

- Sources: `_.Settings/Templates/dataviews/<name>/view.ts` (+ components) → output `dist/dataviews/<name>/view.js`.
- Notes reference the output via `dv.view('.../dist/dataviews/<name>')`.
- See the `dataviewjs` skill for the dataview architecture and TypeScript repo layout.
