---
aliases: []
date: 26-06-2026
dg-publish: true
parent:
summary:
tags: []
type: 📄note
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

__ObsiNotes__ is a personal, academic Obsidian vault (medicine + bioinformatics/metagenomics, ~1050 notes). It is a knowledge base, not a code project. __Respond to the user in Russian.__

## Read first

Before any vault task, read these reference notes in `_.Settings/Agent Skills/`:

- `SKILL Vault Structure.md` — folder layout, the full emoji-metatag table, plugin map, index system, and the don'ts. __Start here.__
- `SKILL Obsidian CLI.md` — commands for operating on the vault.

Consult the matching skill when a task touches it: `SKILL DataviewJS.md`, `SKILL Templater.md`, `SKILL QuickAdd.md`, `SKILL Base.md`, `SKILL Excalidraw.md`, `SKILL Linter.md`.

## Core conventions

- Notes are classified by __emoji frontmatter metatags__ (e.g. `💻Bioinfo`, `🦠Metagenomics`, `📊Statistic`), __not__ by folders. One note may carry several metatags. The full list lives in `SKILL Vault Structure.md`.
- Every note's frontmatter has `aliases / date / dg-publish / summary / type`. Default `type: 📄note`. Use the `_  📄CommonPage.md` Templater template (`_.Settings/Templates/Templater/`) as the frontmatter baseline.
- `Notes/` is intentionally __flat__ — no subfolders.

## Build

Rebuild the TypeScript Dataviews after editing them:

```
cd _.Settings/Templates && npm run build:dv
```

Sources: `_.Settings/Templates/dataviews/<name>/view.ts` → output `dist/dataviews/<name>/view.js`.

## Git

obsidian-git backs up with message `vault backup: <timestamp>`. Working branch is `claude-refactor`; `main` is the backup branch. Don't commit manually unless asked — the `Stop` hook in `.claude/settings.json` auto-commits agent changes.

## Don'ts (from SKILL Vault Structure.md)

- Don't create subfolders in `Notes/` — keep it flat.
- Don't add the `dv_exclude` tag to normal notes (it's only for index pages).
- Don't change a note's `type` without a clear reason.
- Don't create new semantic indexes without discussing with the user first.
- `parent:` is a vestigial field — ignore it.
