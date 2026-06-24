---
aliases: []
date: 17-06-2026
dg-publish: true
parent:
summary: "Шпаргалка по метапрограммированию R: окружения и лексическое связывание, объекты AST, promises и lazy evaluation, NSE через quote/substitute/eval, современный API rlang (quosures, {{ }}, !!), data mask и eval_tidy(), tidyselect, замыкания и фабрики функций."
tags: []
type: 📄note
🖥️IT:
  - R
---

# Часть 1. Как R вычисляет выражения: окружения и области видимости

Прежде чем говорить о метапрограммировании, нужно понять, _где_ R ищет переменные.

## 1.1 Окружения (environments)

Окружение — это словарь (имя → значение) + указатель на _родительское_ окружение.

Все переменные живут в окружениях. Цепочка родителей — это путь поиска переменной.

```r
# Создать окружение вручную
e <- new.env(parent = emptyenv())  # emptyenv() — "дно" цепочки, нет родителя
e$x <- 42
ls(e)              # "x"
get("x", envir = e)
exists("x", envir = e, inherits = FALSE)  # inherits = FALSE — не смотреть в родителей

# Окружение функции — то, где она была ОПРЕДЕЛЕНА (lexical scoping)
f <- function() x
environment(f)
environment(f)$x     # переменные "видимые" функции при определении

# environmentName — имя стандартных окружений
environmentName(globalenv())    # "R_GlobalEnv"
environmentName(baseenv())      # "base"
environmentName(emptyenv())     # "R_EmptyEnv"

# Цепочка поиска (search path)
search()        # пакеты, прикреплённые в текущей сессии — это тоже окружения!
```

__Ключевая идея — lexical scoping (лексическое связывание):__

функция ищет свободные переменные там, где она была _определена_, а не там, где _вызвана_.

```r
x <- 10
f <- function() x     # x ищется в окружении, где определена f → globalenv

make_adder <- function(n) {
  function(x) x + n   # n берётся из окружения make_adder, а не из места вызова!
}
add5 <- make_adder(5)
add5(3)   # 8 — n = 5 "захвачена" замыканием
```

## 1.2 R не поддерживает настоящее dynamic scoping

R — язык с _лексическим_ связыванием. Это нужно зафиксировать явно:

```r
# Лексическое (как в R — по умолчанию)
x <- 1
f <- function() x
g <- function() { x <- 99; f() }
g()   # 1 — f() видит x из СВОЕГО окружения определения, не из g()
```

R не поддерживает настоящее dynamic scoping. Однако он позволяет __вручную обращаться

к стеку вызовов__ — это другая и более низкоуровневая операция:

```r
# Это НЕ dynamic scoping — это ручной доступ к call stack
g2 <- function() {
  x <- 99
  # sys.frame(-1) — окружение вызывающей функции, один уровень вверх по стеку
  eval(quote(x), envir = sys.frame(-1))
}
# В языках с настоящим dynamic scoping это происходило бы автоматически.
# В R это явная и намеренная операция.

parent.frame()    # окружение вызывающей функции (один уровень)
parent.frame(2)   # два уровня вверх по стеку
sys.frames()      # список всех окружений в текущем стеке вызовов
sys.nframe()      # глубина стека
```

---

# Часть 2. Объекты языка и AST

> AST (Abstract Syntax Tree) — дерево разбора выражения, которое R строит перед выполнением.
> Метапрограммирование — это в значительной мере работа именно с AST:
> его захват, обход, модификация и вычисление в нужном контексте.

## 2.1 Типы объектов языка R

Прежде чем смотреть на функции захвата, нужно понять, с чем мы работаем.

| Тип | typeof / class | Пример | Как получить |
|-----|---------------|--------|--------------|
| `symbol` / `name` | `"symbol"` | `x`, `foo` | `quote(x)`, `as.name("x")`, `rlang::sym("x")` |
| `call` | `"language"` | `f(x)`, `x + 1` | `quote(f(x))`, `call("f", quote(x))` |
| `pairlist` | `"pairlist"` | список формальных аргументов | `formals(f)` |
| `expression` | `"expression"` | несколько выражений | `expression(x+1, y+2)` |
| `formula` | `"language"` | `y ~ x` | `y ~ x` |

```r
is.symbol(quote(x))    # TRUE
is.call(quote(x + 1))  # TRUE
is.name(quote(x))      # TRUE (синоним is.symbol)

# ВАЖНО: quote(x) возвращает *языковой объект* (symbol),
# а не "AST" в полном смысле — символ это листовой узел дерева, у него нет потомков.
# "Полным" языковым объектом с внутренней структурой является call.
quote(x)         # symbol — листовой узел
quote(x + 1)     # call   — внутренний узел с потомками
```

