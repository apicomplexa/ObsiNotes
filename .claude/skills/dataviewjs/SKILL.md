---
name: dataviewjs
description: DataviewJS API reference plus the vault's TypeScript dataview repo (_.Settings/Templates/dataviews → dist). Use when writing or debugging a dataviewjs block, an index page view, or editing view.ts sources.
---

# dataviewjs

DataviewJS — JS-интерфейс плагина Dataview (v0.5.68), внутри блока:

````md
```dataviewjs
// код
```
````

Внешний view-файл подключается так (путь без `.js`; Dataview ищет `view.js` в папке):

````md
```dataviewjs
dv.view('_.Settings/Templates/dist/dataviews/indexPage')
```
````

## Ключевые объекты

| Объект | Описание |
|--------|----------|
| `dv` | Главный API |
| `app` | Obsidian App |
| `input` | Аргументы из `dv.view(path, input)` |

## Запросы страниц

```js
dv.pages()                  // все
dv.pages('-#dv_exclude')    // без индексных страниц — дефолт для этого хранилища
dv.pages('#📌pin')
dv.pages('"Notes"')         // из папки
dv.pages('#tag1 and #tag2')
dv.pages('[💻Bioinfo]')     // по наличию frontmatter-поля

dv.current()
dv.current().file.frontmatter
dv.current().file.tags
dv.current()['💻Bioinfo']
dv.page('Notes/DADA2.md')
```

## DataArray

Ленивая обёртка над массивом:

```js
const pages = dv.pages('-#dv_exclude')

pages.filter(p => p.tags?.includes('📌pin'))
pages.where(p => p.file.mtime > dv.date('2026-01-01'))
pages.sort(p => p.file.mtime, 'desc')     // 'asc' | 'desc'
pages.slice(0, 10)
pages.map(p => p.file.link)
pages.flatMap(p => Array.isArray(p.tags) ? p.tags : [p.tags])
pages.groupBy(p => p.file.mday)
pages.array()      // → обычный JS-массив
pages.length
```

## Объект `file`

```js
p.file.name        // имя без расширения
p.file.path
p.file.link        // объект [[ссылки]]
p.file.mtime       // luxon DateTime
p.file.ctime
p.file.mday        // только дата
p.file.cday
p.file.size
p.file.tags        // строки с #
p.file.etags       // включая родительские
p.file.frontmatter
p.file.tasks
p.file.lists
p.file.inlinks
p.file.outlinks
```

## Рендеринг

```js
dv.header(2, 'Заголовок')
dv.paragraph('Текст **жирный** и `код`')
dv.paragraph('<span class="text_pill red">pill</span>')   // HTML работает
dv.list(['элемент', p.file.link])
dv.table(['Название', 'Summary'], pages.map(p => [p.file.link, p.summary]))
dv.paragraph(dv.markdownTable(['Кол', 'Знач'], [['a', 1]]))
dv.taskList(pages.file.tasks)
```

## Дата и время

```js
dv.date('today')
dv.date('now')
dv.date('2026-06-01')
dv.duration('1 day')
dv.duration('2 weeks')

DateTime.fromMillis(p.file.mtime.ts)              // Luxon доступен как DateTime
DateTime.now().toLocaleString({ month: 'long', day: 'numeric' })

dv.equal(dv.date(p.file.cday), dv.date('today'))
```

## Ссылки и ввод-вывод

```js
dv.sectionLink('Notes/DADA2.md', 'Установка', false, 'Как ставить')
dv.paragraph(`[текст](obsidian://search?query=["💻Bioinfo":"tool"])`)

const content = await dv.io.load('Notes/DADA2.md')

const files = app.vault.getMarkdownFiles()       // app доступен напрямую
const cache = app.metadataCache.getFileCache(file)
```

## Конвенции этого хранилища

- Всегда фильтруй `dv.pages('-#dv_exclude')` — индексные страницы не должны попадать в выдачу.
- `📌pin` — закреплённые заметки, компонент `displayPinnedNotes`.
- Excalidraw-файлы исключай отдельно: `dv.pages('-#dv_exclude and -#excalidraw')`.
- Метатеги — поля frontmatter с массивом субиндексов. Полная таблица — в скиле `vault-structure`.

## TypeScript-репозиторий dataviews

```
_.Settings/Templates/
├── dataviews/indexPage/
│   ├── view.ts                     ✅ точка входа, вызывает displayIndexes()
│   ├── dvWrappers/getIndexes.ts    ✅ находит index-поля во frontmatter
│   └── views/
│       ├── viewComponent.ts        ✅ базовый класс Component
│       ├── searchTemplate.ts       ✅ obsiduanQueryTemplate()
│       ├── pinedNotes.ts           ✅ displayPinnedNotes()
│       ├── recentNotes.ts          ✅ displayRecentNotes()
│       ├── singleIndexView.ts      ✅ класс SingleIndexView
│       └── commonIndexPageVIew.ts  ⚠️ НЕЗАВЕРШЁН
├── dist/dataviews/indexPage/view.js   # то, что реально грузится
└── build-dataviews.cjs
```

### Сборка

```bash
cd _.Settings/Templates && npm run build:dv
```

Компилирует каждую папку `dataviews/*/` (нужен `tsconfig.json`) в `dist/dataviews/*/view.js`. Подробности — скил `build-dataviews`.

### Архитектура

Файлы связаны через `/// <reference path>`, **не** ES-модули. `tsc --outFile view.js` склеивает всё в один файл — **порядок reference важен**.

### Незавершённое: `commonIndexPageVIew.ts`

Попытка рефакторинга на компонентную архитектуру, брошенная на полпути:
- `IndexPageTemplate` собирает `indexesWithSubindexes`, но `render()` не вызывает дочерние компоненты.
- `IndexPageTemplateView` рисует только шапку через `dv.paragraph`, сами индексы не рисует.

Чтобы доделать:
1. В `IndexPageTemplate.render()` создать `IndexPageTemplateView` с собранными данными и вызвать `view.render()`.
2. В `IndexPageTemplateView.render()` итерироваться по indexes и рендерить `SingleIndexView` для каждого.

## Типовые паттерны

```js
// Заметки с конкретным индексом и субиндексом
const index = '💻Bioinfo', subindex = 'tool'
dv.list(
  dv.pages('-#dv_exclude')
    .filter(p => p.file.frontmatter[index]?.includes(subindex))
    .map(p => p.file.link)
)

// Все уникальные субиндексы индекса
const all = dv.pages('-#dv_exclude')
  .flatMap(p => {
    const val = p.file.frontmatter['🦠Metagenomics']
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  })
  .array()
const unique = [...new Set(all)].sort()

// Заметки с незаполненным summary
dv.list(dv.pages('-#dv_exclude').filter(p => !p.summary).map(p => p.file.link))
```
