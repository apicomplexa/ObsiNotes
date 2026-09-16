---
name: vault-audit
description: Read-only scan of the vault reporting frontmatter problems (missing summary/type, broken YAML, untagged notes). Use to check vault consistency. Does not modify files.
---

# vault-audit

Scan the vault and **report** frontmatter/classification problems. This skill is read-only — propose fixes, but do not edit unless the user asks afterward.

## Scope

Audit `.md` files in `Notes/`, `Lists/`, `_. Home/` (skip `.obsidian/`, `.trash/`, `_.Settings/Templates/node_modules/`).

## Checks

For each note, flag:
1. **Broken YAML** — frontmatter block doesn't parse or is missing its `---` fences.
2. **Missing `type`** — no `type:` key (should default to `📄note`).
3. **Empty `summary`** — `summary:` missing or blank (used by indexPage and AI).
4. **No metatag** — a content note in `Notes/` with no emoji-metatag field and not an index page (`type: 🗂️index` / `dv_exclude`).
5. **Suspicious `dv_exclude`** — a normal note carrying `dv_exclude` (should be index-only).

## Output

Group findings by check, list affected file paths, and give a short count summary. Mirror the format of `_.Settings/Agent Skills/AUDIT Report 1 — Состояние хранилища.md` (write the report in Russian). Do not change files; end by offering to fix specific groups.

## Reference

The valid metatag table, tags, and types are in the `vault-structure` skill.