## 2.2 Структура AST: call как вложенный список

```r
expr <- quote(x + y * 2)
# Это дерево: +(x, *(y, 2))

expr[[1]]       # `+` — функция (оператор в корне)
expr[[2]]       # `x` — первый аргумент (symbol)
expr[[3]]       # `y * 2` — второй аргумент (тоже call!)
expr[[3]][[2]]  # `y`
expr[[3]][[3]]  # `2`

# Разобрать call на части
call_obj <- quote(mean(x, na.rm = TRUE))
call_obj[[1]]          # mean
as.list(call_obj)[-1]  # список аргументов: list(quote(x), TRUE)
call_obj[["na.rm"]]    # доступ по имени аргумента

# lobstr::ast() — самый наглядный способ посмотреть на дерево
library(lobstr)
ast(f(x + 1, g(y)))
# █─f
# ├─█─`+`
# │ ├─x
# │ └─1
# └─█─g
#   └─y
```

## 2.3 Формулы — языковые объекты с окружением

```r
f <- y ~ x + group
class(f)          # "formula"
typeof(f)         # "language"
f[[1]]            # `~`
f[[2]]            # `y`  (левая часть)
f[[3]]            # `x + group` (правая часть)
environment(f)    # формулы несут с собой окружение — в отличие от quote()!
                  # Именно это делает формулы "quosure до quosure".

# Создание формулы программно
reformulate(c("x", "group"), response = "y")
as.formula(paste("y ~", paste(c("x","group"), collapse = "+")))
```

---

# Часть 3. Promises и ленивые вычисления — фундамент NSE

> Это самый важный механизм, без понимания которого NSE выглядит магией.

## 3.1 Что такое promise

Когда вы вызываете `f(x + 1)`, R __не вычисляет__ `x + 1` немедленно.

Вместо этого аргумент оборачивается в __promise__ — структуру из трёх частей:

```
promise = {
  expression:  x + 1          ← исходное выражение (код)
  environment: <где вызвана f> ← окружение для вычисления
  value:       <не вычислен>  ← кэш; заполняется при первом обращении
}
```

Promise вычисляется __лениво__ (lazy evaluation) — только когда значение действительно

понадобится внутри функции. После первого вычисления результат кэшируется.

```r
f <- function(x) {
  cat("до обращения к x\n")
  force(x)   # явно вычислить promise прямо сейчас
  cat("после\n")
}
f({ cat("вычисляю аргумент\n"); 42 })
# "до обращения к x"
# "вычисляю аргумент"   ← вычисление произошло ВНУТРИ f, не до вызова!
# "после"

# Аргументы по умолчанию тоже являются promises и вычисляются лениво:
g <- function(x, y = x^2) {
  x <- x + 1   # меняем x
  y            # y вычислится как (x+1)^2, а не x^2!
}
g(1)   # 4 — y = (1+1)^2, не 1^2
```

## 3.2 substitute() — Перехватить выражение из promise

`substitute()` извлекает __выражение__ из promise аргумента, не вычисляя его.

Это главный NSE-инструмент базового R, предшественник `enquo()`.

```r
f <- function(x) substitute(x)

f(a + b)       # `a + b`  — выражение, a и b не вычисляются
f(1 + 1)       # `1 + 1`  — именно то, что написал пользователь, не 2!
f(sqrt(y))     # `sqrt(y)`

# substitute() снаружи функции — замена символов в выражении:
x_val <- 42
substitute(x + 1, list(x = x_val))   # `42 + 1`

# Типичный паттерн base NSE:
my_subset <- function(df, condition) {
  cond_expr <- substitute(condition)
  rows <- eval(cond_expr, envir = df, enclos = parent.frame())
  df[rows, ]
}
my_subset(mtcars, cyl > 4 & hp > 100)
# Именно так работает base::subset() внутри
```

__Ключевое отличие от quote():__

- `quote()` — захватывает то, что написано буквально (работает везде, не внутри функции)
- `substitute()` — перехватывает promise аргумента (работает только внутри функции)

```r
x <- quote(a + b)

quote(x)       # `x` — буквально символ x
substitute(x)  # `a + b` — содержимое promise x (если x — аргумент функции)
               # В глобальном окружении: тоже `x`, substitute смотрит в текущую среду
```

## 3.3 bquote() — Частичное вычисление (base R аналог `!!`)

```r
# bquote() позволяет вычислить выбранные части выражения через .(  )
n <- 10
bquote(x > .(n))          # `x > 10` — n вычислен, x остался символом
bquote(f(.(n), y = .(n * 2)))  # `f(10, y = 20)`

# Сравнение с rlang:
# bquote(x > .(n))  ≈  rlang::expr(x > !!n)

# Полезно при построении формул или вызовов без rlang:
make_call <- function(fn, arg_val) {
  bquote(.(as.name(fn))(x, threshold = .(arg_val)))
}
make_call("filter", 5)   # `filter(x, threshold = 5)`
```

