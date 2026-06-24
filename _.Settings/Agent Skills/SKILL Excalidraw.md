---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Работа с Excalidraw в Obsidian — создание схем, скрипты и шаблоны
tags: []
type: 📄note
---

# SKILL — Excalidraw

## Что такое Excalidraw в Obsidian

**Excalidraw** (плагин `obsidian-excalidraw-plugin`) позволяет создавать схемы, диаграммы и рисунки прямо в хранилище. Файлы сохраняются как `.excalidraw.md` и содержат JSON-представление схемы в специальном блоке.

---

## Структура `.excalidraw.md` файла

```markdown
---
excalidraw-plugin: parsed
tags: [excalidraw]
aliases:
  - Название схемы
---

==⚠ Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu ==

%%
# Drawing
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://github.com/...",
  "elements": [...],
  "appState": {
    "theme": "dark",
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```
%%
```

**Важно**: Для просмотра и редактирования нужно открыть файл в режиме Excalidraw через "More Options" (три точки) → "Open as Excalidraw".

---

## Создание файла

### Через Obsidian CLI (когда будет версия 1.12.7+)

```bash
# Создать схему из шаблона
obsidian create name="Название схемы" template="Template.excalidraw"
```

### Через Command Palette

`Excalidraw: Create new drawing`

### Из шаблона

Шаблон хранилища: `_.Settings/Templates/Templater/Template.excalidraw.md`

---

## Вставка Excalidraw в заметку

```markdown
# Полное встраивание (изменяемое)
![[Мисматчи в sgRNA.excalidraw.md]]

# Только как картинка (светлая тема)
![[Мисматчи в sgRNA.excalidraw.light.png]]

# Только как картинка (тёмная тема)
![[Мисматчи в sgRNA.excalidraw.dark.png]]

# С указанием размера
![[Схема.excalidraw.md|400]]
```

Плагин автоматически экспортирует `.light.png` и `.dark.png` рядом с `.excalidraw.md` файлом.

---

## Скрипты Excalidraw в хранилище

Расположение: `Excalidraw/Scripts/Downloaded/`

| Скрипт | Назначение |
|--------|-----------|
| `Auto Layout.md` | Автоматическое размещение элементов |
| `Box Selected Elements.md` | Обрамить выбранные элементы в прямоугольник |
| `Change shape of selected elements.md` | Изменить форму выбранных элементов |
| `Ellipse Selected Elements.md` | Обрамить в эллипс |
| `Expand rectangles vertically.md` | Растянуть прямоугольники вертикально |
| `Expand rectangles vertically keep text centered.md` | То же + центрирование текста |
| `Fixed spacing.md` | Равномерные расстояния |
| `Fixed vertical distance.md` | Фиксированное вертикальное расстояние |
| `Fixed vertical distance between centers.md` | Расстояние между центрами |
| `Grid Selected Images.md` | Разместить изображения в сетку |
| `Mindmap connector.md` | Соединить элементы как mindmap |
| `Mindmap format.md` | Форматировать как mindmap |
| `Normalize Selected Arrows.md` | Нормализовать стрелки |
| `Uniform size.md` | Одинаковый размер элементов |

### Запуск скрипта

Command Palette → `Excalidraw: Run Excalidraw Script` → выбрать скрипт.

Или привязать скрипт к кнопке на панели инструментов Excalidraw.

---

## Полезные команды

```bash
# Список команд Excalidraw (через Obsidian CLI)
obsidian commands filter="excalidraw"

# Типичные ID команд:
# obsidian-excalidraw-plugin:excalidraw-download-lib
# obsidian-excalidraw-plugin:open-image-excalidraw-source
```

---

## Связь с заметками Notes

В хранилище Excalidraw-файлы хранятся прямо в папке `Notes/` рядом с обычными заметками:

```
Notes/
├── Мисматчи в sgRNA.excalidraw.md
├── Мисматчи в sgRNA.excalidraw.dark.png
├── Мисматчи в sgRNA.excalidraw.light.png
└── Эволюция транспозоны.excalidraw.md
```

**Frontmatter** Excalidraw-файлов в этом хранилище обычно не включает семантические метатеги — они служат только визуальным дополнением к текстовым заметкам.

---

## Папка Excalidraw/

Корневая папка `Excalidraw/` содержит скрипты для расширения функциональности:

```
Excalidraw/
└── Scripts/
    └── Downloaded/   # загруженные community-скрипты
```

Для добавления новых скриптов: Excalidraw Settings → Script Engine → указать папку.

---

## Экспорт

Из интерфейса Excalidraw:
- **PNG**: More Options → Export image → PNG
- **SVG**: More Options → Export image → SVG
- Автоэкспорт PNG при сохранении (настраивается в плагине)

---

## Frontmatter тег для фильтрации

Все Excalidraw-файлы имеют `tags: [excalidraw]`. В Dataview:

```js
// Исключить Excalidraw-файлы
dv.pages('-#dv_exclude and -#excalidraw')

// Только Excalidraw-файлы
dv.pages('#excalidraw')
```

Metadata Menu также игнорирует Excalidraw файлы (настроено через `fileIndexingExcludedExtensions: [".excalidraw.md"]`).
