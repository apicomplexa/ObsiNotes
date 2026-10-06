---
name: build-kit
description: Rebuild the obsidian-kit submodule (_.Settings/obsidian-kit) — Dataview views, QuickAdd scripts, pandoc DOCX styles — from TypeScript sources in src/ into the committed dist/. Use after editing anything under _.Settings/obsidian-kit/src/ or pandoc/.
---

# build-kit

`_.Settings/obsidian-kit` is a git submodule (its own repo). Sources live in `src/`, the vault loads the committed `dist/`. Node and pandoc are pinned by pixi; system Node is not needed and usually not installed.

## Steps

1. Build and typecheck:
   ```
   cd _.Settings/obsidian-kit && pixi run typecheck && pixi run build
   ```
   `build` runs `npm ci` first when `package-lock.json` changed, then `node build.mjs`, which wipes and regenerates `dist/`.
2. Check `git -C _.Settings/obsidian-kit status`: only the expected `dist/` files should change. Docx output is deterministic, so a changed `reference-*.docx` means its style actually changed.
3. Commit **inside the submodule** with a meaningful message (source + `dist/` together), then stage the new submodule pointer in the vault repo. The vault's Stop hook commits only the repo the shell is in, so never leave the shell `cd`'d into the kit at the end of a turn.
4. Report which outputs were rebuilt and any compiler errors.

## Layout

| Source | Output |
|---|---|
| `src/dataviews/<name>/view.ts` | `dist/dataviews/<name>/view.js` (iife; loaded by `dv.view('_.Settings/obsidian-kit/dist/dataviews/<name>')`) |
| `src/quickadd/<name>.ts` (`export default async (params) => …`) | `dist/quickadd/<name>.js` (CommonJS; QuickAdd UserScript path) |
| `src/pandoc/styles.ts` + `src/pandoc/docx/<id>.ts` | `dist/pandoc/<id>.yaml`, `reference-<id>.docx` |
| `pandoc/docx-captions.lua` | `dist/pandoc/docx-captions.lua` |

Shared code: `src/dataviews/shared/`, `src/quickadd/lib/` (bundled into each output). Global types (`dv`, `QuickAddParams`, private Obsidian API): `types/`. Details are in the kit's `README.md`.