## 3.4 alist() — Список невычисленных выражений

```r
# list() вычисляет аргументы, alist() — нет
list(x = a + b)    # ошибка, если a не существует
alist(x = a + b)   # list с выражением `a + b` внутри

# Применение: хранить набор выражений-фильтров
filters <- alist(
  by_ctrl  = ctrl > 5,
  by_group = group == "A"
)
lapply(filters, function(e) eval(e, envir = df))
```

## 3.5 match.call() И sys.call()

```r
# match.call() — получить вызов функции в виде call-объекта,
# с полными именами аргументов (частичные имена раскрываются)
f <- function(x, na.rm = FALSE, trim = 0) {
  mc <- match.call()
  cat("Вызов:", deparse(mc), "\n")
  mc$na.rm   # конкретный аргумент
}
f(1:10, na.r = TRUE)   # "Вызов: f(x = 1:10, na.rm = TRUE)"

# sys.call() — то же, но аргументы остаются как есть (частичные имена не раскрываются)
g <- function(x, na.rm = FALSE) {
  list(match = deparse(match.call()),
       sys   = deparse(sys.call()))
}
g(1:5, na.r = TRUE)
# match: "g(x = 1:5, na.rm = TRUE)"
# sys:   "g(1:5, na.r = TRUE)"

# Применение: логировать вызовы, создавать self-describing функции
log_call <- function(...) {
  mc <- match.call()
  mc[[1]] <- quote(target_function)
  cat("[LOG]", deparse(mc), "\n")
  eval(mc)
}
```

---

# Часть 4. quote() и eval() — базовый цикл метапрограммирования

## 4.1 quote() — Заморозить выражение

```r
# quote() возвращает языковой объект (symbol или call) — узел AST.
# Аргумент НЕ вычисляется.
expr <- quote(x + y * 2)
class(expr)   # "call"
typeof(expr)  # "language"

# Вычислить позже в нужном месте:
x <- 1; y <- 2
eval(expr)    # 5
```

## 4.2 eval() — Вычислить выражение в заданном окружении

```r
x <- 10
expr <- quote(x * 2)
eval(expr)                  # 20 — в текущем окружении

e <- new.env()
e$x <- 99
eval(expr, envir = e)       # 198

# eval(expr, envir, enclos):
# envir  — где ищем переменные в первую очередь (список или окружение)
# enclos — куда идём, если не нашли в envir (по умолчанию parent.frame())
df <- data.frame(x = 1:5, y = 6:10)
eval(quote(x + y), envir = df, enclos = parent.frame())
# Именно так работает with():
with(df, x + y)
```

## 4.3 parse() И deparse() — строки ↔ выражения

```r
# Строка → выражение (осторожно: риск инъекций кода!)
expr <- parse(text = "x + 1")[[1]]
eval(expr)

# Выражение → строка
deparse(quote(x + y * 2))          # "x + y * 2"
deparse(quote(f(x, y = TRUE)))     # "f(x, y = TRUE)"
rlang::expr_text(quote(x + y))     # то же, rlang-версия

# Практика: генерация формулы из вектора имён
vars <- c("age", "bmi", "treatment")
as.formula(paste("outcome ~", paste(vars, collapse = " + ")))
```

---

# Часть 5. rlang — современный API метапрограммирования

`rlang` предоставляет два уровня API:

- __Низкоуровневый__: `enquo()`, `!!`, `!!!` — полный контроль, нужен при написании пакетов
- __Высокоуровневый__: `{{ }}`, `across()`, `.data[[]]` — для повседневного программирования

## 5.1 expr() — Rlang-версия quote()

```r
library(rlang)

# Главное отличие expr() от quote(): внутри expr() работает !! (unquoting)
val <- 10
quote(x + val)    # `x + val` — val не вычислен (quote не знает про !!)
expr(x + !!val)   # `x + 10`  — val вычислен и подставлен в AST
```

## 5.2 Quosures — выражение + окружение

__Quosure__ = выражение + окружение, в котором оно должно быть вычислено.

Это не функция-замыкание (closure). Quosure — это _данные_, а не исполняемый код.

```
quosure = {
  expression:  x > threshold   ← что вычислять
  environment: <вызывающая среда>  ← где искать переменные
}
```

Аналогия с promise: promise тоже хранит выражение + окружение, но создаётся R автоматически

для каждого аргумента. Quosure — это явно созданный и управляемый объект того же рода.

