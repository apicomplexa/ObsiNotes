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

Reference material lives in `.claude/skills/`. Before any vault task, invoke:

- `vault-structure` — folder layout, the full emoji-metatag table, plugin map, index system, and the don'ts. __Start here.__
- `obsidian-cli` — commands for operating on the vault.

Consult the matching skill when a task touches it: `obsidian-markdown`, `dataviewjs`, `templater`, `quickadd`, `obsidian-bases`, `json-canvas`, `excalidraw`, `frontmatter-linter`, `defuddle`.

Task skills: `new-note`, `new-quickadd-script`, `build-dataviews`, `vault-audit`.

`obsidian-markdown`, `obsidian-bases`, `json-canvas`, `defuddle` and the `dev:*` section of `obsidian-cli` come from [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills); each carries an appended `ObsiNotes:` section with vault-specific conventions. When re-syncing upstream, keep that trailing section.

Historical refactor artifacts (`ACTION PLAN`, the two `AUDIT Report` notes) remain in `_.Settings/Agent Skills/`.

## Core conventions

- Notes are classified by __emoji frontmatter metatags__ (e.g. `💻Bioinfo`, `🦠Metagenomics`, `📊Statistic`), __not__ by folders. One note may carry several metatags. The full list lives in the `vault-structure` skill.
- Every note's frontmatter has `aliases / date / dg-publish / summary / type`. Default `type: 📄note`. Use the `_  📄CommonPage.md` Templater template (`_.Settings/Templates/Templater/`) as the frontmatter baseline.
- `Notes/` is intentionally __flat__ — no subfolders.

## Projects are self-contained

Each folder under `Projects/` is a closed unit. When working on a project:

- __Every new project-related file stays inside that project's folder__ — notes, diagrams, scripts, attachments, exports. Nothing new is written to `Notes/`, `_. Home/`, `Clippings/`, or `Lists/`.
- Linking to existing notes in `Notes/` is fine, and editing them is fine when the user asks. But the project's own content is never spread outside its directory.
- Attachments go into the project's own `media/` (or `Артефакты/`) folder, not the global `_.Settings/Media` — move them with the Obsidian CLI after pasting.
- Project notes are classified by directory, not by emoji metatags, and stay out of `_. Home/Indexes/`.
- Convention: main project note is `_<Project name>.md`, tagged `💡project` + `nsmu`; optional `status:` field on that note only.
- A project may carry its own nested `CLAUDE.md` — read it before touching anything in that folder. Existing: `Projects/СеверФест2026/CLAUDE.md`.

## Build

Rebuild the TypeScript Dataviews after editing them:

```
cd _.Settings/Templates && npm run build:dv
```

Sources: `_.Settings/Templates/dataviews/<name>/view.ts` → output `dist/dataviews/<name>/view.js`.

## Git

obsidian-git backs up with message `vault backup: <timestamp>`. Working branch is `claude-refactor`; `main` is the backup branch. Don't commit manually unless asked — the `Stop` hook in `.claude/settings.json` auto-commits agent changes.

## Don'ts (from the `vault-structure` skill)

- Don't create subfolders in `Notes/` — keep it flat.
- Don't let project content leak out of its `Projects/<name>/` folder (see above).
- Don't add the `dv_exclude` tag to normal notes (it's only for index pages).
- Don't change a note's `type` without a clear reason.
- Don't create new semantic indexes without discussing with the user first.
- `parent:` is a vestigial field — ignore it.
