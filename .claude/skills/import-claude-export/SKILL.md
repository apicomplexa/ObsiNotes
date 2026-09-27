---
name: import-claude-export
description: Unpack a claude.ai chat/project export package (MANIFEST.md + MOC + topic notes + artifacts) into a self-contained Projects/ folder conforming to vault conventions. Use when the user drops an export from claude.ai into the vault, mentions MANIFEST.md, a "выгрузка/экспорт из claude.ai", or asks to import/lay out a project package.
---

# import-claude-export

Receive an export package produced by the claude.ai-side export skill and turn it into a proper vault project under `Projects/`.

The export side guarantees a fixed contract (see **Input contract**). This skill holds the vault-side half: the real conventions are **frozen below** in *Vault conventions (snapshot)* — they were derived once from the live vault and do not need re-deriving per package. Re-read `vault-structure` / `frontmatter-linter` only if something in the snapshot looks stale.

Argument `$ARGUMENTS`: path to the staging folder. If empty, find it (step 1).

---

## Input contract (what the exporter guarantees)

A package is a flat folder, no subfolders, containing:

| Item | Count | Naming |
| --- | --- | --- |
| Manifest | exactly 1 | `MANIFEST.md` |
| MOC | exactly 1 | `00-<slug>-moc.md` |
| Topic notes | N | `<slug>-<topic>.md` |
| External artifacts | 0..N | any (PDF, images, PPTX) |

Draft frontmatter on every note — **always replace it**:

```yaml
---
title: <human-readable title>
aliases: [<synonyms, ru/en variants>]
tags: [project/<slug>]
---
```

Key facts about the contract:

- **Links are `[[Title]]`**, matching the `title` *field* — not the filename. Renaming files therefore requires rewriting links by title, not by filename.
- `tags: [project/<slug>]` is a deliberate placeholder. Replace it.
- **Versioning is preserved on purpose.** Text saying "v2 заменяет v1" is decision history, not a duplicate to clean.
- **Unfinished items are marked on purpose** ("не финализировано", "требует уточнения", "формулировка черновая"). Never resolve, invent, or delete them.
- `MANIFEST.md` is *input data*, not a note. It must not survive as a vault note.

`MANIFEST.md` layout:

```markdown
# Манифест экспорта: <slug>

| Файл | title | aliases | Содержание (1 строка) | Ссылается на |
|---|---|---|---|---|

## Внешние артефакты
| Файл | Тип | Предпочтительный исходник (если есть) | Куда встраивается |
|---|---|---|---|

## Заметки для приёмной стороны
- known external matches / duplicate hints
```

---

## Procedure

### 1. Locate the package

Try in order:

1. `$ARGUMENTS` if given.
2. Search the vault for a staging folder: `find Projects -name MANIFEST.md`. Canonical drop point is `Projects/<Проект>/claude-web-export/`.
3. Still nothing → ask the user. **Never guess.**

Cross-check the manifest's file table against what is on disk. If a listed file is missing, or an unlisted file is present, **ask** — do not improvise.

### 2. Commit the pre-state

```bash
git add -A && git commit -m "pre-import: <slug> export package"
```

If the tree is already clean, skip. This is the rollback point; the `Stop` hook commits the post-state automatically.

### 3. Check for duplicates

Before creating anything, check whether the vault already covers this material:

```bash
obsidian vault="ObsiNotes" aliases verbose | grep -i "<alias>"
obsidian vault="ObsiNotes" search query="<keyword from Заметки для приёмной стороны>" limit=10
```

Run this over every `aliases` value in the manifest plus the hints block. Report hits to the user and ask how to handle each: merge, link, or ignore. Do not silently create a parallel note on a topic `Notes/` already owns.

### 4. Decide the target directory

- **New project** → `Projects/<Название проекта>/` (Russian name, matches how the user talks about it; no spaces-to-dashes mangling).
- **Existing project** → merge into it. Read its nested `CLAUDE.md` first and follow *its* layout instead of creating a second one. Only add folders that are actually needed.

Never place project content outside its folder (root `CLAUDE.md` § *Projects are self-contained*).

### 5. Build the name map

Produce an explicit table **before touching any file** — it drives both the moves and the link rewriting:

| Source file | `title` (link key) | Target path |
| --- | --- | --- |
| `00-<slug>-moc.md` | ... | `Projects/<Проект>/_<Проект>.md` |
| `<slug>-topic.md` | ... | `Projects/<Проект>/<Раздел>/<ПРФ> - <Тема>.md` |

Naming rules:

- MOC becomes the main project note: `_<Название проекта>.md` at the project root.
- Topic notes get a short project prefix + plain hyphen: `СФ - Экономика баллов.md`. Pick a 2–3 letter prefix from the project name. **The prefix is mandatory** — short wikilinks resolve vault-wide, and titles like "Обзор проекта" would collide with `Notes/`.
- Russian names, spaces allowed, plain `-` (not `—`) as the separator — matches `ИБ - хирургия.md`.

Section folders (create only what the package needs):

