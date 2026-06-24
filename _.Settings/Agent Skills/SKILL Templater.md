---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Синтаксис Templater и описание шаблонов этого хранилища
tags: []
type: 📄note
---

# SKILL — Templater

## Базовый синтаксис

| Конструкция | Использование |
|-------------|---------------|
| `<% выражение %>` | Вставить результат выражения в документ |
| `<%* код %>` | Выполнить код (не вставляет результат) |
| `<% tp.объект.метод() %>` | Вызов Templater API |
| `<% await ... %>` | Асинхронный вызов |

```md
<%* // JS-код без вывода
const name = await tp.system.prompt("Имя?")
%>
# <%= name %>
Дата создания: <% tp.date.now("DD-MM-YYYY") %>
```

---

## API: `tp.file`

```js
tp.file.title        // имя файла без расширения
tp.file.path()       // полный путь
tp.file.folder()     // папка файла
tp.file.creation_date("DD-MM-YYYY")  // дата создания
tp.file.last_modified_date("DD-MM-YYYY")
tp.file.selection()  // выделенный текст в редакторе
tp.file.content      // содержимое файла (async: await tp.file.content)
tp.file.cursor()     // установить курсор в позицию
tp.file.tags         // теги файла
```

---

## API: `tp.date`

```js
tp.date.now()                    // текущий момент (Moment.js объект)
tp.date.now("DD-MM-YYYY")        // форматированная дата
tp.date.now("YYYY-MM-DD", 7)     // через 7 дней
tp.date.now("DD-MM-YYYY", -1)    // вчера
tp.date.yesterday("DD-MM-YYYY")
tp.date.tomorrow("DD-MM-YYYY")
```

---

## API: `tp.system`

```js
// Диалог ввода текста
const input = await tp.system.prompt("Введите значение", "по умолчанию")

// Выбор из списка (отображаемые / возвращаемые значения)
const val = await tp.system.suggester(
  ["Показываемый текст 1", "Показываемый текст 2"],  // labels
  ["value1", "value2"],                               // values
  false,                                              // throw_on_cancel
  "Подсказка"                                         // placeholder
)

// Клипборд
const clip = await tp.system.clipboard()
```

---

## API: `tp.frontmatter`

```js
// Прочитать поле frontmatter текущего файла
tp.frontmatter.tags
tp.frontmatter.type
tp.frontmatter['💻Bioinfo']

// Установить поле (только в шаблонах с <%* %>)
await tp.file.create_new(...)
```

---

## API: `tp.app`

Полный доступ к Obsidian App:

```js
const file = tp.app.workspace.getActiveFile()
const cache = tp.app.metadataCache.getFileCache(file)
await tp.app.vault.modify(file, content)
```

---

## Создание файлов из шаблона

```js
// Создать новый файл из шаблона
const templateFile = tp.app.vault.getAbstractFileByPath('path/to/template.md')
const newFile = await tp.file.create_new(templateFile, "Имя файла", true, "папка/")

// Создать с содержимым
const newFile2 = await tp.file.create_new("# Содержимое", "Имя", false)
```

---

## Настройки Templater в хранилище

- **Папка шаблонов**: `_.Settings/Templates/Templater/`
- **Триггер**: автоматически при создании файла в нужной папке

---

## Шаблоны в хранилище

### `_  📄CommonPage.md` — стандартная заметка

Базовый frontmatter для всех обычных заметок. Заполняется при создании через QuickAdd "New common note".

```yaml
---
aliases: []
date: 23-06-2026
dg-publish: true
parent:
summary:
tags: []
type: 📄note
---
```

### `_ 🗂️ IndexPage.md` — индексная страница

Шаблон для создания новых индексных страниц. Содержит frontmatter с `type: 🗂️index`, `tags: [dv_exclude]` и вызов indexPage датавью.

```yaml
---
type: 🗂️index
tags:
  - dv_exclude
---
```dataviewjs
dv.view('_.Settings/Templates/dist/dataviews/indexPage')
```

### `_ 💊 Pills.md` — цветные плашки

Вставляет `<span class="text_pill ЦВЕТ">текст</span>` вокруг выделенного текста. Запрашивает цвет через `tp.system.suggester`. Используется для визуального выделения.

**Доступные цвета**: gray, brown, orange, yellow, green, blue, purple, pink, red

### `Zotero tmp.md` — импорт из Zotero

Шаблон для плагина Zotero Desktop Connector. Заполняет frontmatter из метаданных статьи:
- `type: 📄paper`
- `citekey`, `DOI`, `ISBN`, `author`
- `summary` из abstractNote
- `file-path` из вложений

### `grw.md` — Got/Reading/Watching

Шаблон для трекинга книг/фильмов/аниме. Используется с тегом `🎬grw` и отображается в `_. Home/Bases/GRW.base`.

```yaml
---
tags:
  - 🎬grw
status:
🎬Автор:
🎬Тип:         # книга/фильм/сериал/аниме
🎬Жанры:
🎬Оценка:      # числовая оценка
summary:
image: "1"     # путь к обложке
started:
done:
---
```

### `Template.excalidraw.md` — Excalidraw-схема

Базовый шаблон для новых Excalidraw-файлов. Frontmatter включает `excalidraw-plugin: parsed`, `tags: [excalidraw]`.

### `_ 📑 TableOfContents.md` — оглавление

Динамически генерирует оглавление текущего файла через DataviewJS. Читает файл, извлекает заголовки и строит дерево ссылок с цветным отступом по уровню.

### `_ 📊 Статистика задач.md` — статистика задач

DataviewJS-сниппет, показывающий количество задач по статусам в текущем файле.

### `_История болезни Шаблон.md` — история болезни

Шаблон для медицинских случаев (Проекты > Истории болезней).

---

## Использование из QuickAdd

Templater-шаблоны вызываются через QuickAdd-макросы как команды Obsidian:

```
commandId: "templater-obsidian:create-_.Settings/Templates/Templater/_  📄CommonPage.md"
```

---

## Типичные паттерны в этом хранилище

```js
<%*
// Показать suggester и вставить результат в документ
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
