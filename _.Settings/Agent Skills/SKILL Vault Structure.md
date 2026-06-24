---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Полная анатомия хранилища ObsiNotes — структура папок, метатеги, индексы, плагины
tags: []
type: 📄note
---

# SKILL — Структура хранилища ObsiNotes

## Назначение хранилища

**ObsiNotes** — академическое хранилище студента-медика с уклоном в биоинформатику. Содержит учебные заметки, пайплайны анализа данных, клинические случаи, рефераты и медиатреккинг.

---

## Топ-уровень хранилища

```
ObsiNotes/
├── Notes/              # Все содержательные заметки (flat, ~200+ файлов)
├── Projects/           # Проекты с директорийной структурой
│   ├── _To restore/    # Файлы для восстановления
│   ├── Истории болезней/   # Медицинские истории болезней
│   └── Статьи и рефераты/  # Академические работы
├── _. Home/            # Навигационный хаб (не читать = читать только через DV)
│   ├── Indexes/        # Индексные страницы по меатетегам
│   ├── Bases/          # Obsidian Bases (.base файлы)
│   ├── $nsmu.md        # Tag-index: заметки СГМУ (тег nsmu)
│   ├── $📌pin.md       # Tag-index: закреплённые заметки
│   └── _Карта хранилища.md  # Главная страница (dg-home: true)
├── Clippings/          # Веб-клиппинги (статьи из браузера)
├── Lists/              # Списки к экзаменам
├── Excalidraw/         # Скрипты Excalidraw
│   └── Scripts/Downloaded/
├── _.Settings/         # Конфигурация (невидимо в основном графе)
│   ├── Agent Skills/   # Скилы для AI-агента (этот файл)
│   ├── Templates/      # Автоматизация (Templater, QuickAdd, Dataview)
│   └── Media/          # Вставленные изображения
├── .obsidian/          # Конфиг Obsidian (плагины, настройки)
└── .git/               # Git-репозиторий (obsidian-git для backup)
```

---

## Методология семантической классификации заметок

### Принцип

Заметки классифицируются не по папкам, а по **frontmatter-метатегам**. Каждый метатег — это emoji-именованное поле с массивом подкатегорий (субиндексов).

Одна заметка может иметь **несколько метатегов** одновременно.

### Структура метатега в заметке

```yaml
# Заметка Notes/DADA2.md
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
  - preprocessing
🧬Sequencing:
  - trimming
```

### Структура метатега в индексной странице

```yaml
# _. Home/Indexes/💻Bioinfo/💻Bioinfo.md
type: 🗂️index
tags:
  - dv_exclude
💻Bioinfo:
  - index          # ← значение "index" означает "это главная страница раздела"
```

### Как работает indexPage dataview

1. Читает frontmatter текущей страницы
2. Находит ключи со значением `index` в массиве → это "индексы"
3. Для каждого индекса: находит все заметки с этим ключом во frontmatter
4. Собирает уникальные субиндексы и создаёт навигационные ссылки Obsidian-поиска
5. Показывает закреплённые и недавно изменённые заметки

---

## Полный список метатегов-индексов

| Метатег | Область | Примеры субиндексов |
|---------|---------|---------------------|
| `💻Bioinfo` | Биоинформатика | `tool`, `database`, `fileformat` |
| `📊Transcriptomics` | Транскриптомика/РНКseq | `bulkRNAseq`, `preprocessing`, `DE` |
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

---

## Стандартные теги (tags: поле)

| Тег | Назначение |
|-----|-----------|
| `dv_exclude` | Исключить из всех datview-запросов. Все индексные страницы. |
| `📌pin` | Закрепить в разделе. Показывается первым в indexPage |
| `task` | Заметки-задачи |
| `nsmu` | Заметки связанные с СГМУ (университет) |
| `🎬grw` | Got/Reading/Watching — медиатреккинг |
| `excalidraw` | Excalidraw-схемы |

---

## Типы заметок (`type:` поле)

| Тип | Описание |
|-----|---------|
| `📄note` | Стандартная заметка (по умолчанию) |
| `🗂️index` | Индексная страница раздела |
| `📄paper` | Научная статья (из Zotero) |

---

## Прочие стандартные frontmatter-поля

| Поле | Назначение |
|------|-----------|
| `aliases` | Альтернативные имена для поиска |
| `date` | Дата создания (DD-MM-YYYY, из ctime файла) |
| `dg-publish` | Публикация в Digital Garden (`true`/`false`) |
| `parent` | Ссылка на родительскую заметку `[[Имя]]` |
| `summary` | Краткое описание (для indexPage и AI) |
| `wiki_link` | Внешняя ссылка (документация, Wikipedia) |

---

## Индексная система (_. Home/Indexes/)

### Типы индексных страниц

**1. Простые индексы** (один файл `.md` в папке Indexes):
```
_. Home/Indexes/☣️Immunology.md   # один файл
```

**2. Составные индексы** (папка с вложенными суб-индексами):
```
_. Home/Indexes/💻Bioinfo/
├── 💻Bioinfo.md        # главный индекс
├── Программы.md        # суб-индекс: только tool
├── Базы данных.md      # суб-индекс: только database
├── Форматы файлов.md   # суб-индекс: только fileformat
└── ИИ инструменты биоинформатики.md
```

