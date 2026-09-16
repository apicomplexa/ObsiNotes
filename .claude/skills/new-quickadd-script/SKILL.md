---
name: new-quickadd-script
description: Scaffold a new QuickAdd UserScript in _.Settings/Templates/Scripts/ and optionally wire a Macro into the QuickAdd plugin config.
disable-model-invocation: true
---

# new-quickadd-script

Create a new QuickAdd `UserScript` for the vault. Describe the desired automation in `$ARGUMENTS` (if empty, ask what the script should do).

## Steps

1. Read the `quickadd` skill for the current API, settings, and existing scripts (`convertLinks.js`, `format_with_regexp.js`, `restore_from_tech_copy.js`).
2. Create the script at `_.Settings/Templates/Scripts/<name>.js` using the UserScript signature:

```js
module.exports = async (params) => {
    const { app, quickAddApi } = params;

    // Active file:
    const file = app.workspace.getActiveFile();
    const content = await app.vault.read(file);
    // ... transform ...
    await app.vault.modify(file, newContent);

    // Dialogs:
    // const input = await quickAddApi.inputPrompt("Заголовок", "placeholder", "default");
    // const choice = await quickAddApi.suggester(["A", "B"], ["a", "b"]);
    // const yn = await quickAddApi.yesNoPrompt("Вопрос?");
};
```

   Keep user-facing prompt text in Russian. Handle missing/broken inputs gracefully (log to `console.error`, don't crash the macro).

3. **Only if the user wants it runnable as a command**, wire a Macro into `.obsidian/plugins/quickadd/data.json` `choices` array:

```json
{
  "id": "<uuid>",
  "name": "<Имя макроса>",
  "type": "Macro",
  "command": true,
  "macro": {
    "name": "<Имя>",
    "id": "<uuid>",
    "commands": [
      { "name": "<Имя>", "type": "UserScript", "path": "_.Settings/Templates/Scripts/<name>.js", "settings": {} }
    ]
  }
}
```

   Editing `data.json` by hand is error-prone — prefer telling the user to wire it via QuickAdd Settings → Macro → Edit. If you do edit the JSON, validate it parses afterward.

4. Report the script path and how to run it (QuickAdd Choice, or via Obsidian CLI: `obsidian command id="quickadd:choice:<UUID>"`).
