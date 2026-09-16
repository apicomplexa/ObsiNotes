---
name: obsidian-cli
description: Obsidian CLI command reference for operating on the vault — reading, creating, link-aware move/rename, frontmatter properties, backlinks, tags, tasks, bases, QuickAdd and Templater invocation, and eval. Use when a task needs resolved links, indexed metadata, or live app state that plain filesystem tools cannot provide.
---

# obsidian-cli

CLI работает **через запущенное приложение Obsidian**. Если Obsidian закрыт — команды не выполнятся.

Проверено на Obsidian **1.13.7**. Бинарь: `C:/Users/alex/Apps/Programms/Obsidian/obsidian`.

## Базовый синтаксис

```bash
obsidian vault="ObsiNotes" <команда> [параметры]
```

- Всегда указывай `vault="ObsiNotes"` — на машине есть второе хранилище (`TRPG`).
- `file=<name>` резолвится как wikilink (по имени); `path=<path>` — точный путь с расширением.
- Большинство команд по умолчанию работают с активным файлом, если `file`/`path` опущены.
- Значения с пробелами — в кавычках. `\n` и `\t` работают в `content=`.
- **Каталог команд — источник истины.** `obsidian` (без аргументов) или `obsidian help <команда>` всегда актуальнее любой документации, включая эту. Если команда ведёт себя не так, как здесь описано, — сверься с `help`.
- Флаг `--copy` на любой команде кладёт вывод в буфер обмена; `total` на списочных командах возвращает счётчик.
- Официальная документация: https://help.obsidian.md/cli

## Информация о хранилище

```bash
obsidian vault                      # name / path / files / folders / size
obsidian vault info=files           # только количество файлов
obsidian vaults verbose             # все хранилища с путями
obsidian version
```

## Файлы и папки

```bash
obsidian files folder="Notes"
obsidian files ext=md total
obsidian folders folder="_. Home"
obsidian folder path="Notes" info=files
obsidian file file="DADA2"
obsidian read path="Notes/DADA2.md"
obsidian outline file="DADA2" format=tree
obsidian random:read folder="Notes"
obsidian recents
```

## Создание и правка

```bash
obsidian create name="Новая заметка" content="# Заголовок"
obsidian create path="Notes/Kraken2.md" template="_  📄CommonPage" open
obsidian append path="Notes/DADA2.md" content="## Итоги"
obsidian prepend file="DADA2" content="*Черновик*"
```

## Перемещение, переименование, удаление

Это единственный корректный способ двигать заметки — Obsidian обновит ссылки.

```bash
obsidian move path="Notes/old.md" to="Notes/new.md"
obsidian rename path="Notes/old.md" name="Новое имя"
obsidian delete path="Notes/мусор.md"             # в корзину
obsidian delete path="Notes/мусор.md" permanent   # безвозвратно, только по явной просьбе
```

Для **папок** `move` не годится — используй `eval` с `fileManager.renameFile`:

```bash
obsidian vault="ObsiNotes" eval code="const f = app.vault.getAbstractFileByPath('Старая папка'); await app.fileManager.renameFile(f, 'Новая папка')"
```

Не используй `app.vault.rename` — он обходит обновление ссылок.

## Frontmatter / Properties

```bash
obsidian properties path="Notes/DADA2.md"
obsidian properties counts sort=count format=tsv    # все свойства хранилища
obsidian property:read name="summary" file="DADA2"
obsidian property:set name="summary" value="Пайплайн обработки ампликонов" path="Notes/DADA2.md"
obsidian property:set name="💻Bioinfo" value="tool" type=list path="Notes/DADA2.md"
obsidian property:remove name="parent" path="Notes/DADA2.md"
```

`property:set` с `type=list|number|checkbox|date` — предпочтительный способ правки frontmatter: Obsidian сам сериализует YAML.

## Поиск

```bash
obsidian search query="метагеном" path="Notes" limit=20
obsidian search:context query="DADA2" format=json
obsidian search query="tag:#📌pin"
obsidian search query="[💻Bioinfo]"
```

## Ссылки — критично для рефакторинга

```bash
obsidian backlinks file="DADA2" counts
obsidian links path="Notes/DADA2.md"
obsidian unresolved total                # сломанные ссылки
obsidian unresolved verbose format=tsv   # с файлами-источниками
obsidian orphans total                   # без входящих ссылок
obsidian deadends                        # без исходящих
```

## Теги и алиасы

```bash
obsidian tags counts sort=count format=tsv
obsidian tags path="Notes/DADA2.md"
obsidian tag name="📌pin" verbose
obsidian aliases verbose
```

## Задачи (Tasks)

```bash
obsidian tasks todo
obsidian tasks path="Lists/Экзамен по невре СГМУ лето 2026.md" verbose
obsidian tasks total done
obsidian task ref="Lists/Экзамен.md:15" done
obsidian task ref="Lists/Экзамен.md:15" status="/"
```

