---
name: vault-structure
description: Anatomy of the ObsiNotes vault — folder layout, the emoji-metatag classification table, tags, note types, the index system, and plugin map. Read this before any task that creates, classifies, moves, or audits notes.
---

# vault-structure

Справочник по устройству хранилища **ObsiNotes** — академические заметки студента-медика с уклоном в биоинформатику (учебные заметки, пайплайны анализа данных, клинические случаи, рефераты, медиатреккинг).

## Топ-уровень

```
ObsiNotes/
├── Notes/              # Все содержательные заметки — ПЛОСКО, без подпапок
├── Projects/           # Проекты с директорийной структурой
│   ├── _To restore/
│   ├── Истории болезней/
│   └── Статьи и рефераты/
├── _. Home/            # Навигационный хаб
│   ├── Indexes/        # Индексные страницы по метатегам
│   ├── Bases/          # Obsidian Bases (.base)
│   ├── $nsmu.md        # Tag-index: заметки СГМУ
│   ├── $📌pin.md       # Tag-index: закреплённые заметки
│   └── _Карта хранилища.md   # Главная (dg-home: true)
├── Clippings/          # Веб-клиппинги
├── Lists/              # Списки к экзаменам
├── Excalidraw/Scripts/Downloaded/
├── _.Settings/
│   ├── obsidian-kit/   # git-подмодуль: шаблоны Templater, QuickAdd-скрипты, dataviews, стили DOCX (TS → dist/)
│   ├── Pandoc/         # данные хранилища для pandoc: pandoc-defaults.yaml, .csl, article.tplx
│   └── Media/          # Вставленные изображения
├── .claude/            # Скилы и настройки агента
└── .obsidian/          # Конфиг Obsidian
```

## Классификация заметок

Заметки классифицируются **не по папкам, а по emoji-метатегам во frontmatter**. Метатег — поле с массивом субиндексов. У одной заметки может быть несколько метатегов.

```yaml
# Notes/DADA2.md
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
  - preprocessing
🧬Sequencing:
  - trimming
```

### Полный список метатегов

| Метатег | Область | Примеры субиндексов |
|---------|---------|---------------------|
| `💻Bioinfo` | Биоинформатика | `tool`, `database`, `fileformat` |
| `📊Transcriptomics` | Транскриптомика/RNAseq | `bulkRNAseq`, `preprocessing`, `DE` |
| `📊Statistic` | Статистика | `test`, `model`, `distribution` |
| `🦠Metagenomics` | Метагеномика | `16S`, `taxonomicProfiling`, `preprocessing` |
| `🦠Microbiology` | Микробиология | `ОКИ`, `bacteriology` |
| `✂️GeneEdit` | Редактирование генома | `CRISPR`, `tool`, `mechanism` |
| `☣️Immunology` | Иммунология | |
| `🧬Genomics` | Геномика | |
| `🧬Sequencing` | Секвенирование | `NGS`, `trimming`, `QC` |
| `⚙️Methods` | Методы (общие) | |
| `🔬Histology` | Гистология | |
| `💊Pharma` | Фармакология | |
| `🥼Med` | Медицина (клиника) | |
| `☠️Pathology` | Патология | |
| `🧠Neurobio` | Нейробиология | |
| `⚗️Biochemistry` | Биохимия | |
| `📏Proteomic` | Протеомика | |
| `🕰️Enzymes` | Ферменты | |
| `🫀Anatomy` | Анатомия | |
| `🩸Endocrinology` | Эндокринология | |
| `🩸Hematology` | Гематология | |
| `🖥️IT` | ИТ | `algorithm`, `architecture` |

## Теги (`tags:`)

| Тег | Назначение |
|-----|-----------|
| `dv_exclude` | Исключить из всех dataview-запросов. **Только индексные страницы.** |
| `📌pin` | Закрепить в разделе — показывается первым в indexPage |
| `task` | Заметки-задачи |
| `nsmu` | Связанные с СГМУ (университет) |
| `🎬grw` | Got/Reading/Watching — медиатреккинг |
| `excalidraw` | Excalidraw-схемы |

## Типы (`type:`)

| Тип | Описание |
|-----|---------|
| `📄note` | Стандартная заметка (по умолчанию) |
| `🗂️index` | Индексная страница раздела |
| `📄paper` | Научная статья (из Zotero) |

## Стандартные поля frontmatter

| Поле | Назначение |
|------|-----------|
| `aliases` | Альтернативные имена для поиска (массив) |
| `date` | Дата создания, `DD-MM-YYYY`, из ctime файла |
| `dg-publish` | Публикация в Digital Garden (`true`/`false`) |
| `summary` | Краткое описание (для indexPage и AI) |
| `parent` | **Вестигиальное поле — игнорировать** |
| `wiki_link` | Внешняя ссылка (документация, Wikipedia) |

Формат и правила сортировки ключей — см. скил `frontmatter-linter`.

## Индексная система (`_. Home/Indexes/`)

Индексная страница объявляет себя через значение `index` в массиве метатега:

```yaml
# _. Home/Indexes/💻Bioinfo/💻Bioinfo.md
type: 🗂️index
tags:
  - dv_exclude
💻Bioinfo:
  - index
```

Как работает dataview `indexPage`:
1. Читает frontmatter текущей страницы.
2. Находит ключи со значением `index` в массиве — это индексы.
3. Для каждого индекса находит все заметки с этим ключом.
4. Собирает уникальные субиндексы, строит навигационные ссылки Obsidian-поиска.
5. Показывает закреплённые (`📌pin`) и недавно изменённые заметки.

### Три вида индексов

**Простой** — один файл: `_. Home/Indexes/☣️Immunology.md`

**Составной** — папка с суб-индексами:
```
_. Home/Indexes/💻Bioinfo/
├── 💻Bioinfo.md        # главный индекс
├── Программы.md        # суб-индекс: только tool
├── Базы данных.md      # суб-индекс: только database
└── Форматы файлов.md   # суб-индекс: только fileformat
```

Суб-индекс добавляет конкретные субиндексы рядом с `index`:
```yaml
💻Bioinfo:
  - index
  - tool
```

**Tag-индекс** (префикс `$`) — по тегу, а не по ключу; использует `tagDataview.js`:
`_. Home/$nsmu.md`, `_. Home/$📌pin.md`

## Projects/

Организованы по директориям, а не метатегам. В indexPage не участвуют.

## Плагины

**Ключевые:** Dataview (`dataview`), Templater (`templater-obsidian`), QuickAdd (`quickadd`), Metadata Menu (`metadata-menu`), Obsidian Linter (`obsidian-linter`), Zotero Connector (`obsidian-zotero-desktop-connector`), Excalidraw (`obsidian-excalidraw-plugin`), Git (`obsidian-git`), Pandoc (`obsidian-pandoc`), Tasks (`obsidian-tasks-plugin`).

**Дополнительные:** Calendar, Kanban, Breadcrumbs, Tag Wrangler, Tag Folder, Supercharged Links, Annotator, Readwise, Projects, Admonition, Charts, Style Settings, Advanced Canvas.

## Git

Рабочая ветка `claude-refactor`, `main` — backup. obsidian-git автокоммитит `vault backup: <timestamp>`.

## Чего НЕ делать

- Не создавать подпапки в `Notes/` — она плоская.
- Не добавлять `dv_exclude` к обычным заметкам (только индексы).
- Не менять `type` без явной причины.
- Не создавать новые семантические индексы без обсуждения с пользователем.
- `parent:` не заполнять.
