---
aliases: []
date: 23-06-2026
dg-publish: true
parent:
summary:
tags: []
type: 📄note
---

# SKILL — Obsidian CLI для агентов

> __Статус:__ Obsidian CLI требует версию __1.12.7+__.  
> Установлена: __1.9.14__ — нужно обновление.  
>
> __Активация после обновления:__  
> Настройки → Общие → включить "Интерфейс командной строки" → перезапустить терминал.

## Переменные для работы

```bash
# Имя vault (как отображается в Obsidian)
VAULT_NAME="TRPG"

# Базовый синтаксис для конкретного vault
obsidian vault="$VAULT_NAME" <команда>
```

---

## Информация о хранилище

```bash
# Общая информация
obsidian vault info=name
obsidian vault info=path
obsidian vault info=files     # количество файлов
obsidian vault info=folders   # количество папок
obsidian vault info=size      # размер

# Список всех vault
obsidian vaults
obsidian vaults verbose       # с путями
```

---

## Файлы и папки

### Навигация

```bash
# Список файлов в корне
obsidian files

# Список файлов в папке
obsidian files folder="Модули/Миелифоль 2.0/Персонажи"
obsidian files folder="Существа/Бестиарий"

# Список папок
obsidian folders
obsidian folders folder="Модули"

# Информация о конкретном файле
obsidian file file="Серая Мать - Лидер Теней"
```

### Чтение

```bash
# Прочитать содержимое файла
obsidian read file="Серая Мать - Лидер Теней"

# Скопировать в буфер
obsidian read file="Альберих" --copy

# Прочитать случайную заметку
obsidian random:read
obsidian random:read folder="Существа/Бестиарий"

# Структура заголовков файла
obsidian outline file="Сессия 1"
obsidian outline file="Сессия 1" format=tree
obsidian outline file="Сессия 1" format=json
```

### Создание

```bash
# Создать пустой файл
obsidian create name="Новый NPC"

# Создать файл с содержимым
obsidian create name="Гарет - Стражник" content="# Описание"

# Создать из шаблона (имя шаблона без пути и расширения)
obsidian create name="Марк - Купец" template="Creature or NPC"
obsidian create name="Замок на холме" template="Location"
obsidian create name="Сессия 3" template="Session"
obsidian create name="Ограбление банка" template="Quest"
obsidian create name="Гильдия магов" template="Union"
obsidian create name="Огненный шар" template="Spell"
obsidian create name="Меч правосудия" template="Item"

# Создать и сразу открыть
obsidian create name="Новая заметка" template="Creature or NPC" open

# Создать с перезаписью если существует
obsidian create name="Существующий файл" content="Обновлено" overwrite
```

### Редактирование

```bash
# Добавить текст в конец файла
obsidian append file="Сессия 1" content="## Итоги сессии"

# Добавить в начало
obsidian prepend file="Сессия 1" content="*Срочное обновление*"

# Переименовать файл (ссылки обновляются автоматически!)
obsidian rename file="Гильдия наемников" name="Гильдия Наёмников"

# Переместить файл
obsidian move file="Мира Валорис" to="Модули/Миелифоль 2.0/Персонажи"

# Удалить в корзину (безопасно)
obsidian delete file="MyFile - 134234"

# Удалить навсегда
obsidian delete file="MyFile - 134234" permanent
```

---

## Frontmatter / Свойства (Properties)

```bash
# Список всех свойств текущего/активного файла
obsidian properties

# Список свойств конкретного файла
obsidian properties file="Альберих"

# Прочитать конкретное свойство
obsidian property:read name="level" file="Альберих"
obsidian property:read name="hp" file="Серая Мать - Лидер Теней"

# Установить значение свойства
obsidian property:set name="level" value="5"            # активный файл
obsidian property:set name="status" value="🔴завершен"  # (нужно быть в файле)

# Удалить свойство
obsidian property:remove name="nsmu"

# Список всех свойств в хранилище с количеством
obsidian properties counts
obsidian properties counts format=tsv
obsidian properties counts format=json
```

---

## Поиск

```bash
# Простой поиск
obsidian search query="Серая Мать"

# Поиск с контекстом (показывает вхождения)
obsidian search:context query="заговор"

# Найти файлы с тегом
obsidian search query="tag:#excalidraw"

# Поиск по frontmatter
obsidian search query="[company: Миелифоль 2.0]"

# Скопировать результаты поиска
obsidian search query="NPC" --copy
```

---

## Ссылки

```bash
# Входящие ссылки на файл
obsidian backlinks
obsidian backlinks file="Ротундифоль"

# Исходящие ссылки из файла
obsidian links
obsidian links file="Сессия 1"

# КРИТИЧНО для рефакторинга — сломанные ссылки
obsidian unresolved
obsidian unresolved total         # только количество
obsidian unresolved format=json   # для обработки

# Файлы без входящих ссылок
obsidian orphans
obsidian orphans total

# Файлы без исходящих ссылок
obsidian deadends
```

---

## Теги

```bash
# Все теги в хранилище
obsidian tags

# Теги с количеством использований
obsidian tags counts
obsidian tags counts format=tsv
obsidian tags counts format=json

# Информация по тегу
obsidian tag name="excalidraw"

# Теги в конкретном файле
obsidian tags file="Альберих"
```

---

## Шаблоны (Templater)

```bash
# Список всех шаблонов (из _Settings/Templates/)
obsidian templates
obsidian templates total

# Прочитать шаблон
obsidian template:read name="Creature or NPC"
obsidian template:read name="Session"

# Прочитать шаблон с раскрытием переменных
obsidian template:read name="Spell" resolve

# Вставить шаблон в активный файл
obsidian template:insert name="Quest"
```

