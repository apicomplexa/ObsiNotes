---
name: new-note
description: Create a new note in Notes/ following the vault's frontmatter and emoji-metatag conventions. Use when the user asks to make/add a note on a topic.
---

# new-note

Create `Notes/<name>.md` for the topic in `$ARGUMENTS` (if empty, ask the user for the topic).

## Steps

1. If you haven't already this session, read the `vault-structure` skill for the current emoji-metatag table and conventions.
2. Pick a clear file name (the note title). Notes/ is **flat** — never create a subfolder.
3. Write the frontmatter from the `_  📄CommonPage.md` baseline, then add the relevant emoji-metatags:

```yaml
---
aliases: []
date: <DD-MM-YYYY today>
dg-publish: true
parent:
summary: <one-sentence description of the note, in Russian>
tags: []
type: 📄note
---
```

4. Add the emoji-metatag fields that fit the topic, each a YAML list of subindex values, e.g.:

```yaml
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
💻Bioinfo:
  - tool
```

   Choose metatags and subindex values from the table in the `vault-structure` skill. If a topic clearly needs a metatag/subindex that doesn't exist yet, propose it to the user rather than inventing a new semantic index silently.

5. Write a body skeleton: an `# <Title>` heading and any obvious sections. Keep prose in Russian.
6. Report the created path and which metatags you applied.

## Don'ts

- No subfolders in `Notes/`.
- Don't add `dv_exclude` (index-page only).
- Leave `parent:` empty — it's vestigial.
