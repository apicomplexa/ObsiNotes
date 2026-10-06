---
name: quickadd
description: QuickAdd macros, UserScript API, and the vault's existing scripts (convertLinks, format_with_regexp, restore_from_tech_copy) plus the DOCX export pipeline. Use when inspecting, running, or modifying QuickAdd automation.
---

# quickadd

QuickAdd (v2.12.3) — автоматизация через макросы. В этом хранилище используется только тип **Macro**.

## Типы команд в макросе

| Тип | Описание |
|-----|----------|
| `Obsidian` | Команда Command Palette по `commandId` |
| `UserScript` | JS-файл из `templateFolderPath` |
| `Wait` | Пауза в мс |
| `AI` | AI-промпт через настроенный провайдер |

## Настройки хранилища

```json
{
  "templateFolderPath": "_.Settings/Templates/Scripts",
  "inputPrompt": "multi-line",
  "disableOnlineFeatures": true,
  "ai": { "defaultModel": "gpt-4o", "providers": [{ "name": "g4f", "endpoint": "https://gpt-api.apicomplexa.com/v1" }] }
}
```

## UserScript API

```js
module.exports = async (params) => {
    const { app, quickAddApi } = params;

    const file = app.workspace.getActiveFile();
    const content = await app.vault.read(file);
    await app.vault.modify(file, newContent);

    const input = await quickAddApi.inputPrompt("Заголовок", "placeholder", "default");
    const selected = await quickAddApi.suggester(["A", "B"], ["a", "b"]);
    const yn = await quickAddApi.yesNoPrompt("Вопрос?");

    const response = await quickAddApi.ai.prompt(promptText, model, settings);
}
```

Текст диалогов — на русском. Ошибки логируй в `console.error`, не роняй макрос.

## Макросы хранилища

### `New common note`
Создать заметку по стандартному шаблону.
1. `workspace:new-tab`
2. Создать файл из `_  📄CommonPage.md`

### `Export: DOC`
Экспорт текущей заметки в DOCX с форматированием.
1. `docx_style_begin.js` — выбор стиля оформления (suggester), подмена настроек obsidian-pandoc в памяти
2. `make_tech_copy.js` — создаёт TECH_COPY с исходника, дописывает маркер
3. `convertLinks.js` — wikilinks в markdown-ссылки, врезки раскрываются
4. `format_with_regexp.js` — callouts и task-символы в Unicode (копию не трогает, если маркер уже стоит)
5. Wait 1000 мс
6. `obsidian-pandoc:pandoc-export-docx`
7. Wait 1000 мс
8. `docx_style_finish.js` — ждёт файл, переносит его в папку экспорта, возвращает настройки плагина
9. `restore_from_tech_copy.js` — восстановить оригинал

Шаги 3–4 **портят оригинальный файл** ради совместимости с Pandoc; TECH_COPY хранит исходник для отката.
Копия обязана сниматься **до** `convertLinks.js` — иначе откат вернёт раскрытый текст (баг до 06-10-2026).
Если экспорт оборвался (отменили выбор уровня рекурсии и т. п.), следующий запуск `make_tech_copy.js`
сам вернёт заметку из TECH_COPY и продолжит.

#### Стили оформления DOCX (`_.Settings/Pandoc/`)

| Стиль | Файлы | Имя результата |
| --- | --- | --- |
| 📄 Официальный — A4, Times New Roman 12, поля 2 / 1 / 1,5 / 1,5 см (лево / право / верх / низ), каждый заголовок 1 уровня с новой страницы, титул без номера, номера страниц внизу по центру, оглавление (Word предложит обновить поля при открытии) | `official.yaml`, `reference-official.docx` | `<заметка>.docx` |
| 📱 Для телефона — страница 9,5 × 19 см, Arial 11, без абзацного отступа и выравнивания по ширине, без разрывов страниц и оглавления | `mobile.yaml`, `reference-mobile.docx` | `<заметка> (телефон).docx` |

- `docx_style_begin.js` добавляет `--defaults=_.Settings/Pandoc/<стиль>.yaml` поверх `_.Settings/pandoc-defaults.yaml`
  и временно направляет вывод плагина во временную папку: плагин всегда называет файл по имени заметки,
  иначе стили перезаписывали бы друг друга. Настройки плагина **не сохраняются** на диск, только в памяти.