**3. Tag-индексы** (`$` prefix):
```
_. Home/$nsmu.md   # использует tagDataview.js (по тегу, не по ключу)
_. Home/$📌pin.md  # закреплённые заметки
```

### Frontmatter суб-индекса

Суб-индексная страница показывает только определённые субиндексы:

```yaml
# _. Home/Indexes/💻Bioinfo/Программы.md
type: 🗂️index
tags:
  - dv_exclude
💻Bioinfo:
  - index
  - tool      # ← дополнительно показать только "tool"
```

---

## Структура Projects/

В отличие от Notes, Projects организованы по **директориям**, а не метатегам.

```
Projects/
├── _To restore/         # временное хранение файлов для восстановления
├── Истории болезней/    # клинические случаи (шаблон: _История болезни Шаблон)
└── Статьи и рефераты/   # академические работы
```

Projects не участвуют в indexPage datview — они исключены из `dv.pages('-#dv_exclude')` только если имеют тег `dv_exclude`.

---

## _.Settings — конфигурационные файлы

```
_.Settings/
├── Agent Skills/         # этот и другие скилы агента
├── Templates/
│   ├── Templater/        # шаблоны (9 файлов)
│   ├── Scripts/          # QuickAdd JS-скрипты (3 файла)
│   ├── dataviews/        # TypeScript исходники dataview
│   ├── dist/             # скомпилированные dataview
│   ├── build-dataviews.cjs   # сборочный скрипт
│   ├── package.json
│   └── tsconfig.base.json
├── Media/                # вставленные изображения (из буфера)
├── gost-r-7-0-5-2008-numeric.csl    # стиль цитирования для Pandoc
└── gost-r-7-0-5-2008-numeric-alphabetical.csl
```

---

## Установленные плагины

### Ключевые плагины (используются активно)

| Плагин | ID | Назначение |
|--------|----|-----------|
| Dataview | `dataview` | Запросы к заметкам, indexPage |
| Templater | `templater-obsidian` | Шаблоны заметок |
| QuickAdd | `quickadd` | Макросы автоматизации |
| Metadata Menu | `metadata-menu` | Управление полями frontmatter |
| Obsidian Linter | `obsidian-linter` | Форматирование frontmatter |
| Zotero Connector | `obsidian-zotero-desktop-connector` | Импорт статей |
| Excalidraw | `obsidian-excalidraw-plugin` | Схемы и рисунки |
| Git | `obsidian-git` | Резервное копирование |
| Pandoc | `obsidian-pandoc` | Экспорт в DOCX/PDF |
| Tasks | `obsidian-tasks-plugin` | Расширенные задачи |

### Дополнительные плагины

| Плагин | ID | Назначение |
|--------|----|-----------|
| Calendar | `calendar` | Дневник / календарь |
| Kanban | `obsidian-kanban` | Канбан-доски |
| Breadcrumbs | `breadcrumbs` | Навигация по иерархии (parent-поле) |
| Tag Wrangler | `tag-wrangler` | Переименование тегов |
| Tag Folder | `obsidian-tagfolder` | Теги как папки в боковой панели |
| Supercharged Links | `supercharged-links-obsidian` | Стилизация ссылок по frontmatter |
| Annotator | `obsidian-annotator` | Аннотации PDF |
| Readwise | `readwise-official` | Синхронизация хайлайтов |
| Projects | `obsidian-projects` | Управление проектами |
| Admonition | `obsidian-admonition` | Блоки callout (расширение) |
| Charts | `obsidian-charts` | Графики в заметках |
| Style Settings | `obsidian-style-settings` | Настройка CSS-темы |
| Advanced Canvas | `advanced-canvas` | Расширение Canvas |

---

## Главная страница (_Карта хранилища.md)

Содержит:
- `dg-home: true` — домашняя страница Digital Garden
- Статистику создания/изменения заметок за последние 7 дней (DataviewJS + Charts)
- Список 15 последних изменённых файлов с временем изменения

---

## Clippings/

Веб-клиппинги из браузера. Нет единого шаблона frontmatter — файлы создаются плагином auto-link или вручную. Тематика: IT, облачные технологии, n8n, Docker.

---

## Lists/

Списки для подготовки к экзаменам:
- `Экзамен по невре СГМУ лето 2026.md`
- `Экзамен по фарме СГМУ лето 2025.md`

---

## Git-репозиторий хранилища

- **Текущая ветка**: `claude-refactor`
- **Main**: ветка для backup
- **Плагин**: obsidian-git (автокоммит по расписанию)
- `.gitignore`: исключает node_modules, системные файлы

---

## Специфика агентной работы с хранилищем

### Что читать ПЕРВЫМ при новой задаче

1. Этот файл (структура)
2. `SKILL Obsidian CLI.md` (команды для работы с vault)
3. `SKILL DataviewJS.md` (если касается dataview)
4. Frontmatter нескольких существующих заметок для понимания текущей нормы

### Чего НЕ делать

- Создавать папки в `Notes/` — заметки должны оставаться flat
- Добавлять `dv_exclude` тег к обычным заметкам
- Менять `type` без понимания зачем
- Создавать новые семантические индексы без обсуждения с пользователем