```r
# enquo() — захватить аргумент как quosure (использовать ВНУТРИ функции)
my_filter <- function(df, condition) {
  cond <- enquo(condition)
  # Quosure несёт окружение вызывающего кода — threshold ищется ТАМ
  cat("Выражение:", deparse(quo_get_expr(cond)), "\n")
  cat("Окружение:", environmentName(quo_get_env(cond)), "\n")
  df[eval_tidy(cond, df), ]
}

df <- data.frame(x = 1:5, y = c(2,4,6,8,10))
threshold <- 3
my_filter(df, x > threshold)   # threshold = 3 из вызывающего окружения

# quo() — создать quosure вручную (вне функции, для тестирования)
q <- quo(x > threshold)
quo_get_expr(q)   # `x > threshold`
quo_get_env(q)    # текущее окружение

# enquos() — захватить несколько аргументов через ...
f <- function(...) enquos(...)
qs <- f(x > 1, y < 5)
lapply(qs, quo_get_expr)
```

## 5.3 {{ }} — Высокоуровневый API (embrace operator)

`{{ x }}` — это просто удобная запись `!!enquo(x)`. Именно его нужно использовать

в 90% случаев при написании функций-обёрток над dplyr.

```r
# ── Что делает {{ }}: ────────────────────────────────────────────────────────
# 1. enquo(x)  — захватить выражение x вместе с его окружением
# 2. !!        — вставить quosure в нужное место

# Без {{ }}:
my_mean_v1 <- function(data, col) {
  col_q <- enquo(col)
  summarise(data, result = mean(!!col_q, na.rm = TRUE))
}

# С {{ }} — то же самое, но короче:
my_mean_v2 <- function(data, col) {
  summarise(data, result = mean({{ col }}, na.rm = TRUE))
}

# Оба вызова идентичны:
my_mean_v1(df, x)
my_mean_v2(df, x)   # x не вычисляется, передаётся как выражение

# Ещё примеры с {{ }}:
my_filter <- function(df, cond) filter(df, {{ cond }})
my_group_by <- function(df, ...) group_by(df, ...)  # ... пробрасывается автоматически

# Именование результата через glue-синтаксис:
my_summary <- function(df, col, suffix = "mean") {
  df |> summarise("{ col }_{ suffix }" := mean({{ col }}, na.rm = TRUE))
}
# my_summary(df, x) → колонка x_mean
```

## 5.4 enquo() + !! — Низкоуровневый API

Нужен когда `{{ }}` недостаточно: программная модификация выражения, передача quosure

в несколько мест, хранение в переменной.

```r
# Разница между {{ }} и enquo + !!:
# {{ col }} = !!enquo(col), но enquo даёт доступ к объекту quosure
f <- function(df, col) {
  q <- enquo(col)
  # Можно интроспектировать:
  cat("Пользователь передал:", deparse(quo_get_expr(q)), "\n")
  # Можно использовать несколько раз:
  df |>
    filter(!is.na(!!q)) |>
    summarise(mean = mean(!!q, na.rm = TRUE))
}

# enquos(...) — захватить несколько аргументов
group_summary <- function(df, ..., val) {
  groups <- enquos(...)
  val_q  <- enquo(val)
  df |>
    group_by(!!!groups) |>
    summarise(mean = mean(!!val_q, na.rm = TRUE), .groups = "drop")
}
group_summary(df, group, val = ctrl)
```

## 5.5 Unquoting: !! и !!! — вставить значение в AST

```r
# !! — вычислить и вставить одно значение
var_name <- sym("x")
expr(!!var_name + 1)      # `x + 1`

cutoff <- 5
expr(value > !!cutoff)    # `value > 5`

col <- "expr_ctrl"
expr(df$!!sym(col))       # `df$expr_ctrl` — sym() обязателен: нельзя вставить строку

# !!! — вставить список как несколько аргументов
extra_args <- list(na.rm = TRUE, trim = 0.1)
expr(mean(x, !!!extra_args))   # `mean(x, na.rm = TRUE, trim = 0.1)`

# inject() — вычислить выражение с поддержкой !! и !!!
args <- list(x = 1:10, na.rm = TRUE)
inject(mean(!!!args))   # как do.call, но через unquoting
```

## 5.6 sym() / syms() — Строки → символы

```r
col_name <- "expr_ctrl"
sym(col_name)           # `expr_ctrl`

cols <- c("gene", "pval", "log2fc")
syms(cols)              # list(`gene`, `pval`, `log2fc`)

# Программный select через !!!syms():
select_cols <- c("gene", "pval")
df |> select(!!!syms(select_cols))

# Динамическое имя слева через :=
new_col <- "log2fc"
df |> mutate(!!new_col := log2(expr_treat / expr_ctrl))
# Или через glue:
prefix <- "log2"
df |> mutate("{prefix}_ctrl" := log2(ctrl))
```