- Оформление живёт в reference-docx. Не править их в Word — править словари в `build_reference_docs.py`
  и пересобирать: `python3 "_.Settings/Pandoc/build_reference_docs.py"` (stdlib, нужен только pandoc).
- `docx-captions.lua` (подключён в обоих yaml): абзац из одного `__Таблица N. …__` → стиль «Table Caption»
  (держится с таблицей), абзац из одной картинки → «Figure» (по центру), `_Схема N. …_` / `_Рисунок …_` →
  «Image Caption». Подписи в заметках пишутся обычным markdown.
- Новый стиль: `<имя>.yaml` + функция в `build_reference_docs.py` + строка в `STYLES` в `docx_style_begin.js`.
- Пути к yaml не должны содержать пробелов: плагин режет `extraArguments` по пробелам.

### `🖨️Make tech copy`
Не выведен в Choices. Сохранить файл, затем `format_with_regexp.js`.

## Скрипты (`_.Settings/Templates/Scripts/`)

### `convertLinks.js`
Рекурсивно раскрывает ссылки в чистый Markdown:
- `[[Заметка]]` в `[Заметка](путь/к/Заметка.md)`
- `![[Заметка]]` в полное содержимое (без frontmatter)
- `![[Заметка#Раздел]]` — только раздел
- `![[Заметка#^блок]]` — только блок

Глубину рекурсии (1–7, по умолчанию 3) спрашивает через `suggester`. Сломанные ссылки идут в `console.error`, выполнение не прерывается.

### `make_tech_copy.js`
Создаёт `TECH_COPY_ИмяФайла.md` в корне хранилища с текущего (исходного) текста и дописывает
в заметку маркер `<!-- TECH_COPY_PATH--путь -->`. Прерывает макрос (`params.abort`), если маркер
уже есть в заметке или TECH_COPY уже лежит в корне — это следы оборванного экспорта, затирать нельзя.

### `format_with_regexp.js`
1. Если маркер уже стоит и TECH_COPY существует — только шаг 2.
2. Заменяет Obsidian-синтаксис на Unicode для Pandoc.
3. Иначе (самостоятельный запуск) — создаёт `TECH_COPY_ИмяФайла.md` и дописывает маркер.

Маркер — HTML-комментарий: pandoc выбрасывает его из DOCX, а старый `%%…%%` попадал в текст.

Callouts: `[!$]`/`[!def]` → `➡️`, `[!note]` → `🖋️`, `[!abstract]` → `🗒️`, `[!info]` → `❕`, `[!todo]` → `✅`, `[!tip]` → `🔥`, `[!success]` → `✔️`, `[!warning]` → `⚠️`, `[!failure]` → `❌`, `[!danger]` → `⚡`, `[!bug]` → `🪲`, `[!example]` → `🟰`

Задачи: `- [ ]` → `◯`, `- [x]` → `●`, `- [/]` → `◑`, `- [-]` → `⊝`, `- [>]` → `➤`, `- [<]` → `📅`, `- [?]` → `❓`, `- [!]` → `⚠️`, `- [*]` → `⭐`

### `restore_from_tech_copy.js`
Читает маркер (`<!-- TECH_COPY_PATH--путь -->` или старый `%%TECH_COPY_PATH--путь%%`), переписывает заметку текстом TECH_COPY через `vault.modify` и удаляет копию. Без маркера не работает.

## Запуск из CLI

```bash
obsidian vault="ObsiNotes" quickadd:list commands
obsidian vault="ObsiNotes" quickadd:check choice="New common note"
obsidian vault="ObsiNotes" quickadd:run choice="New common note" vars='{"title":"Kraken2"}'
```

Без флага `ui` интерактивные диалоги подавляются — передавай значения через `vars` (JSON нужно закавычить в шелле).

## Новый макрос

В `.obsidian/plugins/quickadd/data.json`, массив `choices`:

```json
{
  "id": "uuid",
  "name": "Имя макроса",
  "type": "Macro",
  "command": true,
  "macro": {
    "name": "Имя",
    "id": "uuid",
    "commands": [
      { "name": "Мой скрипт", "type": "UserScript", "path": "_.Settings/Templates/Scripts/myscript.js", "settings": {} }
    ]
  }
}
```

Ручная правка JSON хрупкая — предпочтительно через QuickAdd Settings → Macro → Edit. Если правишь файл, проверь, что он парсится.
