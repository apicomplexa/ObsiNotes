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
1. `convertLinks.js` — wikilinks в markdown-ссылки
2. `format_with_regexp.js` — callouts и task-символы в Unicode, создаёт TECH_COPY
3. Wait 1000 мс
4. `obsidian-pandoc:pandoc-export-docx`
5. Wait 1000 мс
6. `restore_from_tech_copy.js` — восстановить оригинал

Шаги 1–2 **портят оригинальный файл** ради совместимости с Pandoc; TECH_COPY хранит исходник для отката.

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

### `format_with_regexp.js`
1. Создаёт `TECH_COPY_ИмяФайла.md` в корне хранилища.
2. Заменяет Obsidian-синтаксис на Unicode для Pandoc.
3. Дописывает маркер `%%TECH_COPY_PATH--путь%%` в конец файла.

Callouts: `[!$]`/`[!def]` → `➡️`, `[!note]` → `🖋️`, `[!abstract]` → `🗒️`, `[!info]` → `❕`, `[!todo]` → `✅`, `[!tip]` → `🔥`, `[!success]` → `✔️`, `[!warning]` → `⚠️`, `[!failure]` → `❌`, `[!danger]` → `⚡`, `[!bug]` → `🪲`, `[!example]` → `🟰`

Задачи: `- [ ]` → `◯`, `- [x]` → `●`, `- [/]` → `◑`, `- [-]` → `⊝`, `- [>]` → `➤`, `- [<]` → `📅`, `- [?]` → `❓`, `- [!]` → `⚠️`, `- [*]` → `⭐`

### `restore_from_tech_copy.js`
Читает маркер `%%TECH_COPY_PATH--путь%%`, удаляет текущий файл, переименовывает TECH_COPY на его место. Без маркера не работает.

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