| Folder | Holds |
| --- | --- |
| `Дизайн/` | rules, mechanics, balance, plot — the "what it is" |
| `Реализация/` | tech stack, scripts, checklists, schedules, outward-facing texts — the "how we build/run it" |
| `Артефакты/` | finished PDFs/PPTX/mockups shown to people |
| `Материалы/` | brainstorms, raw sources, drafts |
| `media/` | images and screenshots embedded in notes |

For a non-event project these names may not fit — adapt, but keep the same shape: content folders + `Артефакты/` + `Материалы/` + `media/`.

### 6. Move the files (link-aware, Obsidian must be running)

Use the Obsidian CLI so links are rewritten for you (`alwaysUpdateLinks: true`):

```bash
OB="C:/Users/alex/Apps/Programms/Obsidian/obsidian"
"$OB" vault="ObsiNotes" move path="<staging>/<file>.md" to="Projects/<Проект>/<Раздел>/<новое имя>.md"
```

Move **before** rewriting content: Obsidian fixes the `[[...]]` links itself, so you only fix what it cannot know about.

Then repair what the auto-update misses: the contract links by `title`, and any link whose target title differed from its filename will not have been rewritten. Grep for survivors:

```bash
grep -rn "\[\[" "Projects/<Проект>/"
```

Every remaining `[[Old Title]]` must become `[[<new file name>]]`, using the step-5 table.

### 7. Rewrite frontmatter and bodies

For each note, replace the draft frontmatter wholesale:

```yaml
---
aliases: []
date: <DD-MM-YYYY, today or file ctime>
dg-publish: true
parent:
summary: <one Russian sentence — what this note is about>
tags:
  - 💡project
  - nsmu
  - <проекттег>
type: 📄note
---
```

- Carry the exporter's `aliases` over (they are the user's own vocabulary and feed duplicate search later). Drop ones that merely restate the filename.
- `title:` is **not** a vault field — the filename is the title. Delete the key.
- `<проекттег>` — one lowercase Russian tag naming the project (e.g. `северфест`). Replaces `project/<slug>`.
- `status:` goes on the main note only. Values: `🟡In progress`, `🟢Done`.
- No emoji metatags, no `dv_exclude` — project notes are classified by directory.
- Fill every `summary`. Never leave it blank.

Body edits — minimal and mechanical:

- Add the back-link line right after the frontmatter: `← [[_<Проект>|<Проект>]]`.
- Drop the exporter's own scaffolding comments (e.g. "Черновая индексная заметка… привести в соответствие на фазе интеграции").
- Normalise headings and tables to vault markdown (`obsidian-markdown`), use `__bold__`, convert "warning"/"note" asides to callouts.
- **Do not** touch content marked as versioned or unfinished. Where a stale value survives (a v1 number quoted in a pitch), leave the number and add a callout pointing at the note that holds the current one — never silently correct it.

### 8. Place the external artifacts

For each row of the manifest's artifact table:

1. **Prefer the live source.** If the manifest names one, search the vault for it before trusting the flat copy:
   ```bash
   obsidian vault="ObsiNotes" search query="<name>" limit=10
   obsidian vault="ObsiNotes" eval code="app.vault.getFiles().filter(f=>f.name.includes('<fragment>')).map(f=>f.path)"
   ```
   An editable `.excalidraw.md` / `.canvas` / source doc beats a rendered PDF. If the live source is already elsewhere in the vault, move it into the project (`Материалы/`) rather than keeping the flat copy.
2. Move the artifact into `Артефакты/` (finished, presentable) or `Материалы/` (raw source) with the CLI.
3. **Mine it for content.** Read the artifact and fold its substance into the note the manifest points at — creating that note if the package has no note for it. A spec PDF carries decisions that exist nowhere else; leaving it as an opaque attachment loses them. Link the artifact from the note: `[[<файл>.pdf]]`.
4. Give any `.excalidraw.md` brought into the project the standard project frontmatter, keeping its `excalidraw` tag and `excalidraw-plugin: parsed`. Edit its frontmatter via `processFrontMatter`, never by hand.

### 9. Write the main project note

From the MOC, plus what you learned unpacking. Sections:

- H1 + a short paragraph of what the project is (scale, dates, roles).
- **Карта проекта** — one table per section folder, each row a note + one line on it.
- **Артефакты и материалы** — links to artifacts and raw sources.
- **Снимок статуса (`<дата>`)** — bullets from the MOC's status block.
- **Открытые вопросы** — a table of question → the note where it lives. Aggregated from every note's "не решено"/"открытые вопросы" section.

Open the body with the vault's index callout:

