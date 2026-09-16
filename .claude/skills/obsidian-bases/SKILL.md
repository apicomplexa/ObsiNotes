---
name: obsidian-bases
description: Obsidian Bases (.base) YAML syntax — views, filters, built-in file fields, card images — and the vault's GRW.base. Use when creating or editing a .base file.
---

# obsidian-bases

**Bases** — встроенная функция Obsidian (1.8+) для реляционных представлений заметок. Файлы `.base` лежат в хранилище как обычные файлы. В отличие от Dataview, плагин не нужен.

## Структура файла

YAML, корневой ключ `views:`.

```yaml
views:
  - type: table          # table | cards
    name: Название       # имя вкладки
    filters:
      and:
        - условие1
        - условие2
    order:               # порядок и выбор колонок
      - file.name
      - status
    sort:
      - property: status
        direction: ASC   # ASC | DESC
    columnSize:
      note.summary: 465
```

## Вид `table`

```yaml
- type: table
  name: Таблица
  filters:
    and:
      - file.hasTag("🎬grw")
  order:
    - file.name
    - status
    - 🎬Оценка
  sort:
    - property: status
      direction: ASC
  columnSize:
    note.🎬Тип: 152
    note.summary: 465
```

## Вид `cards`

```yaml
- type: cards
  name: Карточки
  filters:
    and:
      - file.hasTag("🎬grw")
  order:
    - file.name
    - 🎬Автор
    - 🎬Оценка
  sort:
    - property: 🎬Оценка
      direction: DESC
  cardSize: 250
  image: note.image         # note.ИМЯ_ПОЛЯ
  imageFit: ""              # cover | contain | пусто
  imageAspectRatio: 0.55    # высота/ширина
```

Поле `image` во frontmatter — путь к файлу, например `"attachments/cover.jpg"`. Markdown-ссылки вида `[[cover.jpg]]` Bases напрямую **не** поддерживает.

## Встроенные поля файла

| Поле | Описание |
|------|----------|
| `file.name` | Имя без расширения |
| `file.path` | Полный путь |
| `file.ctime` | Дата создания |
| `file.mtime` | Дата изменения |
| `file.size` | Размер в байтах |
| `file.hasTag("тег")` | Фильтр по тегу |

## Фильтры

```yaml
filters:
  and:                        # все условия
    - file.hasTag("🎬grw")
    - status: "watching"
  or:                         # любое из
    - file.hasTag("📌pin")
    - 🎬Оценка: 10
  not:
    - file.hasTag("dv_exclude")
```

## `_. Home/Bases/GRW.base`

Трекинг медиаконтента (книги, фильмы, аниме, сериалы). Источник — заметки с тегом `🎬grw`. Два вида: `Таблица` (сортировка `status ASC`) и `Карточки` (`status DESC`, затем `🎬Оценка DESC`).

Frontmatter GRW-заметки: `tags: [🎬grw]`, `status`, `🎬Автор`, `🎬Тип`, `🎬Жанры`, `🎬Оценка`, `summary`, `image`, `started`, `done`. Шаблон — `_.Settings/Templates/Templater/grw.md`.

## Создание и запросы

Новый файл: ПКМ в File Explorer → New file → `Имя.base`, либо Command Palette → "Create new base".

Минимальный файл:

```yaml
views:
  - type: table
    name: Все заметки
    filters:
      and:
        - file.hasTag("mytag")
    order:
      - file.name
```

Из CLI:

```bash
obsidian vault="ObsiNotes" bases
obsidian vault="ObsiNotes" base:views path="_. Home/Bases/GRW.base"
obsidian vault="ObsiNotes" base:query path="_. Home/Bases/GRW.base" view="Таблица" format=json
obsidian vault="ObsiNotes" base:create path="_. Home/Bases/GRW.base" name="Новая книга"
```

## Bases против Dataview

| Функция | Bases | Dataview |
|---------|-------|---------|
| Правка прямо в таблице | ✅ | ❌ |
| Требует плагин | ❌ | ✅ |
| Произвольный JS | ❌ | ✅ |
| Сложные вычисления | ❌ | ✅ |

## Ограничения

Нет формул и вычисляемых полей; фильтры только по тегам и frontmatter-значениям; нет группировки записей; один `.base` — один набор источников данных.
