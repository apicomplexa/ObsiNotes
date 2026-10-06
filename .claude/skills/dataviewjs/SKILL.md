---
name: dataviewjs
description: DataviewJS API reference plus the vault's TypeScript views in the obsidian-kit submodule (_.Settings/obsidian-kit/src/dataviews → dist). Use when writing or debugging a dataviewjs block, an index page view, or editing view.ts sources.
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
dv.view('_.Settings/obsidian-kit/dist/dataviews/indexPage')
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

## TypeScript-views в obsidian-kit

Views живут в подмодуле `_.Settings/obsidian-kit` (отдельный репозиторий). Исходники лежат в `src/`, заметки грузят закоммиченный `dist/`.

```
_.Settings/obsidian-kit/
├── src/dataviews/
│   ├── shared/getIndexes.ts        # index-поля во frontmatter (общий для views)
│   ├── indexPage/                  # индексная страница по метатегу
│   │   ├── view.ts                 # точка входа
│   │   └── views/                  # Component, IndexPageTemplate(View), SingleIndexView,
│   │                               # displayPinnedNotes, displayRecentNotes, obsidianQueryTemplate
│   ├── tagIndexPage/view.ts        # страница по тегам текущей заметки ($nsmu, $📌pin)
│   └── tableIndex/view.ts          # таблицы «заметка / summary / индексы» по подиндексам
├── types/                          # dv (DataviewApi), Note, DataArray — глобальные декларации
└── dist/dataviews/<name>/view.js   # то, что реально грузится
```

Файлы — обычные ES-модули с `import`. esbuild собирает каждый `view.ts` в один `view.js` формата iife; `dv` и `input` — глобалы, которые Dataview подставляет при `dv.view()`. Если рядом лежит `view.css`, он копируется в `dist`.

Новый view: папка `src/dataviews/<name>/` с `view.ts`. Сборка и коммит описаны в скиле `build-kit` (`pixi run build`).

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
