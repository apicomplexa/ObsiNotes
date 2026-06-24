---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Правила Obsidian Linter для автоформатирования frontmatter заметок хранилища
tags: []
type: 📄note
---

# SKILL — Obsidian Linter

## Что делает Linter

Плагин **Obsidian Linter** автоматически форматирует заметки при сохранении (или по команде). В этом хранилище он управляет структурой **frontmatter**.

---

## Автовставляемые поля

При первом lint новой заметки Linter добавляет отсутствующие поля:

```yaml
aliases: []
date:          # заполняется из ctime файла
dg-publish: true
parent:
summary:
tags: []
type: 📄note
```

Это определено в правиле `insert-yaml-attributes`.

---

## Формат даты

**Правило**: `yaml-timestamp`

```
format: "DD-MM-YYYY"
date-created-key: "date"
date-created-source-of-truth: "file system"  # из метаданных файла, не из содержимого
```

- Поле `date` — дата создания файла
- Поле `date modified` — НЕ используется (отключено)
- Значение берётся из файловой системы (ctime файла), не из имени

**Важно**: При создании заметки через Obsidian CLI или QuickAdd дата записывается из реального времени создания.

---

## Сортировка ключей YAML

**Правило**: `yaml-key-sort`

- Ключи сортируются **по алфавиту** (Ascending Alphabetical)
- Исключение: priority-ключи выводятся первыми (список не задан, т.е. алфавит)

**Результат**: frontmatter всегда отсортирован — удобно при diff в git.

---

## Форматирование тегов

**Правило**: `format-yaml-array` + `format-tags-in-yaml`

```yaml
tags:              # всегда multi-line, если несколько
  - dv_exclude
  - 📌pin
```

Одиночный тег тоже в multi-line:

```yaml
tags:
  - 📌pin
```

---

## Экранирование специальных символов YAML

**Правило**: `escape-yaml-special-characters`

Поля с `:`, `[`, `]`, `{`, `}` в значениях автоматически оборачиваются в кавычки:

```yaml
summary: "Пайплайн: от сырых ридов [FastQC] до матрицы экспрессии"
```

---

## Форматирование заголовков

**Правило**: `capitalize-headings`

- Первая буква заголовка — заглавная
- Остальные слова — в lowercase, кроме слов из ignore-списка: `macOS, iOS, iPhone, iPad, JavaScript, TypeScript, AppleScript`
- lowercase слова (предлоги и пр.): `via, a, an, the, and, or, but, for...`

---

## Правила ОТКЛЮЧЕНЫ

| Правило | Статус |
|---------|--------|
| `yaml-title` | Отключено — заголовок из H1 не пишется в frontmatter |
| `yaml-title-alias` | Отключено |
| `file-name-heading` | Отключено |
| `date-modified` | Отключено |
| `force-yaml-escape` | Отключено |
| `remove-yaml-keys` | Отключено |

---

## Запуск вручную

```bash
# Lint активного файла
obsidian command id="obsidian-linter:lint-file"

# Lint всего хранилища
obsidian command id="obsidian-linter:lint-all-files"
```

---

## Стандартный frontmatter заметки (после Lint)

```yaml
aliases: []
date: 23-06-2026
dg-publish: true
parent:
summary:
tags: []
type: 📄note
# --- Семантические индексы (если есть) ---
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
```

---

## Поведение при агентной работе

Когда создаёшь или изменяешь frontmatter вручную (без Linter):
1. Используй формат даты `DD-MM-YYYY`
2. Теги в multi-line формате
3. Ключи в алфавитном порядке (стандартные поля → семантические индексы)
4. Поля `aliases`, `tags` как массивы (даже пустые: `[]`)
