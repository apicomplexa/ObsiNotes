---
aliases: []
date: 23-06-2026
dg-publish: false
parent:
summary: Работа с QuickAdd — макросы, скрипты и AI в хранилище
tags: []
type: 📄note
---

# SKILL — QuickAdd

## Что такое QuickAdd

QuickAdd (v2.12.3) — плагин для автоматизации рабочих процессов в Obsidian через **макросы**, **шаблоны** и **скрипты**. В этом хранилище используется только тип **Macro** (цепочки команд).

---

## Типы команд в макросе

| Тип | Описание |
|-----|----------|
| `Obsidian` | Команда из Command Palette по `commandId` |
| `UserScript` | Вызов JS-файла из `templateFolderPath` |
| `Wait` | Пауза в мс |
| `AI` | AI-промпт (через настроенный провайдер) |

---

## API UserScript

Скрипт получает объект `params`:

```js
module.exports = async (params) => {
    const app = params.app;          // Obsidian App
    const quickAddApi = params.quickAddApi;  // QuickAdd API

    // Активный файл
    const file = app.workspace.getActiveFile()
    const content = await app.vault.read(file)
    await app.vault.modify(file, newContent)

    // QuickAdd диалоги
    const input = await quickAddApi.inputPrompt("Заголовок", "placeholder", "default")
    const selected = await quickAddApi.suggester(["A", "B"], ["a", "b"])
    const yn = await quickAddApi.yesNoPrompt("Вопрос?")

    // AI (если настроен провайдер)
    const response = await quickAddApi.ai.prompt(promptText, model, settings)
}
```

---

## Настройки QuickAdd в хранилище

```json
{
  "templateFolderPath": "_.Settings/Templates/Scripts",
  "inputPrompt": "multi-line",
  "disableOnlineFeatures": true,
  "ai": {
    "defaultModel": "gpt-4o",
    "providers": [{
      "name": "g4f",
      "endpoint": "https://gpt-api.apicomplexa.com/v1"
    }]
  }
}
```

---

## Макросы в хранилище

### 1. `New common note`

**Назначение**: Создать новую заметку по стандартному шаблону.

**Шаги:**
1. Открыть новую вкладку (`workspace:new-tab`)
2. Создать файл из шаблона `_  📄CommonPage.md`

**Запуск**: Command Palette → "New common note" (горячая клавиша если назначена)

---

### 2. `Export: DOC`

**Назначение**: Экспортировать текущую заметку в DOCX с форматированием.

**Шаги:**
1. `convertLinks.js` — конвертирует `[[wikilinks]]` → `[markdown](path)` ссылки
2. `format_with_regexp.js` — заменяет callouts и task-символы на Unicode символы, создаёт TECH_COPY
3. Wait 1000ms
4. Pandoc: Экспорт в DOCX (`obsidian-pandoc:pandoc-export-docx`)
5. Wait 1000ms
6. `restore_from_tech_copy.js` — восстанавливает оригинал из TECH_COPY

**Почему TECH_COPY**: Шаги 1-2 модифицируют оригинальный файл для совместимости с Pandoc. TECH_COPY сохраняет исходник для восстановления.

---

### 3. `🖨️Make tech copy` (макрос, не выведен в Choices)

**Назначение**: Создать техническую копию файла перед деструктивной операцией.

**Шаги:**
1. Сохранить текущий файл
2. Запустить `format_with_regexp.js`

---

## Скрипты QuickAdd (`_.Settings/Templates/Scripts/`)

### `convertLinks.js`

**Что делает**: Рекурсивно раскрывает `[[wikilinks]]` и `![[embeds]]` в стандартный Markdown.

- `[[Заметка]]` → `[Заметка](путь/к/Заметка.md)`
- `![[Заметка]]` → полное содержимое заметки (без frontmatter)
- `![[Заметка#Раздел]]` → только раздел
- `![[Заметка#^блок]]` → только блок

**Параметры**: запрашивает глубину рекурсии (1–7, по умолчанию 3) через `suggester`.

**Ограничение**: Сломанные ссылки логируются в console.error, но не останавливают выполнение.

---

### `format_with_regexp.js`

**Что делает**: 
1. Создаёт `TECH_COPY_ИмяФайла.md` в корне хранилища
2. Заменяет Obsidian-специфичный синтаксис на Unicode-символы для Pandoc

**Замены callouts**:

| Паттерн | Результат |
|---------|-----------|
| `[!$]` / `[!def]` | `➡️` |
| `[!note]` | `🖋️` |
| `[!abstract]` | `🗒️` |
| `[!info]` | `❕` |
| `[!todo]` | `✅` |
| `[!tip]` | `🔥` |
| `[!success]` | `✔️` |
| `[!warning]` | `⚠️` |
| `[!failure]` | `❌` |
| `[!danger]` | `⚡` |
| `[!bug]` | `🪲` |
| `[!example]` | `🟰` |

**Замены задач**:

| Паттерн | Результат |
|---------|-----------|
| `- [ ]` | `◯` |
| `- [x]` | `●` |
| `- [/]` | `◑` |
| `- [-]` | `⊝` |
| `- [>]` | `➤` |
| `- [<]` | `📅` |
| `- [?]` | `❓` |
| `- [!]` | `⚠️` |
| `- [*]` | `⭐` |
| И др. | ... |

**Маркер в файле**: добавляет `%%TECH_COPY_PATH--путь%%` в конец.

---

### `restore_from_tech_copy.js`

**Что делает**: Читает маркер `%%TECH_COPY_PATH--путь%%` из текущего файла, удаляет текущий файл, переименовывает TECH_COPY на его место.

**Требует**: в файле должен быть маркер (создаётся `format_with_regexp.js`).

---

## Создание нового макроса

В `.obsidian/plugins/quickadd/data.json` добавить в `choices`:

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
      {
        "name": "Мой скрипт",
        "type": "UserScript",
        "path": "_.Settings/Templates/Scripts/myscript.js",
        "settings": {}
      }
    ]
  }
}
```

**Рекомендация**: Редактировать через интерфейс QuickAdd Settings → Macro → Edit, а не вручную в JSON.

---

## Запуск через Obsidian CLI

```bash
# Выполнить QuickAdd-макрос
obsidian command id="quickadd:choice:UUID_макроса"

# Найти ID
obsidian commands filter="quickadd"
```
