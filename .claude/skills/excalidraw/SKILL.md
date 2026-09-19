---
name: excalidraw
description: Excalidraw file format, embedding syntax, the vault's script library, how Excalidraw files interact with Dataview queries, and node tooling for editing .excalidraw.md scenes programmatically. Use when creating, embedding, querying, or bulk-editing .excalidraw.md diagrams.
---

# excalidraw

Плагин `obsidian-excalidraw-plugin`. Схемы хранятся как `.excalidraw.md` — Markdown с JSON-блоком внутри.

## Структура файла

Frontmatter: `excalidraw-plugin: parsed`, `tags: [excalidraw]`, опционально `aliases`. Далее предупреждающая строка и скрытый `%%`-блок с секциями `## Text Elements`, `## Embedded Files`, `## Drawing`. В последней — сцена:

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [],
  "appState": { "theme": "dark", "gridSize": null, "viewBackgroundColor": "#ffffff" }
}
```

На практике в хранилище сцена лежит не открытым текстом, а в блоке ` ```compressed-json ` — сжатая LZ-String. Прочитать её `cat`/`grep` нельзя; распаковка — в `scripts/` (см. ниже). Развернуть вручную: Command Palette → `Decompress current Excalidraw file`.

При `excalidraw-plugin: parsed` текст блоков берётся из секции `## Text Elements`, а не из JSON сцены — это источник правды.

Для редактирования файл открывают через More Options (⋯) → "Open as Excalidraw".

## Создание

- Command Palette → `Excalidraw: Create new drawing`
- Из шаблона хранилища: `_.Settings/Templates/Templater/Template.excalidraw.md`
- Через CLI: `obsidian vault="ObsiNotes" create name="Схема" template="Template.excalidraw"`

## Встраивание в заметку

```markdown
![[Мисматчи в sgRNA.excalidraw.md]]              # полное, изменяемое
![[Мисматчи в sgRNA.excalidraw.light.png]]       # картинка, светлая тема
![[Мисматчи в sgRNA.excalidraw.dark.png]]        # картинка, тёмная тема
![[Схема.excalidraw.md|400]]                     # с шириной
```

Плагин автоматически экспортирует `.light.png` и `.dark.png` рядом с исходником.

## Расположение в хранилище

Excalidraw-файлы лежат **прямо в `Notes/`**, рядом с обычными заметками:

```
Notes/
├── Мисматчи в sgRNA.excalidraw.md
├── Мисматчи в sgRNA.excalidraw.dark.png
├── Мисматчи в sgRNA.excalidraw.light.png
└── Эволюция транспозоны.excalidraw.md
```

Семантические метатеги им обычно **не** проставляются — это визуальное дополнение к текстовым заметкам, а не самостоятельные единицы знания.

Папка `Excalidraw/Scripts/Downloaded/` содержит только community-скрипты, не схемы.

## Фильтрация в Dataview

У всех Excalidraw-файлов `tags: [excalidraw]`:

```js
dv.pages('-#dv_exclude and -#excalidraw')   // исключить схемы
dv.pages('#excalidraw')                     // только схемы
```

Metadata Menu их игнорирует: `fileIndexingExcludedExtensions: [".excalidraw.md"]`.

## Библиотека скриптов

`Excalidraw/Scripts/Downloaded/` — запуск через Command Palette → `Excalidraw: Run Excalidraw Script`, либо кнопкой на панели Excalidraw.

| Скрипт | Назначение |
|--------|-----------|
| `Auto Layout.md` | Автоматическое размещение элементов |
| `Box Selected Elements.md` | Обрамить выбранное в прямоугольник |
| `Ellipse Selected Elements.md` | Обрамить в эллипс |
| `Change shape of selected elements.md` | Изменить форму |
| `Expand rectangles vertically.md` | Растянуть по вертикали |
| `Expand rectangles vertically keep text centered.md` | То же с центрированием текста |
| `Fixed spacing.md` | Равномерные расстояния |
| `Fixed vertical distance.md` | Фиксированное вертикальное расстояние |
| `Fixed vertical distance between centers.md` | Расстояние между центрами |
| `Grid Selected Images.md` | Изображения в сетку |
| `Mindmap connector.md` | Соединить как mindmap |
| `Mindmap format.md` | Форматировать как mindmap |
| `Normalize Selected Arrows.md` | Нормализовать стрелки |
| `Uniform size.md` | Одинаковый размер элементов |

Новые скрипты: Excalidraw Settings → Script Engine → указать папку.

## Программная правка схемы

Когда правок много и они механические (пересчитать числа, добавить десяток подписей, разложить блок комментариев), мышью это долго. В `scripts/` — инструменты для правки `.excalidraw.md` вне Obsidian; требуется только `node`, зависимостей нет.

| Файл | Назначение |
| --- | --- |
| `scripts/excalidraw-io.js` | Основной модуль: `load()` → правки → `save()`. Сам распаковывает сцену, пересобирает `## Text Elements` и упаковывает обратно в формате плагина |
| `scripts/lzstring.js` | Кодек LZ-String для блока `compressed-json` |
| `scripts/dump-scene.js` | Читаемая выгрузка сцены: id, координаты, текст, привязки (`--tree` — только граф стрелок) |
| `scripts/check-overlap.js` | Не легли ли новые блоки поверх существующих |
| `scripts/render-preview.js` | Отрендерить PNG через запущенный Obsidian, чтобы посмотреть результат |

```bash
S=".claude/skills/excalidraw/scripts"
node "$S/dump-scene.js" "Projects/.../Схема.excalidraw.md" --tree
node "$S/check-overlap.js" "Projects/.../Схема.excalidraw.md" --color "#6741d9"
node "$S/render-preview.js" "Projects/.../Схема.excalidraw.md" "media/_preview.png"
```

__Перед записью в хранилище читай [references/EDITING-PROGRAMMATICALLY.md](references/EDITING-PROGRAMMATICALLY.md)__ — там устройство формата, требование «id текстового элемента ровно 8 символов» и, главное, ловушка с __Obsidian Linter__: при внешней записи он вставляет пустые строки внутрь многострочных текстовых элементов и разваливает вёрстку схемы, причём через секунду-две после того, как скрипт отрапортовал об успехе.

## Экспорт

More Options → Export image → PNG / SVG. Автоэкспорт PNG при сохранении настраивается в плагине.

```bash
obsidian vault="ObsiNotes" commands filter="excalidraw"
```