```markdown
> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`
```

### 10. Write the project's nested `CLAUDE.md`

At `Projects/<Проект>/CLAUDE.md`. Root `CLAUDE.md` expects it and future sessions read it before touching the folder. Required sections:

1. **Что это за проект** — two or three sentences plus the entry-point link.
2. **Главное правило — проект самодостаточен** — everything new stays in this folder; attachments go to the project's `media/`, not the global `_.Settings/Media`; no entry in `_. Home/Indexes/`.
3. **Структура директории** — the tree, plus a "куда что класть" table.
4. **Конвенции заметок проекта** — the exact frontmatter block, the tag triple, the naming prefix, the back-link line.
5. **Перемещения и переименования** — the Obsidian CLI move command.
6. **Содержательный контекст** — the domain facts a cold session would otherwise re-derive: coined terms, key numbers, which version is current, key people.
7. **История импортов** — one line per package: date, slug, what came in. Add a row on every subsequent import.
8. **Чего не делать** — including "don't 'fix' outdated numbers in `Материалы/` — those are historical sources".

When merging into an existing project, **update** its `CLAUDE.md` (structure, context, import history) instead of overwriting it.

### 11. Clean up and verify

```bash
rmdir "<staging folder>"                      # must already be empty
```

- Delete `MANIFEST.md` — it is input data, and the contract says it is not a note. Its provenance lives on in *История импортов*.
- Confirm no unresolved links:
  ```bash
  obsidian vault="ObsiNotes" eval code="app.vault.getMarkdownFiles().filter(f=>f.path.includes('<Проект>')).map(f=>({p:f.path,bad:(app.metadataCache.getCache(f.path)?.links||[]).map(l=>l.link).filter(l=>!app.metadataCache.getFirstLinkpathDest(l,f.path))}))"
  ```
  Every `bad` array must be empty.
- Confirm the final tree matches the step-5 table and that nothing landed outside `Projects/<Проект>/`.

### 12. Report

Tell the user, in Russian: the final tree, what was renamed, what content you pulled out of artifacts, any duplicates found in step 3 and what you did about them, and anything the manifest flagged that you could not resolve.

---

## Vault conventions (snapshot)

Frozen answers to step 2 of the contract — no need to re-derive.

**Project frontmatter** — keys alphabetical, `date` as `DD-MM-YYYY`, `aliases`/`tags` always arrays (`frontmatter-linter`):

```yaml
aliases: []
date: DD-MM-YYYY
dg-publish: true
parent:          # vestigial, leave empty
summary: <обязательно>
tags:
  - 💡project    # vault-wide convention for project notes
  - nsmu         # if the project is СГМУ-related
  - <проекттег>
type: 📄note
```

**Naming** — main note `_<Проект>.md`; topic notes `<ПРФ> - <Тема>.md`. Precedent: `Projects/Статьи и рефераты/_Archive/*/_<Название>.md`, `Projects/Истории болезней/ИБ - хирургия.md`.

**Tags** — `💡project` (22 notes) is the project marker. `nsmu` for university work. `status:` exists only on project main notes (`🟢Done` was the only prior value; `🟡In progress` added for active projects). `dv_exclude` is **not** used anywhere in `Projects/` — it is index-page-only.

**Classification** — projects are classified by directory. No emoji metatags, no `_. Home/Indexes/` entry, not part of `indexPage` dataviews.

**Attachments** — Obsidian's global `attachmentFolderPath` is `_.Settings/Media`. Anything pasted through the UI lands there and must be moved into the project's `media/` with the CLI.

**Obsidian CLI** — binary `C:/Users/alex/Apps/Programms/Obsidian/obsidian`, always `vault="ObsiNotes"` (a second vault `TRPG` exists). Obsidian must be running. Full reference: `obsidian-cli` skill.

---

## Gotchas

- **Batched `move` calls report only some lines.** A silent call usually still succeeded. Verify with `eval app.vault.getFiles()...` rather than `find` — the filesystem lags behind Obsidian (NextCloud sync), and `obsidian files folder=` can return nothing for a folder mid-reindex.
- **`processFrontMatter` in `eval` needs an async IIFE.** Bare `await` fails with *"await is only valid in async functions"*:
  ```bash
  obsidian vault="ObsiNotes" eval code="(async()=>{const f=app.vault.getAbstractFileByPath('<path>'); await app.fileManager.processFrontMatter(f, fm => { fm.summary='…' }); return 'done'})()"
  ```
- **Folders cannot be moved with `move`** — use `eval` + `app.fileManager.renameFile`. Never `app.vault.rename` (skips link updates), never shell `mv`.
- **Draft frontmatter is inconsistent across a package** — some notes arrive with the full `date`/`dg-publish`/`parent`/`summary` set, others with only `title`/`aliases`/`tags` as inline arrays. Normalise all of them regardless of what arrived.
- **`git status` renders Cyrillic paths as octal escapes.** Expected; not corruption.
- **Empty `media/` will not survive a git clone.** Fine locally; do not add placeholder files to the vault.

## Don'ts

- Don't guess at a missing or extra file — ask.
- Don't write any part of the package outside `Projects/<Проект>/`.
- Don't keep `MANIFEST.md` or `title:` as vault content.
- Don't resolve version history or finish off items marked unfinished — the exporter kept them deliberately.
- Don't rename files without rewriting the `[[Title]]` links in the same pass.
- Don't add emoji metatags or `dv_exclude` to project notes.
- Don't skip the pre-import commit.