## Bases

```bash
obsidian bases
obsidian base:views path="_. Home/Bases/GRW.base"
obsidian base:query path="_. Home/Bases/GRW.base" view="Таблица" format=json
obsidian base:create path="_. Home/Bases/GRW.base" name="Новая книга"
```

## QuickAdd

```bash
obsidian quickadd:list commands
obsidian quickadd:check choice="New common note"
obsidian quickadd:run choice="New common note" vars='{"title":"Kraken2"}'
```

Без флага `ui` интерактивные диалоги не показываются — передавай значения через `vars`.

## Templater

```bash
obsidian templater:create-from-template template="_.Settings/Templates/Templater/_  📄CommonPage.md" file="Notes/Kraken2.md" open
```

## Команды Obsidian

```bash
obsidian commands filter="dataview"
obsidian command id="dataview:force-refresh-views"
obsidian command id="obsidian-linter:lint-file"
obsidian command id="obsidian-linter:lint-all-files"
obsidian hotkeys verbose format=tsv
```

## eval — для batch-операций

```bash
# Frontmatter конкретного файла
obsidian eval code="app.metadataCache.getCache('Notes/DADA2.md')?.frontmatter"

# Все заметки с определённым метатегом
obsidian eval code="app.vault.getMarkdownFiles().filter(f => app.metadataCache.getCache(f.path)?.frontmatter?.['💻Bioinfo']).map(f => f.path)"

# Заметки с пустым summary
obsidian eval code="app.vault.getMarkdownFiles().filter(f => { const fm = app.metadataCache.getCache(f.path)?.frontmatter; return fm && !fm.summary; }).length"

# Безопасная правка frontmatter
obsidian eval code="const f = app.vault.getAbstractFileByPath('Notes/DADA2.md'); await app.fileManager.processFrontMatter(f, fm => { fm.summary = 'текст' })"
```

## История версий

```bash
obsidian history path="Notes/DADA2.md"
obsidian history:read file="DADA2" version=2
obsidian diff file="DADA2" from=1 to=3
obsidian history:restore file="DADA2" version=1
```

## Плагины, темы, сниппеты

```bash
obsidian plugins:enabled versions format=tsv
obsidian plugin id="dataview"
obsidian plugin:reload id="dataview"
obsidian snippets:enabled
obsidian theme
```

## Форматы вывода

Большинство команд принимают `format=json|tsv|csv` (некоторые ещё `md`, `yaml`, `tree`, `paths`) и флаг `total` для счётчика.

## Workflows

**Аудит перед рефакторингом**
```bash
obsidian vault
obsidian unresolved total
obsidian orphans total
obsidian tags counts format=tsv
obsidian properties counts sort=count format=tsv
```

**Безопасное переименование**
```bash
obsidian rename path="Notes/старое имя.md" name="Новое имя"
obsidian unresolved total          # проверить, что ничего не сломалось
```

**Починка orphan-заметок**
```bash
obsidian orphans
obsidian backlinks file="Имя заметки"
obsidian append path="_. Home/Indexes/💻Bioinfo/💻Bioinfo.md" content="- [[Имя заметки]]"
```

## Разработка и отладка (`dev:*`)

Полезно при правке CSS-сниппетов, темы или отладке dataview-вьюх.

```bash
obsidian vault="ObsiNotes" dev:errors                 # захваченные ошибки
obsidian vault="ObsiNotes" dev:errors clear
obsidian vault="ObsiNotes" dev:console level=error    # консоль
obsidian vault="ObsiNotes" dev:screenshot path=screenshot.png
obsidian vault="ObsiNotes" dev:dom selector=".workspace-leaf" text
obsidian vault="ObsiNotes" dev:css selector=".text_pill" prop=background-color
obsidian vault="ObsiNotes" dev:mobile on
```

Цикл правки плагина или сниппета:
1. `plugin:reload id=<id>` (или `snippet:disable` + `snippet:enable`)
2. `dev:errors` — если есть ошибки, починить и повторить
3. `dev:screenshot` или `dev:dom` — проверить визуально
4. `dev:console level=error` — проверить предупреждения

`dev:css` удобен для отладки плашек `text_pill` и стилей Supercharged Links.

## Ограничения

1. Obsidian должен быть запущен.
2. `rename` меняет имя, `move` меняет путь — оба обновляют ссылки. Shell-овый `mv` **не** обновляет.
3. Для папок `move` не работает — только `eval` + `fileManager.renameFile`.
4. `create` с `template` может запустить Templater-JS и показать диалог.
5. `delete` без `permanent` кладёт файл в корзину — восстановимо.
6. Пути в `eval` экранируй аккуратно: они уходят в JS-строку.
7. `daily:*` команд нет — core-плагин Daily Notes в этом хранилище выключен.
8. Флага `silent` в установленной сборке нет; есть обратные — `open` и `newtab`.
