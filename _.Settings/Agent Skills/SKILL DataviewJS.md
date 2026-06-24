---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Справочник по DataviewJS API и TypeScript-репозиторию датавью этого хранилища
tags: []
type: 📄note
---

# SKILL — DataviewJS & TypeScript-репозиторий

## Что такое DataviewJS

DataviewJS — JavaScript-интерфейс плагина **Dataview** (v0.5.68). Вызывается внутри блока:

````md
```dataviewjs
// код
```
````

Для внешних view-файлов (JS в папке хранилища):

````md
```dataviewjs
dv.view('_.Settings/Templates/dist/dataviews/indexPage')
```
````

Путь указывается без `.js` расширения — Dataview добавляет его автоматически и ищет файл `view.js` в этой папке.

---

## Ключевые объекты

| Объект | Описание |
|--------|----------|
| `dv` | Главный API-объект |
| `app` | Объект Obsidian App |
| `input` | Аргументы переданные при `dv.view(path, input)` |

---

## Запросы страниц

```js
// Все страницы
dv.pages()

// Исключить страницы с тегом dv_exclude
dv.pages('-#dv_exclude')

// Страницы с тегом
dv.pages('#tag')

// Страницы из папки
dv.pages('"Notes"')

// Объединение условий
dv.pages('#tag1 and #tag2')
dv.pages('#tag or "Notes"')

// Страницы по полю frontmatter
dv.pages('[💻Bioinfo]')

// Текущая страница
dv.current()
dv.current().file.frontmatter
dv.current().file.tags      // массив тегов включая иерархические
dv.current().file.path
dv.current()['💻Bioinfo']   // значение frontmatter-поля
```

---

## DataArray — операции над коллекциями

DataArray — это обёртка над массивом с ленивыми операциями:

```js
const pages = dv.pages('-#dv_exclude')

// Фильтрация
pages.filter(p => p.tags?.includes('📌pin'))
pages.where(p => p.file.mtime > dv.date('2025-01-01'))

// Сортировка (второй аргумент "asc"/"desc")
pages.sort(p => p.file.mtime, 'desc')

// Срез
pages.slice(0, 10)

// Маппинг
pages.map(p => p.file.link)

// flatMap
pages.flatMap(p => Array.isArray(p.tags) ? p.tags : [p.tags])

// Группировка
pages.groupBy(p => p.file.mday)

// Конвертация в обычный JS массив
pages.array()

// Длина
pages.length
```

---

## Объект `file`

```js
const p = dv.current()

p.file.name       // имя без расширения
p.file.path       // полный путь
p.file.link       // [[ссылка]] объект
p.file.mtime      // момент последнего изменения (luxon DateTime)
p.file.ctime      // момент создания
p.file.mday       // дата изменения (luxon DateTime, только дата)
p.file.cday       // дата создания
p.file.size       // размер в байтах
p.file.tags       // массив тегов (строки с #)
p.file.etags      // теги включая родительские
p.file.frontmatter  // объект со всеми frontmatter полями
p.file.tasks      // задачи в файле
p.file.lists      // списки
p.file.inlinks    // входящие ссылки
p.file.outlinks   // исходящие ссылки
```

---

## Рендеринг

```js
// Заголовок (level = 1-6)
dv.header(1, 'Заголовок')

// Параграф (поддерживает Markdown и HTML)
dv.paragraph('Текст с **жирным** и `кодом`')
dv.paragraph('<span class="text_pill red">pill</span>')

// Список
dv.list(['элемент 1', p.file.link, 'текст'])

// Таблица
dv.table(
  ['Название', 'Тег', 'Summary'],
  pages.map(p => [p.file.link, p.tags, p.summary])
)

// Маркдаун-таблица (для сложных случаев)
const md = dv.markdownTable(['Кол', 'Знач'], [['a', 1]])
dv.paragraph(md)

// Задачи
dv.taskList(pages.file.tasks)
```

---

## Дата и время

```js
// Текущая дата
dv.date('today')
dv.date('now')
dv.date('2025-06-01')

// Длительность
dv.duration('1 day')
dv.duration('2 weeks')

// Luxon DateTime доступен как DateTime
DateTime.fromMillis(p.file.mtime.ts)
DateTime.now().toLocaleString({ month: 'long', day: 'numeric' })

// Сравнение
dv.equal(dv.date(p.file.cday), dv.date('today'))
```

---

## Ссылки