## 5.7 Rlang-функции для окружений

```r
e <- env(x = 1, y = 2)              # new.env() + наполнение за один шаг
child <- env(parent = e, z = 3)

env_get(e, "x")
env_set(e, "w", 99)
env_has(e, "x")
env_ls(e)
env_unbind(e, "x")
env_parent(child)
env_inherits(child, e)   # является ли e предком child?

# Полезные функции для навигации по стеку в функциях:
current_env()            # текущее окружение (как environment(sys.function()))
caller_env()             # окружение вызывающей функции (как parent.frame())
caller_env(2)            # два уровня вверх
```

## 5.8 call2(), exec() — Программное создание и вызов функций

```r
# call2() — построить call-объект (rlang-версия call())
call2("mean", quote(x), na.rm = TRUE)    # `mean(x, na.rm = TRUE)`
call2("+", 1, 2)                          # `1 + 2`
call2("filter", quote(df), quote(x > 0)) # `filter(df, x > 0)`

# exec() — вызвать функцию с аргументами из списка (rlang-версия do.call)
exec("mean", x = 1:10, na.rm = TRUE)

args <- list(x = 1:10, na.rm = TRUE)
exec("mean", !!!args)   # то же через splice

# inject() — вычислить выражение с !! / !!!
col <- sym("x")
inject(mean(!!col, na.rm = TRUE))

# eval_bare() — eval() без data mask (чисто в окружении)
eval_bare(quote(x + 1), env = current_env())
```

---

# Часть 6. Data mask и eval_tidy()

> Data mask — это механизм, который делает возможным `filter(df, x > 0)`.
> Понимание его объясняет практически всё поведение dplyr.

## 6.1 Как работает data mask

При вычислении через `eval_tidy()` переменные ищутся в трёх местах по порядку:

```
1. Data mask (датафрейм или named list)   ← df$x, df$y
        ↓ не найдено
2. Окружение quosure (где был написан код) ← threshold, функции
        ↓ не найдено
3. Родительские окружения quosure          ← глобальное, пакеты
```

```r
df <- data.frame(x = 1:5, y = 6:10)
threshold <- 3

# eval_tidy с data mask:
eval_tidy(quo(x + y), data = df)        # x и y берутся из df
eval_tidy(quo(x > threshold), data = df)  # x из df, threshold из окружения

# Именно это отличает eval_tidy от eval:
eval(quote(x + y), envir = df)          # то же, но без quosure-окружения
# eval не знает, откуда брать threshold при вложенных вызовах
```

## 6.2 .data И .env — явное указание источника

В data mask имя сначала ищется в __данных__, потом в __окружении__.

Если имена совпадают, поведение может быть неожиданным.

`.data` и `.env` устраняют эту неоднозначность:

```r
x <- 99   # переменная в окружении

df |> filter(x > 5)           # x берётся из df (data mask в приоритете)
df |> filter(.data$x > 5)     # явно: x из датафрейма
df |> filter(.data$x > .env$x) # df$x > 99

# В функциях это критично:
filter_safe <- function(df, col, threshold) {
  df |> filter(.data[[col]] > .env$threshold)
  # .data[[col]]    — доступ к столбцу по строке (строка из col, не из df!)
  # .env$threshold  — переменная из окружения функции, не из df
}
filter_safe(df, "x", 3)
```

## 6.3 Создание data mask вручную

```r
# new_data_mask() — создать маску явно (для написания функций типа dplyr)
mask <- new_data_mask(
  bottom = new_environment(list(x = 1:5, y = 6:10)),
  top    = new_environment()
)
eval_tidy(quo(x + y), data = mask)

# as_data_mask() — обернуть list/data.frame в маску
eval_tidy(quo(x * 2), data = as_data_mask(list(x = 10)))
```

---

# Часть 7. Tidyselect — отдельный DSL для выбора столбцов

> __Data masking ≠ Tidy selection__ — это два разных механизма.
> Путаница между ними — источник большинства ошибок новичков.

## 7.1 Разница между data masking и tidy selection

```
Data masking (filter, mutate, summarise):
  - переменные ссылаются на столбцы по имени
  - поддерживает произвольные выражения: filter(df, x > mean(y))
  - реализован через eval_tidy() + quosures

Tidy selection (select, rename, pivot_longer):
  - выбирает столбцы по позиции, имени или паттерну
  - НЕ поддерживает произвольные выражения
  - реализован через пакет tidyselect (отдельный DSL)
```

