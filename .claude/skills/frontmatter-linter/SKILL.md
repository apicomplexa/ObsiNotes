---
name: frontmatter-linter
description: Obsidian Linter rules that govern frontmatter format in this vault — key order, date format, tag arrays, YAML escaping, heading capitalization. Follow these whenever writing or editing frontmatter by hand so the Linter produces no diff.
---

# frontmatter-linter

Плагин **Obsidian Linter** форматирует заметки при сохранении. В этом хранилище он управляет структурой frontmatter. Когда пишешь frontmatter вручную — соблюдай эти правила, иначе следующий lint даст лишний diff в git.

## Правила при ручной правке

1. Дата — `DD-MM-YYYY`.
2. Ключи — по алфавиту: сначала стандартные поля, затем семантические индексы.
3. `aliases` и `tags` — всегда массивы, даже пустые: `[]`.
4. Несколько тегов — multi-line список. Один тег — тоже multi-line.
5. Значения с `:`, `[`, `]`, `{`, `}` — в кавычках.

## Эталон frontmatter

```yaml
---
aliases: []
date: 23-06-2026
dg-publish: true
parent:
summary: "Пайплайн: от сырых ридов [FastQC] до матрицы экспрессии"
tags:
  - 📌pin
type: 📄note
# --- Семантические индексы ---
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
---
```

## Действующие правила Linter

| Правило | Что делает |
|---------|-----------|
| `insert-yaml-attributes` | Дописывает недостающие поля: `aliases`, `date`, `dg-publish`, `parent`, `summary`, `tags`, `type: 📄note` |
| `yaml-timestamp` | `format: DD-MM-YYYY`, `date-created-key: date`, источник истины — **файловая система** (ctime), не содержимое |
| `yaml-key-sort` | Ключи по алфавиту (Ascending Alphabetical), priority-список не задан |
| `format-yaml-array` + `format-tags-in-yaml` | Теги всегда multi-line |
| `escape-yaml-special-characters` | Оборачивает значения со спецсимволами в кавычки |
| `capitalize-headings` | Первая буква заголовка заглавная, остальные слова lowercase кроме ignore-списка |

`capitalize-headings` ignore-список: `macOS, iOS, iPhone, iPad, JavaScript, TypeScript, AppleScript`. Lowercase-слова: `via, a, an, the, and, or, but, for…`

Поле `date modified` **не используется** — отключено.

## Отключённые правила

`yaml-title`, `yaml-title-alias`, `file-name-heading`, `date-modified`, `force-yaml-escape`, `remove-yaml-keys`.

Из этого следует: H1-заголовок **не** дублируется в frontmatter, и Linter **не** удаляет незнакомые ключи — семантические метатеги в безопасности.

## Запуск вручную

```bash
obsidian vault="ObsiNotes" command id="obsidian-linter:lint-file"
obsidian vault="ObsiNotes" command id="obsidian-linter:lint-all-files"
```

`lint-all-files` трогает всё хранилище — запускай только по явной просьбе пользователя.