```js
// Ссылка на секцию
dv.sectionLink('path/to/file.md', 'Heading Text', false, 'Display Text')

// Динамически создать URL для поиска в Obsidian
const url = `[текст](obsidian://search?query=["поле":"значение"])`
dv.paragraph(url)
```

---

## Ввод/вывод файлов

```js
// Прочитать содержимое файла (async)
const content = await dv.io.load('path/to/file.md')

// Получить страницу по пути
const page = dv.page('Notes/DADA2.md')
```

---

## Доступ к Obsidian App API

```js
// Из dataviewjs app доступен напрямую
const files = app.vault.getMarkdownFiles()
const cache = app.metadataCache.getFileCache(file)
```

---

## Специфика этого хранилища

### Структура frontmatter заметки

```yaml
aliases: []
date: 23-06-2026       # формат DD-MM-YYYY (генерит Linter)
dg-publish: true
parent:                # [[Родительская заметка]]
summary:               # краткое описание (генерит QuickAdd AI)
tags: []               # стандартные теги Obsidian
type: 📄note           # тип: 📄note | 🗂️index | 📄paper
# --- Семантические индексы ---
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
```

### Тег `dv_exclude`

Все индексные страницы имеют `tags: [dv_exclude]`.
В запросах всегда фильтруй: `dv.pages('-#dv_exclude')`.

### Тег `📌pin`

Закреплённые заметки: `tags: [📌pin]`.
Используется в компоненте `displayPinnedNotes`.

---

## TypeScript-репозиторий dataviews

### Расположение

```
_.Settings/Templates/
├── dataviews/          # исходники TypeScript
│   └── indexPage/      # единственный собранный view
│       ├── view.ts     # точка входа (РАБОЧИЙ)
│       ├── dvWrappers/
│       │   └── getIndexes.ts
│       └── views/
│           ├── viewComponent.ts     # базовый класс Component
│           ├── searchTemplate.ts    # obsiduanQueryTemplate()
│           ├── pinedNotes.ts        # displayPinnedNotes()
│           ├── recentNotes.ts       # displayRecentNotes()
│           ├── singleIndexView.ts   # класс SingleIndexView (РАБОЧИЙ)
│           └── commonIndexPageVIew.ts  # ⚠️ НЕЗАВЕРШЁН
├── dist/dataviews/indexPage/view.js # скомпилированный файл (ИСПОЛЬЗУЕТСЯ)
└── build-dataviews.cjs              # сборочный скрипт
```

### Статус реализации

| Файл | Статус | Описание |
|------|--------|----------|
| `view.ts` | ✅ Рабочий | Точка входа, вызывает `displayIndexes()` |
| `dvWrappers/getIndexes.ts` | ✅ Рабочий | Находит index-поля во frontmatter |
| `views/pinedNotes.ts` | ✅ Рабочий | `displayPinnedNotes()` |
| `views/recentNotes.ts` | ✅ Рабочий | `displayRecentNotes()` |
| `views/searchTemplate.ts` | ✅ Рабочий | `obsiduanQueryTemplate()` |
| `views/singleIndexView.ts` | ✅ Рабочий | Класс `SingleIndexView` |
| `views/viewComponent.ts` | ✅ Рабочий | Базовый класс `Component` |
| `views/commonIndexPageVIew.ts` | ⚠️ Незавершён | `IndexPageTemplate.render()` пуст — незаконченный рефакторинг |

### `commonIndexPageVIew.ts` — что не доделано

Файл содержит попытку рефакторинга на компонентную архитектуру:
- `IndexPageTemplate` — собирает `indexesWithSubindexes`, но не вызывает дочерние компоненты в `render()`
- `IndexPageTemplateView` — рисует только шапку (`dv.paragraph`), не рисует сами индексы

**Что нужно доделать:**
1. В `IndexPageTemplate.render()` создать `IndexPageTemplateView` с собранными данными и вызвать `view.render()`
2. В `IndexPageTemplateView.render()` добавить итерацию по indexes и рендеринг `SingleIndexView` для каждого

### Сборка

```bash
cd "_.Settings/Templates"
node build-dataviews.cjs
```

Компилирует каждую папку в `dataviews/*/` (требует `tsconfig.json`) в `dist/*/view.js`.

### Архитектура `/// <reference>`

TypeScript файлы объединяются через `/// <reference path>` директивы (не ES-модули).
`tsc --outFile view.js` собирает всё в один файл. Порядок reference важен.

---

## Типовые паттерны для этого хранилища

### Показать все заметки с индексом и подиндексом

```js
const index = '💻Bioinfo'
const subindex = 'tool'
const pages = dv.pages('-#dv_exclude')
  .filter(p => p.file.frontmatter[index]?.includes(subindex))
dv.list(pages.map(p => p.file.link))
```

### Получить все подиндексы конкретного индекса

```js
const index = '🦠Metagenomics'
const allSubindexes = dv.pages('-#dv_exclude')
  .flatMap(p => {
    const val = p.file.frontmatter[index]
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  })
  .array()
const unique = [...new Set(allSubindexes)].sort()
```

### Список заметок с незаполненным summary

```js
dv.list(
  dv.pages('-#dv_exclude')
    .filter(p => !p.summary)
    .map(p => p.file.link)
)
```