```r
# Это НЕ одно и то же:
df |> filter(x > 0)        # data masking — x это столбец
df |> select(x)             # tidy selection — x это тоже столбец, но иначе!

# Ошибка: нельзя использовать функции tidy selection в filter и наоборот
df |> filter(starts_with("x"))   # ОШИБКА — starts_with() не работает в filter
df |> select(x > 0)              # ОШИБКА — условие не работает в select
```

## 7.2 Функции tidyselect

```r
library(dplyr)

df |> select(starts_with("expr"))      # столбцы, начинающиеся с "expr"
df |> select(ends_with("ctrl"))
df |> select(contains("log"))
df |> select(matches("^expr_[a-z]+$")) # regex
df |> select(num_range("sample", 1:3)) # sample1, sample2, sample3
df |> select(where(is.numeric))        # все числовые столбцы (предикат по типу)
df |> select(last_col())
df |> select(gene:pval)                # диапазон столбцов

# all_of() / any_of() — выбор по вектору строк
cols <- c("gene", "pval", "log2fc")
df |> select(all_of(cols))   # ошибка, если хотя бы один отсутствует
df |> select(any_of(cols))   # игнорирует отсутствующие

# Комбинирование:
df |> select(gene, where(is.numeric) & !ends_with("raw"))
```

## 7.3 Программирование с tidyselect

```r
# Передать вектор строк:
select_cols <- c("gene", "pval")
df |> select(all_of(select_cols))

# Передать имена как аргументы функции:
my_select <- function(df, ...) {
  df |> select(...)   # ... пробрасывается напрямую в tidyselect
}
my_select(df, gene, starts_with("expr"))

# where() — фильтрация по предикату
my_select_numeric <- function(df, predicate = is.numeric) {
  df |> select(where(predicate))
}

# across() — применить функцию к выбранным через tidyselect столбцам
# (across() работает внутри mutate/summarise и принимает tidyselect-выражения)
df |> mutate(across(where(is.numeric), log2))
df |> mutate(across(starts_with("expr"), ~ .x / max(.x)))
df |> summarise(across(all_of(c("ctrl","treat")),
                        list(mean = mean, sd = sd),
                        .names = "{.col}_{.fn}"))
# → ctrl_mean, ctrl_sd, treat_mean, treat_sd

# pick() — выбрать подмножество столбцов внутри mutate/summarise (dplyr >= 1.1.0)
df |> mutate(row_sum = rowSums(pick(where(is.numeric))))
```

---

# Часть 8. Программирование с dplyr: три уровня API

## 8.1 Выбор подхода

```
Задача                              Подход
─────────────────────────────────── ───────────────────────────────
Имя столбца известно заранее        Пишите прямо: filter(df, x > 0)
Имя столбца — строка                .data[[col]] или all_of(col)
Имя столбца — выражение пользователя {{ col }} (высокий уровень)
Нужна интроспекция выражения        enquo() + !! (низкий уровень)
Несколько столбцов через ...        enquos() + !!!
```

## 8.2 Паттерны в коде

```r
library(dplyr)

df <- data.frame(
  gene = c("TP53","BRCA1","EGFR"),
  ctrl = c(5.1, 3.2, 8.4),
  treat = c(7.8, 3.0, 9.1),
  group = c("A","A","B")
)

# ── Паттерн 1: выражение пользователя → {{ }} ─────────────────────────────
filter_expr <- function(df, cond) df |> filter({{ cond }})
mutate_log  <- function(df, col)  df |> mutate(log = log2({{ col }}))
filter_expr(df, ctrl > 4 & group == "A")

# ── Паттерн 2: имя столбца как строка → .data[[str]] ──────────────────────
filter_str <- function(df, col, threshold) {
  df |> filter(.data[[col]] > threshold)
}
filter_str(df, "ctrl", 4)

# ── Паттерн 3: несколько столбцов через ... ────────────────────────────────
group_summary <- function(df, ..., val) {
  df |>
    group_by(...) |>   # ... пробрасывается в tidyselect
    summarise(mean = mean({{ val }}, na.rm = TRUE), .groups = "drop")
}
group_summary(df, group, val = ctrl)

# ── Паттерн 4: строить имя результирующего столбца программно ─────────────
compute_log <- function(df, col) {
  col_name <- rlang::as_label(enquo(col))  # "ctrl" → строка "ctrl"
  df |> mutate("{col_name}_log2" := log2({{ col }}))
}
compute_log(df, ctrl)   # → колонка ctrl_log2

# ── Паттерн 5: выбор столбцов (tidyselect) ────────────────────────────────
scale_numeric <- function(df, ...) {
  df |> mutate(across(c(...), scale))
}
scale_numeric(df, ctrl, treat)
```

## 8.3 Вложенные функции и проброс выражений

