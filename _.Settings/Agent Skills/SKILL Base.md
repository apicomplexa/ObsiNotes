---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Синтаксис Obsidian Bases — нативные базы данных хранилища
tags: []
type: 📄note
---

# SKILL — Obsidian Bases

## Что такое Bases

**Bases** — нативная функция Obsidian (с версии 1.8+) для создания реляционных представлений заметок. Файлы баз имеют расширение `.base` и хранятся в хранилище как обычные файлы.

> В отличие от Dataview (плагин), Bases — встроенная функциональность Obsidian.

---

## Структура файла `.base`

Файл написан на YAML. Корневой ключ — `views:` (массив представлений).

```yaml
views:
  - type: table        # тип представления
    name: Название     # отображаемое имя вкладки
    filters:           # условия фильтрации
      and:
        - условие1
        - условие2
    order:             # порядок и выбор колонок
      - property1
      - property2
    sort:              # сортировка
      - property: имяПоля
        direction: ASC  # или DESC
    columnSize:        # ширина колонок (в пикселях)
      note.поле: 200
```

---

## Типы представлений

### `table` — таблица

```yaml
- type: table
  name: Таблица
  filters:
    and:
      - file.hasTag("тег")
  order:
    - file.name      # встроенное поле: имя файла
    - status         # frontmatter-поле
    - 🎬Оценка
  sort:
    - property: status
      direction: ASC
  columnSize:
    note.🎬Тип: 152
    note.summary: 465
```

### `cards` — карточки

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
  cardSize: 250         # размер карточки
  image: note.image     # поле для изображения (note.ИМЯ_ПОЛЯ)
  imageFit: ""          # cover | contain | ""
  imageAspectRatio: 0.55
```

---

## Встроенные поля файла

| Поле | Описание |
|------|----------|
| `file.name` | Имя файла без расширения |
| `file.path` | Полный путь |
| `file.ctime` | Дата создания |
| `file.mtime` | Дата изменения |
| `file.size` | Размер в байтах |
| `file.hasTag("тег")` | Фильтр по тегу |

---

## Синтаксис фильтров

```yaml
filters:
  and:                              # ВСЕ условия
    - file.hasTag("🎬grw")          # наличие тега
    - status: "watching"            # значение поля
  
  or:                               # ЛЮБОЕ условие
    - file.hasTag("📌pin")
    - 🎬Оценка: 10

  not:                              # НЕ
    - file.hasTag("dv_exclude")
```

---

## Свойства изображений (тип `cards`)

```yaml
image: note.image      # frontmatter поле "image"
imageFit: "cover"      # как CSS object-fit
imageAspectRatio: 0.55 # высота/ширина
```

Поле `image` в frontmatter заметки может быть:
- Путь к файлу: `"attachments/cover.jpg"`
- Markdown-ссылкой: `"[[cover.jpg]]"` (не поддерживается Bases напрямую)

---

## Пример из хранилища — `GRW.base`

Расположение: `_. Home/Bases/GRW.base`

**Назначение**: База для трекинга медиаконтента (книги, фильмы, аниме, сериалы).

**Источник данных**: все заметки с тегом `🎬grw`.

**Frontmatter заметки GRW:**

```yaml
tags:
  - 🎬grw
status:            # текущий статус (reading/watching/done/dropped)
🎬Автор:
🎬Тип:             # книга/фильм/сериал/аниме
🎬Жанры:
🎬Оценка:          # числовая оценка
summary:
image: "1"         # обложка (путь или "1" как placeholder)
started:
done:
```

**Два вида**:
- `Таблица` — сортировка по `status ASC`
- `Карточки` — сортировка по `status DESC`, потом по `🎬Оценка DESC`

---

## Создание нового `.base` файла

1. В File Explorer: ПКМ → New file → указать `Имя.base`
2. Или через Command Palette: "Create new base"

**Структура минимального файла:**

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

---

## Отличия от Dataview

| Функция | Bases | Dataview |
|---------|-------|---------|
| Редактирование прямо в таблице | ✅ | ❌ |
| Требует плагин | ❌ (встроен) | ✅ |
| Произвольный JS | ❌ | ✅ (DataviewJS) |
| Производительность | Выше | Зависит от запроса |
| Сложные вычисления | ❌ | ✅ |
| Экспорт | Через UI | Через dv.io |

---

## Ограничения (по состоянию на 2026)

- Нет поддержки формул / вычисляемых полей
- Фильтры только на основе тегов и frontmatter-значений
- Нет группировки записей
- Один файл `.base` — одна коллекция источников данных