---

## Задачи (Tasks Plugin)

```bash
# Все незавершённые задачи
obsidian tasks todo

# Все завершённые задачи
obsidian tasks done

# Задачи в конкретном файле
obsidian tasks file="Сессия 1"

# Задачи за сегодня
obsidian tasks daily

# Подсчёт
obsidian tasks daily total

# Переключить статус задачи (ref = "файл.md:номер_строки")
obsidian task ref="Сессия 1.md:15" toggle
obsidian task ref="Сессия 1.md:15" done
obsidian task ref="Сессия 1.md:15" todo
```

---

## История версий

```bash
# Локальная история файла (плагин Local History или Sync)
obsidian history file="Сессия 1"

# Прочитать версию
obsidian history:read file="Серая Мать - Лидер Теней" version=2

# Сравнить версии
obsidian diff file="Альберих" from=1 to=3

# Восстановить версию
obsidian history:restore file="Альберих" version=1
```

---

## Команды Obsidian (Command Palette)

```bash
# Список всех команд
obsidian commands

# Фильтр по ID-префиксу
obsidian commands filter="dataview"
obsidian commands filter="templater"
obsidian commands filter="initiative"

# Выполнить команду по ID
obsidian command id="templater-obsidian:insert-templater"
obsidian command id="obsidian-tasks-plugin:edit-task"
obsidian command id="initiative-tracker:open-initiative-tracker"
obsidian command id="dataview:force-refresh-views"

# Список горячих клавиш
obsidian hotkeys
obsidian hotkeys format=tsv
```

---

## Выполнение JavaScript (для продвинутых операций)

```bash
# Количество файлов
obsidian eval code="app.vault.getFiles().length"

# Список всех заметок в папке
obsidian eval code="app.vault.getFiles().filter(f => f.path.startsWith('Модули/Миелифоль 2.0')).map(f => f.path)"

# Прочитать frontmatter конкретного файла
obsidian eval code="app.metadataCache.getCache('Существа/Персонажи/Альберих.md')?.frontmatter"

# Найти все файлы с определённым полем
obsidian eval code="app.vault.getMarkdownFiles().filter(f => { const fm = app.metadataCache.getCache(f.path)?.frontmatter; return fm?.creature_type?.includes('npc'); }).map(f => f.path)"

# Переименовать файл (безопасно, с обновлением ссылок)
obsidian eval code="await app.fileManager.renameFile(app.vault.getAbstractFileByPath('Модули/Миелифоль 2.0/Персонажи/Мира Валорис.md'), 'Модули/Миелифоль 2.0/Персонажи/Мира Валорис - Ученица мага.md')"
```

---

## Плагины

```bash
# Список всех установленных плагинов с версиями
obsidian plugins versions
obsidian plugins filter=community versions

# Информация о плагине
obsidian plugin id="dataview"
obsidian plugin id="initiative-tracker"

# Управление
obsidian plugin:enable id="obsidian-tasks-plugin"
obsidian plugin:disable id="obsidian-tagfolder"

# Перезагрузить (для разработки)
obsidian plugin:reload id="dataview"
```

---

## Типичные workflows для агента

### Workflow 1: Аудит перед рефакторингом

```bash
obsidian vault info=files
obsidian unresolved total
obsidian orphans total
obsidian tags counts format=tsv
obsidian properties counts format=tsv
```

### Workflow 2: Создать NPC из шаблона

```bash
# 1. Создать файл из шаблона (Templater запросит имя)
obsidian create name="Граф Вирель - Глава городской стражи" template="Creature or NPC"

# 2. Проверить что файл создан
obsidian file file="Граф Вирель - Глава городской стражи"

# 3. Установить свойства
obsidian property:set name="ac" value='"16"'
obsidian property:set name="hp" value="65"
```

### Workflow 3: Безопасное переименование (ссылки обновляются автоматически)

```bash
# Obsidian CLI автоматически обновляет все [[ссылки]] при rename
obsidian rename file="Гильдия наемников" name="Гильдия Наёмников"

# Проверить что ссылок на старое имя не осталось
obsidian search query="[[Гильдия наемников]]"
```

### Workflow 4: Найти и починить orphan-заметки

```bash
# Найти orphans
obsidian orphans

# Проверить входящие ссылки конкретного файла
obsidian backlinks file="Хронология Миелифоля"

# Добавить ссылку в главный файл модуля
obsidian append file="Миелифоль 2.0" content="- [[Хронология Миелифоля]]"
```

### Workflow 5: Поиск всех упоминаний персонажа

```bash
obsidian search:context query="Серая Мать"
obsidian backlinks file="Серая Мать - Лидер Теней"
```

---

## Форматы вывода

Большинство команд поддерживают:

```bash
obsidian <команда> format=json   # машиночитаемый
obsidian <команда> format=tsv    # для таблиц
obsidian <команда> format=csv    # для Excel
obsidian <команда> format=md     # markdown

# Копирование в буфер обмена
obsidian <команда> --copy
```

---

## Важные ограничения

1. __Obsidian должен быть запущен__ — CLI работает через запущенное приложение
2. __Версия 1.12.7+__ — текущая 1.9.14 не поддерживает CLI (нужно обновление)
3. __`rename` обновляет ссылки__ — используй `rename`, не `move` для переименования
4. __`property:set` работает с активным файлом__ — для batch-операций использовать `eval`
5. __`create` с `template`__ — Templater запускает JS, может показать диалог выбора
6. __`delete` без `permanent`__ — файл идёт в системную корзину, можно восстановить