```r
# Проблема: если оборачиваем dplyr-функцию в свою, {{ }} нужен на каждом уровне
outer <- function(df, col) {
  inner(df, {{ col }})  # ← {{ }} здесь тоже нужен!
}
inner <- function(df, col) {
  df |> filter({{ col }} > 0)
}
outer(df, ctrl)

# Проброс нескольких аргументов через ... остаётся прозрачным:
my_pipeline <- function(df, ...) {
  df |>
    filter(...) |>   # ... уходит в filter напрямую
    arrange(...)
}
```

---

# Часть 9. Обход и модификация AST

## 9.1 Рекурсивный обход

```r
# Рекурсивный обход AST
walk_ast <- function(x, depth = 0) {
  prefix <- strrep("  ", depth)
  if (is.symbol(x)) {
    cat(prefix, "SYMBOL:", as.character(x), "\n")
  } else if (is.call(x)) {
    cat(prefix, "CALL:", as.character(x[[1]]), "\n")
    for (i in seq_along(x)[-1]) walk_ast(x[[i]], depth + 1)
  } else {
    cat(prefix, "LITERAL:", deparse(x), "\n")
  }
}
walk_ast(quote(f(x + 1, y * 2)))
```

## 9.2 Модификация AST

```r
# Замена всех вхождений символа
replace_sym <- function(expr, from, to) {
  if (is.symbol(expr) && identical(expr, as.name(from)))
    return(as.name(to))
  if (is.call(expr))
    return(as.call(lapply(as.list(expr), replace_sym, from, to)))
  expr
}
replace_sym(quote(x + log(x)), "x", "value")   # `value + log(value)`

# Добавление аргумента в call
expr <- quote(f(x, y = 1))
expr[["z"]] <- quote(TRUE)
expr   # f(x, y = 1, z = TRUE)

# Замена функции в call
expr[[1]] <- quote(g)
expr   # g(x, y = 1, z = TRUE)
```

## 9.3 Практические паттерны генерации кода

```r
# Генерация множества похожих функций — фабрика
make_chr_filter <- function(chr) {
  chr_val <- chr
  function(df) filter(df, chromosome == !!chr_val)
}
filter_chr1 <- make_chr_filter("chr1")
filter_chrX <- make_chr_filter("chrX")

# Программная регистрация функций в окружении
chrs <- paste0("chr", c(1:22, "X", "Y"))
for (chr in chrs) {
  assign(paste0("filter_", chr), make_chr_filter(chr), envir = globalenv())
}

# Динамическое построение dplyr-пайплайна
build_pipeline <- function(df, filters = list(), select_cols = NULL, arrange_col = NULL) {
  result <- df
  for (f in filters) {
    result <- filter(result, !!f)
  }
  if (!is.null(select_cols)) result <- select(result, all_of(select_cols))
  if (!is.null(arrange_col)) result <- arrange(result, !!sym(arrange_col))
  result
}
filters <- list(quo(ctrl > 3), quo(group == "A"))
build_pipeline(df, filters, select_cols = c("gene","ctrl"), arrange_col = "ctrl")

# Формулы для моделей
make_formula <- function(outcome, predictors, random = NULL) {
  fixed <- paste(predictors, collapse = " + ")
  rhs   <- if (!is.null(random))
    paste(fixed, "+", paste(sprintf("(1|%s)", random), collapse = " + "))
  else
    fixed
  as.formula(paste(outcome, "~", rhs))
}
make_formula("expr", c("age","treatment"), random = "patient_id")
# → expr ~ age + treatment + (1|patient_id)
```

---

# Часть 10. Замыкания и фабрики функций

Замыкание (closure) — функция, "помнящая" переменные из своего окружения определения.

```r
make_power <- function(exp) {
  function(x) x^exp   # exp захвачен из окружения make_power
}
square <- make_power(2)
cube   <- make_power(3)
square(4)   # 16

# <<- ищет переменную в родительских окружениях и изменяет её там
make_counter <- function() {
  count <- 0
  list(
    increment = function(by = 1) { count <<- count + by; invisible(count) },
    get       = function() count,
    reset     = function() { count <<- 0 }
  )
}
ctr <- make_counter()
ctr$increment(); ctr$increment()
ctr$get()   # 2

# Мемоизация — кэширование результатов через замыкание
memoize <- function(f) {
  cache <- list()
  function(...) {
    key <- paste(..., sep = "_")
    if (!is.null(cache[[key]])) return(cache[[key]])
    result <- f(...)
    cache[[key]] <<- result
    result
  }
}
fast_sqrt <- memoize(sqrt)
fast_sqrt(16)   # вычислено
fast_sqrt(16)   # из кэша
```

---

# Часть 11. Операторы и инфиксные функции

