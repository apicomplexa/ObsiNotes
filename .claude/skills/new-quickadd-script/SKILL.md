---
name: new-quickadd-script
description: Scaffold a new QuickAdd UserScript in TypeScript in the obsidian-kit submodule (_.Settings/obsidian-kit/src/quickadd/), build it, and optionally wire a Macro into the QuickAdd plugin config.
disable-model-invocation: true
---

# new-quickadd-script

Create a new QuickAdd `UserScript` for the vault. Describe the desired automation in `$ARGUMENTS` (if empty, ask what the script should do).

## Steps

1. Read the `quickadd` skill for the current API, macros, and existing scripts (`convert-links`, `format-with-regexp`, `make-tech-copy`, `restore-tech-copy`, `docx-style-*`).
2. Create `_.Settings/obsidian-kit/src/quickadd/<name>.ts` (kebab-case name). Reuse `src/quickadd/lib/` (`makeStop`, tech-copy marker helpers) instead of copying code:

```ts
import { makeStop } from "./lib/common";

export default async (params: QuickAddParams): Promise<void> => {
  const { app, quickAddApi } = params;
  const stop = makeStop(params); // Notice + params.abort(): stops the rest of the macro

  const file = app.workspace.getActiveFile();
  if (!file) return stop("Нет активной заметки");
  const content = await app.vault.read(file);
  // ... transform ...
  await app.vault.modify(file, content);

  // Dialogs:
  // const input = await quickAddApi.inputPrompt("Заголовок", "placeholder", "default");
  // const choice = await quickAddApi.suggester(["A", "B"], ["a", "b"]);
};
```

   Keep user-facing text in Russian. Node modules (`fs`, `path`) are imported normally; Obsidian classes (`Notice`, `TFile`) come from `params.obsidian` at runtime — import from `"obsidian"` only with `import type`. If `QuickAddApi` in `types/quickadd.d.ts` lacks a method you need, add it there.

3. Build via the `build-kit` skill (`pixi run typecheck && pixi run build`) → `dist/quickadd/<name>.js`. Commit source and `dist/` in the submodule.

4. **Only if the user wants it runnable as a command**, wire a Macro into `.obsidian/plugins/quickadd/data.json` `choices` array:

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
      { "name": "<Имя>", "type": "UserScript", "path": "_.Settings/obsidian-kit/dist/quickadd/<name>.js", "settings": {} }
    ]
  }
}
```

   Editing `data.json` by hand is error-prone and Obsidian overwrites it if running — prefer telling the user to wire it via QuickAdd Settings → Macro → Edit. If you do edit the JSON, validate it parses afterward.

5. Report the script path and how to run it (QuickAdd Choice, or via Obsidian CLI: `obsidian command id="quickadd:choice:<UUID>"`).
