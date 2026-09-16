---
name: defuddle
description: Extract clean Markdown from HTML pages with Defuddle CLI.
---

# Defuddle

Use Defuddle CLI to extract clean readable content from web pages. Prefer over WebFetch for standard web pages — it removes navigation, ads, and clutter, reducing token usage.

If not installed: `npm install -g defuddle`

## Usage

Always use `--md` for markdown output:

```bash
defuddle parse <url> --md
```

Save to file:

```bash
defuddle parse <url> --md -o content.md
```

Extract specific metadata:

```bash
defuddle parse <url> -p title
defuddle parse <url> -p description
defuddle parse <url> -p domain
```

## Output formats

| Flag | Format |
|------|--------|
| `--md` | Markdown (default choice) |
| `--json` | JSON with both HTML and markdown |
| (none) | HTML |
| `-p <name>` | Specific metadata property |

## ObsiNotes: куда складывать результат

Веб-клиппинги хранятся в `Clippings/`. Единого шаблона frontmatter у них нет, но для новых лучше ставить стандартный набор хранилища (`aliases / date / dg-publish / summary / tags / type`) — см. скилы `vault-structure` и `frontmatter-linter`.

Для научных статей клиппинг обычно не нужен: в хранилище стоит Zotero Desktop Connector с шаблоном `Zotero tmp.md`, который ставит `type: 📄paper` и заполняет `citekey`, `DOI`, `author`, `summary` из метаданных — см. скил `templater`.

Defuddle не установлен глобально. Разовый запуск: `npx defuddle parse <url> --md`.