```r
# Любая функция вида `%name%` — инфиксный оператор
`%between%` <- function(x, range) x >= range[1] & x <= range[2]
5 %between% c(1, 10)   # TRUE

`%+%` <- function(a, b) paste0(a, b)
"gene_" %+% "TP53"   # "gene_TP53"

# |> (base R, 4.1+) — правая часть обязана быть вызовом функции
1:10 |> mean()
1:10 |> (\(x) mean(x, na.rm = TRUE))()  # анонимная функция как placeholder

# magrittr
library(magrittr)
df %<>% filter(ctrl > 3)              # pipe + присваивание
df %T>% { cat("Rows:", nrow(.), "\n") } |> head()  # tee (побочный эффект без разрыва цепи)
df %$% cor(ctrl, treat)               # expose names (как with())
```

---

# Часть 12. Отладка и интроспекция выражений

```r
library(lobstr)
ast(f(x + 1, y * z))         # AST в виде дерева
obj_size(x)                   # реальный размер с учётом sharing

# Стек вызовов
traceback()                   # после ошибки
sys.calls()                   # прямо сейчас
sys.frames()                  # все окружения в стеке

# Диагностика что именно захватывается
spy <- function(...) {
  args <- rlang::enquos(...)
  for (nm in names(args)) {
    cat(nm, ": ", deparse(rlang::quo_get_expr(args[[nm]])), "\n", sep = "")
    cat("   env: ", environmentName(rlang::quo_get_env(args[[nm]])), "\n")
  }
}
spy(x = a + b, y = sqrt(z))

# Когда dplyr-функция ведёт себя странно внутри другой функции:
debug_quo <- function(df, col) {
  q <- enquo(col)
  cat("Выражение:", deparse(quo_get_expr(q)), "\n")
  cat("Окружение:", environmentName(quo_get_env(q)), "\n")
  eval_tidy(q, df)
}
```

---

# Итоговая шпаргалка

## Выбор инструмента

| Задача | Base R | rlang / tidyverse |
|---|---|---|
| Захватить выражение без вычисления | `quote()` | `expr()` |
| Захватить аргумент внутри функции | `substitute()` | `enquo()` / `{{ }}` |
| Захватить несколько аргументов (`…`) | — | `enquos()` |
| Частичное вычисление в выражении | `bquote(.(val))` | `!!val` |
| Вставить список аргументов | `do.call()` | `!!!list` / `inject()` / `exec()` |
| Строка → символ | `as.name("x")` | `sym("x")` |
| Выражение → строка | `deparse()` | `rlang::expr_text()` |
| Вычислить в окружении | `eval(expr, env)` | `eval_bare(expr, env)` |
| Вычислить с data mask | `eval(expr, df, parent.frame())` | `eval_tidy(quo, data)` |
| Создать call программно | `call("f", args)` | `call2("f", args)` |
| Вызвать функцию с list аргументов | `do.call()` | `exec()` / `inject()` |
| Работа с окружениями | `new.env()`, `get()`, `assign()` | `env()`, `env_get()`, `env_set()` |
| Окружение вызывающей функции | `parent.frame()` | `caller_env()` |
| Доступ к столбцу по строке в dplyr | — | `.data[[col]]` |
| Доступ к переменной окружения в dplyr | — | `.env$var` |
| Выбор столбцов по вектору строк | — | `all_of()` / `any_of()` |

## Когда что использовать: высокий vs низкий уровень

```
Высокоуровневый API (большинство случаев):
    {{ col }}          — аргумент-выражение в функции-обёртке
    .data[[col]]       — имя столбца как строка
    all_of(cols)       — вектор строк в tidyselect
    across(where(...)) — применить к нескольким столбцам

Низкоуровневый API (пакеты, сложная генерация кода):
    enquo() + !!       — когда нужен доступ к quosure-объекту
    enquos() + !!!     — несколько аргументов
    call2() / exec()   — программное построение вызовов
    eval_tidy()        — явная работа с data mask
    new_data_mask()    — написание своих "dplyr-подобных" функций
```

## Главные концептуальные связи

```
Promise (R runtime)
    = expression + environment + evaluated_flag
    → substitute() перехватывает expression из promise

Quosure (rlang)
    = expression + environment
    → enquo() создаёт quosure из promise аргумента
    → quo() создаёт quosure вручную
    → {{ x }} = !!enquo(x)

Data mask (tidy eval)
    = data frame / list как "первый" слой поиска
    → eval_tidy(quosure, data) ищет: data → quosure env → parents
    → .data[[col]] = явный доступ к маске
    → .env$var     = явный доступ к окружению

Tidyselect (отдельный DSL)
    ≠ data masking
    → работает в select/rename/pivot_longer/across()
    → starts_with(), where(), all_of() — не используются в filter/mutate напрямую
```
