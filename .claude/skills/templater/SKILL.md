---
name: templater
description: Templater syntax and tp.* API, plus the catalogue of templates living in _.Settings/obsidian-kit/Templater/. Use when writing or editing a Templater template, or when creating notes from one.
---

# templater

Плагин `templater-obsidian`. Папка шаблонов хранилища: **`_.Settings/obsidian-kit/Templater/`**.

## Синтаксис

| Конструкция | Использование |
|-------------|---------------|
| `<% выражение %>` | Вставить результат в документ |
| `<%* код %>` | Выполнить код, ничего не вставляя |
| `<% await ... %>` | Асинхронный вызов |

```md
<%*
const name = await tp.system.prompt("Имя?")
%>
# <%= name %>
Дата создания: <% tp.date.now("DD-MM-YYYY") %>
```

## `tp.file`

```js
tp.file.title
tp.file.path()
tp.file.folder()
tp.file.creation_date("DD-MM-YYYY")
tp.file.last_modified_date("DD-MM-YYYY")
tp.file.selection()          // выделенный текст в редакторе
await tp.file.content
tp.file.cursor()             // поставить курсор
tp.file.tags
```

## `tp.date`

```js
tp.date.now()                      // Moment.js
tp.date.now("DD-MM-YYYY")          // формат хранилища
tp.date.now("YYYY-MM-DD", 7)       // через 7 дней
tp.date.now("DD-MM-YYYY", -1)      // вчера
tp.date.yesterday("DD-MM-YYYY")
tp.date.tomorrow("DD-MM-YYYY")
```

## `tp.system`

```js
const input = await tp.system.prompt("Введите значение", "по умолчанию")

const val = await tp.system.suggester(
  ["Показываемый 1", "Показываемый 2"],   // labels
  ["value1", "value2"],                    // values
  false,                                   // throw_on_cancel
  "Подсказка"                              // placeholder
)

const clip = await tp.system.clipboard()
```

## `tp.frontmatter` и `tp.app`

```js
tp.frontmatter.type
tp.frontmatter['💻Bioinfo']

const file = tp.app.workspace.getActiveFile()
const cache = tp.app.metadataCache.getFileCache(file)
await tp.app.vault.modify(file, content)
```

## Создание файлов из шаблона

```js
const templateFile = tp.app.vault.getAbstractFileByPath('_.Settings/obsidian-kit/Templater/_  📄CommonPage.md')
const newFile = await tp.file.create_new(templateFile, "Имя файла", true, "Notes/")

const plain = await tp.file.create_new("# Содержимое", "Имя", false)
```

Из CLI:
```bash
obsidian vault="ObsiNotes" templater:create-from-template template="_.Settings/obsidian-kit/Templater/_  📄CommonPage.md" file="Notes/Kraken2.md" open
```

## Шаблоны хранилища

### `_  📄CommonPage.md` — стандартная заметка
Базовый frontmatter всех обычных заметок. **Это эталон для любой новой заметки.**
```yaml
aliases: []
date: 23-06-2026
dg-publish: true
parent:
summary:
tags: []
type: 📄note
```

### `_ 🗂️ IndexPage.md` — индексная страница
`type: 🗂️index`, `tags: [dv_exclude]` + вызов `dv.view('_.Settings/obsidian-kit/dist/dataviews/indexPage')`.

### `_ 💊 Pills.md` — цветные плашки
Оборачивает выделенный текст в `<span class="text_pill ЦВЕТ">`. Цвет через `tp.system.suggester`.
Цвета: gray, brown, orange, yellow, green, blue, purple, pink, red.

### `Zotero tmp.md` — импорт статьи
Для Zotero Desktop Connector. Ставит `type: 📄paper`, `citekey`, `DOI`, `ISBN`, `author`, `summary` из abstractNote, `file-path` из вложений.

### `grw.md` — Got/Reading/Watching
Медиатреккинг, тег `🎬grw`, отображается в `_. Home/Bases/GRW.base`.
```yaml
tags: [🎬grw]
status:          # reading/watching/done/dropped
🎬Автор:
🎬Тип:           # книга/фильм/сериал/аниме
🎬Жанры:
🎬Оценка:
image: "1"
started:
done:
```

### Прочие
- `Template.excalidraw.md` — новая Excalidraw-схема (`excalidraw-plugin: parsed`, `tags: [excalidraw]`).
- `_ 📑 TableOfContents.md` — динамическое оглавление через DataviewJS.
- `_ 📊 Статистика задач.md` — счётчики задач по статусам в текущем файле.
- `_История болезни Шаблон.md` — для `Projects/Истории болезней/`.

## Вызов из QuickAdd

Templater-шаблоны запускаются из макросов как обычные команды Obsidian:
```
commandId: "templater-obsidian:create-_.Settings/obsidian-kit/Templater/_  📄CommonPage.md"
```

## Типовой паттерн хранилища

```md
<%*
const color = await tp.system.suggester(
  ["🔴 красный", "🔵 синий"],
  ["red", "blue"],
  false,
  "Выберите цвет"
)
const text = tp.file.selection()
%>
<span class="text_pill <%= color %>"><%= text %></span>
```
