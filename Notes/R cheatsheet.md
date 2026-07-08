---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Справочник по основным функциям и приёмам программирования на языке R для биоанализа и статистики
tags: []
type: 📄note
🖥️IT:
  - R
---

---

# 1. Базовые структуры данных

## 1.1 Векторы

```r
v <- c(1, 2, 3, NA, 5)          # числовой вектор
g <- c("TP53", "BRCA1", "EGFR") # символьный вектор
l <- c(TRUE, FALSE, NA)         # логический

length(v)
typeof(v); class(v)
is.na(v)
v[!is.na(v)]                    # убрать NA
names(v) <- c("a","b","c","d","e")
v["a"]

# Векторизация — основа эффективного R
v * 2
v > 2
ifelse(v > 2, "high", "low")
```

## 1.2 Факторы (категориальные переменные)

Часто используются для групп образцов (control/treatment, condition и т.д.)

```r
group <- factor(c("ctrl","ctrl","treat","treat"))
levels(group)
nlevels(group)
as.integer(group)               # внутреннее кодирование
relevel(group, ref = "ctrl")    # назначить базовый уровень (важно для моделей!)
droplevels(group[group != "treat"])  # убрать неиспользуемые уровни

# Часто проблема: число превратилось в фактор
x <- factor(c("10","20","5"))
as.numeric(as.character(x))     # ПРАВИЛЬНО
# as.numeric(x)                 # НЕПРАВИЛЬНО — даст коды уровней, не значения!
```

## 1.3 Матрицы

Стандартное представление для матрицы экспрессии (генов × образцов).

```r
m <- matrix(1:12, nrow = 3, ncol = 4,
             dimnames = list(paste0("gene", 1:3), paste0("sample", 1:4)))
m[1, ]                # первая строка
m["gene1", "sample2"]
t(m)                  # транспонирование
dim(m); nrow(m); ncol(m)
rowSums(m); colSums(m)
rowMeans(m); colMeans(m)
apply(m, 1, sum)      # по строкам (1 = rows)
apply(m, 2, mean)     # по столбцам (2 = cols)

log2(m + 1)           # логарифмирование с псевдокаунтом
m %*% t(m)            # матричное умножение
```

## 1.4 Списки (list)

Универсальный контейнер: разные типы и длины элементов. Основа для результатов сложных функций (`lm()`, `prcomp()`, список датафреймов по образцам и т.п.).

```r
res <- list(
  id = "sample1",
  counts = c(10, 20, 30),
  meta = data.frame(gene = c("A","B"), pval = c(0.01, 0.2))
)

res$counts
res[["meta"]]
res[["meta"]]$pval
str(res)              # самый полезный способ "посмотреть внутрь" объекта

# Список датафреймов — типичная ситуация при обработке нескольких образцов
dfs <- list(s1 = data.frame(x=1:3), s2 = data.frame(x=4:6))
lapply(dfs, nrow)
do.call(rbind, dfs)                    # склеить в один датафрейм
dplyr::bind_rows(dfs, .id = "sample") # с сохранением имени источника
```

## 1.5 Датафреймы / tibble

```r
df <- data.frame(
  gene = c("TP53","BRCA1","EGFR","MYC"),
  expr_ctrl = c(5.1, 3.2, 8.4, 6.7),
  expr_treat = c(7.8, 3.0, 9.1, 12.4),
  stringsAsFactors = FALSE
)

str(df)
dim(df); nrow(df); ncol(df)
colnames(df); rownames(df)
head(df, 2); tail(df, 2)

# tibble (из tidyverse) — современная замена data.frame
library(tibble)
tb <- as_tibble(df)
```

---

# 2. Размерности, drop = FALSE и работа с rownames

## 2.1 Как R "роняет" размерность и когда это ломает код

При индексации матрицы или датафрейма R по умолчанию __упрощает__ результат: выбор одной строки или одного столбца возвращает вектор, а не матрицу/датафрейм. Это называется "dropping dimension" и часто является источником трудноуловимых ошибок.

```r
m <- matrix(1:12, nrow = 3, ncol = 4,
            dimnames = list(paste0("gene", 1:3), paste0("sample", 1:4)))

m[1, ]           # вектор! dim == NULL, names == colnames(m)
m[, 1]           # вектор! dim == NULL, names == rownames(m)
class(m[1, ])    # "integer", не "matrix"

# drop = FALSE — сохранить матричную размерность
m[1, , drop = FALSE]     # матрица 1×4
m[, 1, drop = FALSE]     # матрица 3×1
class(m[1, , drop = FALSE])  # "matrix" "array"

# Типичная ошибка: функция ожидает матрицу, получает вектор
apply(m[1, ], 1, mean)            # ОШИБКА: у вектора нет "строк"
apply(m[1, , drop = FALSE], 1, mean)  # OK

# Аналогично для датафрейма
df[, "expr_ctrl"]              # вектор
df[, "expr_ctrl", drop = FALSE]  # датафрейм из одного столбца

# Tibble НЕ роняет размерность автоматически — это одно из его преимуществ:
tb <- tibble::as_tibble(df)
class(tb[, "expr_ctrl"])   # "tbl_df" — сохраняет тип таблицы
```

## 2.2 dim(), length() И неочевидные случаи

```r
v <- 1:6
dim(v)       # NULL — у вектора нет dim
length(v)    # 6

# Превратить вектор в матрицу, назначив dim:
dim(v) <- c(2, 3)
v              # теперь это матрица 2×3!
class(v)       # "matrix" "array"

# Массивы (array) — обобщение матрицы на N измерений
a <- array(1:24, dim = c(2, 3, 4))
dim(a)         # 2 3 4
a[1, , ]       # "срез" по первому измерению → матрица 3×4
a[1, , , drop = FALSE]  # массив 1×3×4 (сохранить размерность)

# NROW / NCOL работают и для векторов (воспринимают их как матрицу-столбец)
NROW(v)   # 6 (а не NULL как у nrow)
NCOL(v)   # 1
```

## 2.3 Работа с rownames

В биоинформатике `rownames` матрицы экспрессии — это ID генов. Это важнейший "ключ" для совмещения данных, и с ним часто работают напрямую.

```r
m <- matrix(rnorm(12), nrow = 3,
            dimnames = list(c("TP53","BRCA1","EGFR"), paste0("s", 1:4)))

rownames(m)                     # получить
rownames(m) <- c("A","B","C")  # установить
colnames(m)
dimnames(m)                     # список: list(rownames, colnames)

# Использовать rownames как столбец — частый паттерн перед join
df <- as.data.frame(m)
df$gene <- rownames(df)         # вытащить rownames в колонку
# или через tibble:
tibble::rownames_to_column(df, var = "gene")

# Обратно: сделать столбец rownames (например, перед as.matrix)
df2 <- tibble::column_to_rownames(df, var = "gene")

# Фильтрация матрицы по rownames
genes_of_interest <- c("TP53", "EGFR")
m[rownames(m) %in% genes_of_interest, ]

# Совмещение двух матриц по генам (rownames как ключ)
common_genes <- intersect(rownames(m1), rownames(m2))
m1_sub <- m1[common_genes, ]
m2_sub <- m2[common_genes, ]   # теперь строки гарантированно совпадают

# Опасная ловушка: после subset/filter tibble rownames сбрасываются в 1,2,3,...
# Всегда проверяй rownames после манипуляций!
df_filtered <- df[df$expr_ctrl > 5, ]
rownames(df_filtered)           # не подряд! это исходные индексы
rownames(df_filtered) <- NULL   # сбросить в 1,2,3,...

# data.frame с rownames → чтение/запись
write.table(m, "matrix.tsv", sep="\t", quote=FALSE)
m2 <- read.table("matrix.tsv", sep="\t", header=TRUE, row.names=1)
```

---

# 3. Формулы (~)

Формула — это языковой объект (`y ~ x`), несущий структуру модели или отношение между переменными. Используется повсеместно: в моделях (`lm`, `glm`, `lmer`), агрегации (`aggregate`, `xtabs`), разбивке графиков (`facet_wrap`), статистических тестах (`t.test(y ~ group)`).

## 3.1 Анатомия формулы

```r
f <- expr_treat ~ expr_ctrl + group
class(f)          # "formula"
f[[1]]            # `~`   — оператор
f[[2]]            # левая часть (response): `expr_treat`
f[[3]]            # правая часть (predictors): `expr_ctrl + group`
environment(f)    # формула несёт окружение — переменные ищутся там

# Односторонняя формула (без response) — используется в reshape, ggplot, и т.д.
~ group + batch   # только правая часть
(~ group)[[2]]    # `group`
```

## 3.2 Формулы в моделях

```r
# lm, glm — стандартное использование
fit <- lm(expr_treat ~ expr_ctrl, data = df)
fit <- lm(expr_treat ~ expr_ctrl + group, data = df)
fit <- lm(expr_treat ~ ., data = df)          # все остальные столбцы
fit <- lm(expr_treat ~ . - gene, data = df)   # все, кроме gene
fit <- lm(expr_treat ~ expr_ctrl * group, data = df)  # + взаимодействие
fit <- lm(expr_treat ~ I(expr_ctrl^2), data = df)     # I() — буквальное выражение

# update() — модифицировать формулу существующей модели
fit2 <- update(fit, . ~ . + batch)   # добавить предиктор
fit3 <- update(fit, . ~ . - group)   # убрать предиктор

# Извлечение компонентов результата
coef(fit)
summary(fit)
fitted(fit)    # предсказанные значения
residuals(fit)
predict(fit, newdata = data.frame(expr_ctrl = c(5, 8)))

# t.test / wilcox.test через формулу
t.test(expr_ctrl ~ group, data = df)
wilcox.test(expr_ctrl ~ group, data = df)
```

## 3.3 Формулы в агрегации и таблицах

```r
# aggregate — формула определяет "что по чему"
aggregate(expr_ctrl ~ group, data = df, FUN = mean)
aggregate(cbind(expr_ctrl, expr_treat) ~ group, data = df, FUN = mean)

# xtabs — кросс-таблица
xtabs(~ group + significant, data = df)  # частоты
xtabs(expr_ctrl ~ group + significant, data = df)  # суммы значений
```

## 3.4 Формулы в ggplot2

```r
library(ggplot2)
# facet_wrap и facet_grid принимают формулы
ggplot(df_long, aes(x = sample, y = expression)) +
  geom_boxplot() +
  facet_wrap(~ group)                  # разбить по group
  # facet_grid(batch ~ group)          # строки ~ столбцы
```

## 3.5 Программное создание формул

```r
# Способ 1: через строки (просто, но хрупко)
vars <- c("age", "bmi", "treatment")
f <- as.formula(paste("outcome ~", paste(vars, collapse = " +")))

# Способ 2: reformulate (чище)
reformulate(termlabels = vars, response = "outcome")
reformulate(c("age","bmi"), response = "expr_treat", intercept = TRUE)

# Способ 3: модификация существующей формулы через update
base_f <- outcome ~ age
update(base_f, . ~ . + bmi + treatment)

# Разбор формулы обратно на части
f <- expr ~ age + bmi + group
all.vars(f)           # c("expr","age","bmi","group") — все переменные
terms(f)              # объект terms — метаданные о структуре модели
attr(terms(f), "term.labels")   # c("age","bmi","group") — только предикторы
```

---

# 4. Индексация и подмножества (subsetting)

```r
df[1, ]                  # первая строка
df[, "gene"]              # столбец (вектор)
df[["gene"]]              # то же
df$gene                   # то же
df[df$expr_ctrl > 5, ]    # строки по условию
df[, c("gene","expr_ctrl")]  # выбор столбцов

# subset() — короче, но осторожно с NSE в функциях
subset(df, expr_treat > 8, select = c(gene, expr_treat))

# which() — индексы условий
idx <- which(df$expr_ctrl > 5)
df[idx, ]

# %in% — проверка принадлежности
target_genes <- c("TP53","EGFR")
df[df$gene %in% target_genes, ]

# match() — найти позиции соответствия (важно для совмещения таблиц по ID)
match(c("EGFR","MYC"), df$gene)
```

---

# 5. Семейство `apply`

Базовая альтернатива циклам `for` — векторизованное применение функций.

| Функция                     | Вход                         | Выход                                         |
| --------------------------- | ---------------------------- | --------------------------------------------- |
| `sapply(X, f)`              | вектор/список                | вектор/матрица (упрощённый)                   |
| `lapply(X, f)`              | вектор/список                | список                                        |
| `vapply(X, f, FUN.VALUE=…)` | вектор/список                | вектор (с проверкой типа — безопаснее sapply) |
| `apply(X, MARGIN, f)`       | матрица/массив               | по строкам(1)/столбцам(2)                     |
| `mapply(f, X, Y)`           | несколько векторов           | применяет f(x,y) поэлементно                  |
| `tapply(X, INDEX, f)`       | вектор + группирующий фактор | агрегация по группам                          |
| `Map(f, X, Y)`              | списки                       | список (как mapply, но без simplify)          |
| `Reduce(f, X)`              | список                       | накопление (свёртка)                          |
| `Filter(f, X)`              | список/вектор                | элементы, для которых f(x)==TRUE              |

```r
genes <- list(a = c(1,2,3), b = c(4,5,6,7))
sapply(genes, mean)
lapply(genes, range)
vapply(genes, sum, numeric(1))

# tapply — классика для агрегации по группам
expr <- c(5.1, 3.2, 8.4, 6.7)
grp  <- factor(c("A","A","B","B"))
tapply(expr, grp, mean)

# Reduce — последовательное объединение нескольких таблиц
tables <- list(df1, df2, df3)
Reduce(function(x, y) merge(x, y, by = "gene"), tables)
```

---

# 6. Purrr — функциональное программирование

`purrr` — tidyverse-реализация map/filter/reduce с предсказуемыми типами возврата. Основное преимущество перед `lapply`/`sapply`: явный тип результата и удобная обработка ошибок.

## 6.1 map_*() — Применить функцию к каждому элементу

```r
library(purrr)

# Суффикс определяет тип результата — никаких сюрпризов как у sapply
map(1:3, ~ .x^2)              # всегда список
map_dbl(1:3, ~ .x^2)          # числовой вектор double
map_int(1:3, as.integer)       # целочисленный вектор
map_chr(1:3, ~ paste0("s", .x))# символьный вектор
map_lgl(1:3, ~ .x > 1)        # логический вектор
map_df(1:3,  ~ data.frame(x = .x, y = .x^2))  # датафрейм (bind_rows результатов)

# Формула .x — это анонимная функция: ~ .x^2  ≡  function(.x) .x^2
# В R >= 4.1 можно использовать \(x) x^2 вместо ~ .x^2
map_dbl(1:3, \(x) x^2)
```

## 6.2 Map2, pmap — несколько входов параллельно

```r
# map2_*() — по двум спискам поэлементно
map2_dbl(c(1,2,3), c(10,20,30), ~ .x + .y)
map2_chr(genes, chrs, ~ paste0(.x, "_", .y))

# pmap_*() — по произвольному числу входов (передаются как список)
params <- list(mean = c(0, 1, 2), sd = c(1, 2, 3), n = c(10, 20, 30))
pmap(params, rnorm)           # вызывает rnorm(n=10, mean=0, sd=1), rnorm(20,1,2), ...
# Имена списка совпадают с именами аргументов функции — это ключевой механизм!

# walk — как map, но только для побочных эффектов (запись файлов, логирование)
files <- c("a.tsv", "b.tsv", "c.tsv")
walk(files, ~ cat("Processing:", .x, "\n"))
walk2(dfs, names(dfs), ~ write.csv(.x, paste0(.y, ".csv")))
```

## 6.3 Безопасные обёртки: safely, possibly, quietly

```r
# safely() — оборачивает функцию, возвращает list(result, error)
safe_log <- safely(log)
safe_log(10)    # list(result = 2.302, error = NULL)
safe_log("x")   # list(result = NULL, error = <- simpleError>)

# Применение к списку с частичными ошибками:
results <- map(list(1, -1, "x"), safely(log))
successes <- map(results, "result")   # результаты (NULL там, где ошибка)
errors    <- map(results, "error")    # ошибки (NULL там, где успех)
transpose(results)$result            # альтернатива: транспонировать список
# Убрать NULLы и собрать только успешные результаты:
keep(successes, ~ !is.null(.x)) |> map_dbl(identity)

# possibly() — вернуть значение по умолчанию вместо ошибки
possibly_log <- possibly(log, otherwise = NA_real_)
map_dbl(list(1, -1, "x"), possibly_log)   # c(0, NaN, NA)

# quietly() — перехватить предупреждения и сообщения
quiet_log <- quietly(log)
quiet_log(-1)   # list(result = NaN, output = "", warnings = "NaNs produced", messages = "")
```

## 6.4 Фильтрация и сворачивание списков

```r
keep(1:5, ~ .x %% 2 == 0)       # c(2, 4) — оставить подходящие
discard(1:5, ~ .x %% 2 == 0)    # c(1, 3, 5) — выбросить подходящие
compact(list(1, NULL, 3, NULL))  # list(1, 3) — убрать NULL

# reduce — свернуть список в одно значение
reduce(1:5, `+`)                 # 15 (сумма)
reduce(list(df1, df2, df3), left_join, by = "gene")  # последовательный join

# accumulate — как reduce, но сохраняет промежуточные результаты
accumulate(1:5, `+`)             # c(1, 3, 6, 10, 15)
```

## 6.5 Работа с вложенными списками

```r
# pluck() — безопасное извлечение из вложенных структур
res <- list(a = list(x = 1, y = 2), b = list(x = 3, y = 4))
pluck(res, "a", "x")       # 1 (аналог res[["a"]][["x"]], но не падает на NULL)
pluck(res, 1, 2)            # 2 (по позиции)
map(res, pluck, "x")        # list(a=1, b=3) — извлечь "x" из каждого элемента

# modify() — как map, но возвращает структуру того же типа
modify(list(a=1, b=2), ~ .x * 10)  # list(a=10, b=20)
modify_if(df, is.numeric, ~ round(.x, 2))  # изменить только числовые столбцы

# imap() — map с доступом к имени/индексу элемента
imap_chr(c(x=1, y=2), ~ paste(.y, "=", .x))  # c("x = 1", "y = 2")
```

## 6.6 Сравнение apply и purrr

|Задача|base R|purrr|
|---|---|---|
|Применить к списку → список|`lapply(x, f)`|`map(x, f)`|
|Применить к списку → вектор|`sapply(x, f)` ⚠️|`map_dbl/chr/lgl(x, f)` ✓|
|Применить к двум спискам|`mapply(f, x, y)`|`map2(x, y, f)`|
|Первое вхождение ошибки ломает всё|`lapply` упадёт|`safely/possibly` — нет|
|Извлечь элемент по имени|`lapply(x, "[[", "name")`|`map(x, "name")`|

---

# 7. Dplyr (манипуляция датафреймами, tidyverse)

```r
library(dplyr)

df |>
  filter(expr_ctrl > 4) |>
  mutate(log2fc = log2(expr_treat / expr_ctrl),
         significant = abs(log2fc) > 1) |>
  arrange(desc(log2fc)) |>
  select(gene, log2fc, significant)

# Группировка и агрегация
df |>
  group_by(significant) |>
  summarise(n = n(), mean_fc = mean(log2fc, na.rm = TRUE))

# rename, distinct, slice
df |> rename(ctrl = expr_ctrl, treat = expr_treat)
df |> distinct(gene)
df |> slice_max(expr_treat, n = 2)

# across() — применить функцию к нескольким столбцам
df |> mutate(across(starts_with("expr"), ~ log2(.x + 1)))
df |> summarise(across(where(is.numeric), mean, na.rm = TRUE))

# case_when — множественные условия
df |> mutate(category = case_when(
  log2fc >  1 ~ "up",
  log2fc <-  -1 ~ "down",
  TRUE        ~ "ns"
))
```

## Объединение таблиц (joins)

```r
genes_anno <- data.frame(gene = c("TP53","BRCA1","EGFR"), chr = c("17","17","7"))

left_join(df, genes_anno, by = "gene")   # все строки df
inner_join(df, genes_anno, by = "gene")  # только совпадения
full_join(df, genes_anno, by = "gene")   # все строки из обеих
anti_join(df, genes_anno, by = "gene")   # строки df без совпадения
semi_join(df, genes_anno, by = "gene")   # фильтр без добавления колонок

merge(df, genes_anno, by = "gene", all.x = TRUE)  # base R аналог
```

## Объединение по строкам/столбцам

```r
rbind(df1, df2)          # одинаковые столбцы — "снизу"
cbind(df1, df2)          # одинаковое число строк — "сбоку"
bind_rows(df1, df2)      # как rbind, но терпит разные/недостающие столбцы
bind_cols(df1, df2)
```

---

# 8. Tidyr — преобразование формы (long ↔ wide)

```r
library(tidyr)

wide <- data.frame(gene = c("TP53","EGFR"),
                    sample1 = c(5.1, 8.4), sample2 = c(7.8, 9.1))

long <- wide |>
  pivot_longer(cols = starts_with("sample"),
               names_to = "sample", values_to = "expression")

back_to_wide <- long |>
  pivot_wider(names_from = sample, values_from = expression)

# separate / unite
long |> separate(gene, into = c("gene","chr"), sep = "_")
long |> unite("gene_sample", gene, sample, sep = "_")

# drop_na / replace_na
long |> drop_na(expression)
long |> replace_na(list(expression = 0))
```

---

# 9. Строки: base R и stringr

```r
library(stringr)

x <- - "ENSG00000141510.7"

# base R
nchar(x); substr(x, 1, 4)
strsplit(x, "\\.")[[1]]
toupper(x); tolower(x)
sprintf("Gene: %s (%.2f)", "TP53", 0.0123)
paste("a", "b", sep = "_"); paste0("sample_", 1:3)

# stringr
str_split(x, "\\.")[[1]]
str_sub(x, 1, 4)
str_detect(x, "^ENSG")
str_extract(x, "^[A-Z]+")
str_remove(x, "\\.[0-9]+$")        # убрать версию транскрипта
str_pad("5", width = 3, pad = "0") # "005"
str_trim("  TP53  ")
str_replace_all(x, "ENSG", "GENE")
```

---

# 10. Регулярные выражения

```r
genes <- c("TP53", "BRCA1", "MIR21", "LOC100", "EGFR")

grep("^MIR", genes)                 # индексы
grep("^MIR", genes, value = TRUE)   # значения
grepl("^MIR", genes)                # логический вектор

sub("1$", "", "BRCA1")    # заменить первое совпадение → "BRCA"
gsub("[0-9]", "", "TP53") # заменить все → "TP"

# regmatches — извлечь группы
m <- regmatches("chr17:7565097-7590856",
                 regexec("chr(\\w+):(\\d+)-(\\d+)", "chr17:7565097-7590856"))
m[[1]]   # [1] "chr17:7565097-7590856" "17" "7565097" "7590856"

df[grepl("^TP", df$gene), ]  # фильтрация датафрейма
```

---

# 11. NA, дубликаты, уникальность, сортировка

```r
v <- c(3, NA, 1, 1, 5, NA)

is.na(v); anyNA(v); sum(is.na(v))
na.omit(v)
complete.cases(df)
df[complete.cases(df), ]
mean(v, na.rm = TRUE)

unique(v)
duplicated(v)
df[!duplicated(df$gene), ]

sort(v, decreasing = TRUE)
order(df$expr_ctrl)
df[order(-df$expr_ctrl), ]
rank(v)
```

---

# 12. Таблицы частот и кросс-таблицы

```r
table(group)
table(df$significant, df$chr)
prop.table(table(group))
addmargins(table(df$significant))

aggregate(expr_ctrl ~ significant, data = df, FUN = mean)
xtabs(~ significant + chr, data = df)
```

---

# 13. Преобразование между структурами

```r
as.data.frame(m)
as.matrix(df[, -1])        # только числовые столбцы!
as.list(df)
unlist(list(a=1, b=2))
stack(list(a=1:2, b=3:4))  # список векторов → датафрейм (value, ind)

setNames(df$expr_ctrl, df$gene)  # data.frame → именованный вектор

# Преобразование типов столбца
df$gene <- as.character(df$gene)
df$expr_ctrl <- as.numeric(df$expr_ctrl)
df$significant <- as.logical(df$significant)

# Применить функцию ко всем числовым столбцам
df[sapply(df, is.numeric)] <- lapply(df[sapply(df, is.numeric)], round, 2)
```

---

# 14. data.table — Для больших таблиц

```r
library(data.table)

dt <- fread("counts.tsv")
dt <- as.data.table(df)

dt[expr_ctrl > 5]
dt[, mean(expr_treat)]
dt[, log2fc := log2(expr_treat/expr_ctrl)]  # добавить столбец на месте
dt[, .(gene, log2fc)]
dt[, .(mean_fc = mean(log2fc)), by = significant]

setkey(dt, gene)
dt[genes_anno_dt, on = "gene"]

fwrite(dt, "result.tsv", sep = "\t")
```

---

# 15. Чтение и запись данных

```r
# base R
df <- read.csv("data.csv", stringsAsFactors = FALSE)
df <- read.table("data.tsv", sep = "\t", header = TRUE, row.names = 1)
write.csv(df, "out.csv", row.names = FALSE)
write.table(df, "out.tsv", sep = "\t", quote = FALSE, row.names = FALSE)

# readr (tidyverse)
library(readr)
df <- read_csv("data.csv")
df <- read_tsv("data.tsv")
write_csv(df, "out.csv")

# R-объекты
saveRDS(df, "df.rds");  df <- readRDS("df.rds")
save(df, m, file = "workspace.RData");  load("workspace.RData")

# Excel
# library(readxl);   read_excel("data.xlsx", sheet = 1)
# library(openxlsx); write.xlsx(df, "out.xlsx")
```

---

# 16. Диагностика типов и атрибутов объектов

Главный практический навык при работе с незнакомыми объектами — понять что перед тобой, прежде чем пытаться с ним что-то сделать.

## 16.1 Иерархия "что такое этот объект"

```r
# Три разных вопроса, три разных ответа
x <- matrix(1:6, nrow = 2)
typeof(x)    # "integer"  — базовый тип хранения в памяти
mode(x)      # "numeric"  — режим (более грубое, чем typeof)
class(x)     # "matrix" "array" — как R интерпретирует объект

# Для большинства объектов:
# typeof → физический тип ("double","integer","list","closure","environment"...)
# class  → логический тип (определяет поведение в S3/S4 диспетчеризации)

typeof(1L)         # "integer"
typeof(1.0)        # "double"
typeof(TRUE)       # "logical"
typeof(list())     # "list"
typeof(quote(x))   # "symbol"
typeof(function(){}) # "closure"
typeof(1:3)        # "integer"

# class может быть задан явно (S3) или выводиться из typeof:
class(1L)          # "integer"
class(1.0)         # "numeric"
class(list())      # "list"
class(NULL)        # "NULL"
```

## 16.2 Атрибуты — метаданные объекта

Атрибуты — это именованный список, прикреплённый к любому объекту. `class`, `dim`, `names`, `dimnames`, `levels` — всё это атрибуты.

```r
x <- matrix(1:6, nrow = 2, dimnames = list(c("r1","r2"), c("c1","c2","c3")))

attributes(x)        # все атрибуты сразу: list(dim=..., dimnames=...)
attr(x, "dim")       # конкретный атрибут
attr(x, "custom") <- - "my_tag"  # установить произвольный атрибут
attr(x, "custom")    # "my_tag"

# Стандартные атрибуты и их функции-обёртки:
dim(x)               # attr(x, "dim")
names(x)             # attr(x, "names")
class(x)             # attr(x, "class")
levels(f)            # attr(f, "levels") — для факторов
dimnames(x)          # attr(x, "dimnames") — для матриц

# Убрать class — "разоблачить" объект:
unclass(factor(c("a","b")))   # integer с атрибутом levels

# structure() — создать объект с атрибутами за один шаг
v <- structure(1:6, dim = c(2,3), dimnames = list(c("r1","r2"), NULL),
               class = "matrix")
```

## 16.3 Полный осмотр незнакомого объекта

```r
# Протокол осмотра — последовательность вопросов:
inspect <- function(x) {
  cat("class:     ", paste(class(x), collapse=", "), "\n")
  cat("typeof:    ", typeof(x), "\n")
  cat("length:    ", length(x), "\n")
  cat("dim:       ", paste(dim(x), collapse=" x "), "\n")
  cat("names:     ", paste(head(names(x), 5), collapse=", "), "\n")
  cat("attributes:", paste(names(attributes(x)), collapse=", "), "\n")
  cat("is.* flags:\n")
  cat("  is.list:   ", is.list(x), "\n")
  cat("  is.vector: ", is.vector(x), "\n")
  cat("  is.atomic: ", is.atomic(x), "\n")
  cat("str:\n"); str(x)
}

# На практике достаточно:
class(obj)          # 1. какой класс
typeof(obj)         # 2. какой базовый тип
str(obj)            # 3. структура (почти всегда самое информативное)
attributes(obj)     # 4. все метаданные
names(obj)          # 5. имена элементов (для списков, датафреймов, S3)
```

## 16.4 Флаги is.*

```r
# Проверки типа возвращают TRUE/FALSE — используются в условиях и across(where(...))
is.numeric(x)    # TRUE для double и integer
is.double(x)     # только double
is.integer(x)    # только integer (суффикс L: 1L)
is.character(x)
is.logical(x)
is.factor(x)
is.list(x)       # TRUE и для data.frame!
is.data.frame(x)
is.matrix(x)
is.array(x)
is.function(x)
is.null(x)
is.na(x)         # поэлементно
is.finite(x); is.infinite(x); is.nan(x)

# Важный нюанс: is.vector() возвращает TRUE только если у объекта НЕТ атрибутов (кроме names)
is.vector(1:3)          # TRUE
is.vector(matrix(1:4, 2, 2))  # FALSE — есть dim
is.atomic(matrix(1:4, 2, 2))  # TRUE — атомарный тип хранения
```

## 16.5 Диагностика датафрейма целиком

```r
# Быстрый обзор типов всех столбцов
sapply(df, class)
sapply(df, typeof)
sapply(df, function(x) c(class=class(x), NAs=sum(is.na(x)), unique=length(unique(x))))

# Найти столбцы по типу
df[, sapply(df, is.numeric)]
df[, sapply(df, is.character)]
df[, sapply(df, is.factor)]

# summary — числовые получают min/max/median, строки — топ значений
summary(df)

# dplyr::glimpse() — компактный str() с типами
dplyr::glimpse(df)
```

---

# 17. Системы классов: S3, S4, R5, R6

## 17.1 S3 — неформальные классы (большинство base R объектов)

S3 — самая простая система. Класс — просто атрибут `class`. Диспетчеризация: когда вызываешь `print(x)`, R ищет `print.ClassName`, затем `print.default`.

```r
# Создать S3-объект — просто добавить атрибут class
obj <- list(gene = "TP53", pval = 0.001, fc = 2.5)
class(obj) <- - "DEResult"

# Определить методы
print.DEResult <- function(x, ...) {
  cat("Gene:", x$gene, "| FC:", x$fc, "| p =", x$pval, "\n")
}
summary.DEResult <- function(object, ...) {
  cat("Significant:", object$pval <-  0.05, "\n")
}

print(obj)    # вызовет print.DEResult

# Интроспекция S3
class(obj)                    # "DEResult"
is(obj, "DEResult")           # TRUE
inherits(obj, "DEResult")     # TRUE
methods(class = "DEResult")   # какие методы зарегистрированы
methods("print")              # все классы, для которых определён print
unclass(obj)                  # посмотреть "внутренности"
NextMethod()                  # внутри метода: вызвать метод родительского класса

# UseMethod — точка диспетчеризации
describe <- function(x, ...) UseMethod("describe")
describe.DEResult <- function(x, ...) cat("DE result for", x$gene)
describe.default  <- function(x, ...) cat("Unknown object\n")
describe(obj)
```

## 17.2 S4 — формальные классы (Bioconductor)

S4 требует явного объявления классов и методов. Ключевые объекты Bioconductor (`SummarizedExperiment`, `GRanges`, `DESeqDataSet`) используют именно S4.

```r
# Объявить класс
setClass("GeneResult", representation(
  gene  = "character",
  pval  = "numeric",
  fc    = "numeric"
))

# Создать объект
obj <- new("GeneResult", gene = "TP53", pval = 0.001, fc = 2.5)

# Доступ через @ (не $)
obj@gene
obj@pval
slot(obj, "gene")      # то же, но программно (если имя слота в переменной)
slotNames(obj)         # все слоты

# Определить generic и метод
setGeneric("describe", function(x, ...) standardGeneric("describe"))
setMethod("describe", "GeneResult", function(x, ...) {
  cat("Gene:", x@gene, "\n")
})
describe(obj)

# Интроспекция S4
isVirtualClass("GeneResult")
is(obj, "GeneResult")
existsMethod("describe", "GeneResult")
showMethods("describe")               # все методы generic
getMethod("describe", "GeneResult")   # конкретный метод
showClass("GeneResult")               # структура класса

# Валидация при создании
setValidity("GeneResult", function(object) {
  if (object@pval <-  0 || object@pval > 1) "pval must be in [0,1]"
  else TRUE
})
validObject(obj)

# Наследование
setClass("ExtResult", contains = "GeneResult",
         representation(padj = "numeric"))
obj2 <- new("ExtResult", gene="BRCA1", pval=0.01, fc=1.5, padj=0.05)
is(obj2, "GeneResult")   # TRUE — наследует
```

## 17.3 R5 (Reference Classes) — мутабельные объекты

```r
Counter <- setRefClass("Counter",
  fields  = list(count = "numeric"),
  methods = list(
    initialize = function(start = 0) { count <- <- start },
    increment  = function(by = 1)    { count <- <- count + by },
    show       = function()          { cat("Count:", count, "\n") }
  )
)
c1 <- Counter$new(0)
c2 <- c1          # ССЫЛКА, не копия!
c1$increment(5)
c2$count          # 5 — c2 видит изменения c1
c1$copy()         # явная копия
```

## 17.4 R6 — современная альтернатива R5

```r
library(R6)

FilterStep <- R6Class("FilterStep",
  public = list(
    col       = NULL,
    threshold = NULL,
    initialize = function(col, threshold) {
      self$col <- col
      self$threshold <- threshold
    },
    run = function(df) {
      df[df[[self$col]] > self$threshold, ]
    },
    clone_step = function() self$clone()
  ),
  private = list(
    .log = character(0),
    add_log = function(msg) private$.log <- c(private$.log, msg)
  ),
  active = list(
    log = function() private$.log   # read-only field через active binding
  )
)

step <- FilterStep$new("expr_ctrl", 5)
step$run(df)

# Наследование
LoggedStep <- R6Class("LoggedStep",
  inherit = FilterStep,
  public = list(
    run = function(df) {
      private$add_log(paste("Filtering", self$col, ">", self$threshold))
      super$run(df)   # вызов метода родителя
    }
  )
)
```

## 17.5 Сводная таблица: когда что использовать

||S3|S4|R5/R6|
|---|---|---|---|
|Сложность|минимальная|высокая|средняя|
|Валидация|нет (вручную)|`setValidity`|в `initialize`|
|Семантика|копирование|копирование|__по ссылке__|
|Где встречается|base R, большинство пакетов|Bioconductor|stateful-объекты, пайплайны|
|Доступ к полям|`$`|`@` / `slot()`|`$`|
|Наследование|неформальное|`contains=`|`inherit=`|

---

# 18. Даты и время (кратко)

В биоинформатике нужны в основном для метаданных образцов и логов.

```r
Sys.Date(); Sys.time()
as.Date("2024-03-15")
format(Sys.Date(), "%Y-%m-%d")
difftime(as.Date("2024-04-01"), as.Date("2024-03-15"), units = "days")

# lubridate — когда нужно активно работать с датами
library(lubridate)
ymd("2024-03-15")
ymd_hms("2024-03-15 10:30:00")
d + days(7); d + months(1)
year(d); month(d); day(d)
```

---

# 19. Числовые преобразования и нормализация

```r
log2_expr <- log2(counts + 1)                           # псевдокаунт
z <- t(scale(t(log2_expr)))                             # Z-score по генам
cpm <- t(t(counts) / colSums(counts) * 1e6)            # CPM
minmax <- function(x) (x - min(x)) / (max(x) - min(x))
```

---

# 20. Статистика "в одну строку"

```r
t.test(expr ~ group, data = long_data)

pvals <- apply(counts, 1, function(row) {
  t.test(row[group == "ctrl"], row[group == "treat"])$p.value
})
p.adjust(pvals, method = "BH")

cor(df$expr_ctrl, df$expr_treat, method = "spearman")
cor.test(df$expr_ctrl, df$expr_treat)

pca <- prcomp(t(log2_expr), scale. = TRUE)
pca$x[, 1:2]    # координаты образцов

d  <- dist(t(log2_expr))
hc <- hclust(d, method = "average")
cutree(hc, k = 3)
```

---

# 21. Ggplot2 — минимум для визуализации

```r
library(ggplot2)

ggplot(long_data, aes(x = sample, y = expression, fill = group)) +
  geom_boxplot() + theme_minimal()

# Volcano plot
ggplot(df, aes(x = log2fc, y = -log10(pval), color = significant)) +
  geom_point(alpha = 0.6) +
  geom_vline(xintercept = c(-1, 1), linetype = "dashed") +
  geom_hline(yintercept = -log10(0.05), linetype = "dashed") +
  labs(x = "log2 Fold Change", y = "-log10(p-value)")

# Heatmap
heat_data <- tidyr::pivot_longer(as.data.frame(log2_expr),
                                  everything(), names_to="sample", values_to="expr")
ggplot(heat_data, aes(sample, gene, fill = expr)) +
  geom_tile() +
  scale_fill_gradient2(low="blue", mid="white", high="red")

ggsave("plot.png", width = 8, height = 6, dpi = 300)
```

---

# 22. Контроль типов, проверки, отладка

```r
stopifnot(nrow(df) > 0, all(!is.na(df$gene)))

identical(a, b)
all.equal(a, b)   # с допуском на float
setdiff(genes1, genes2); intersect(genes1, genes2); union(genes1, genes2)

format(object.size(df), units = "MB")
gc()

tryCatch({
  risky_step()
}, error = function(e) message("Ошибка: ", e$message))

# Векторизация вместо циклов
out <- v * 2   # не for-цикл!
```

---

# 23. Полезные мелочи

```r
seq_len(10); seq_along(v)
rev(v); which.max(v); which.min(v)
cumsum(v); diff(v)
table(is.na(df))

recode_map <- c(ctrl = "Control", treat = "Treatment")
recode_map[as.character(group)]

round(0.5)   # "банковское округление" — к чётному!
format(123456.789, big.mark = ",", nsmall = 2)

options(stringsAsFactors = FALSE)
```

---

# 24. Типичный шаблон пайплайна анализа

```r
library(dplyr); library(tidyr); library(ggplot2)

# 1. Чтение
counts <- read.table("counts.tsv", header=TRUE, row.names=1, sep="\t")
meta   <- read.csv("metadata.csv")

# 2. Проверка и приведение типов
stopifnot(all(colnames(counts) == meta$sample_id))
meta$group <- factor(meta$group, levels = c("ctrl","treat"))

# 3. Фильтрация низкоэкспрессированных генов
counts_f <- counts[rowSums(counts > 5) >= 3, ]

# 4. Нормализация
log_counts <- log2(counts_f + 1)

# 5. Статистика по каждому гену
pvals  <- apply(log_counts, 1, function(x) t.test(x ~ meta$group)$p.value)
log2fc <- apply(log_counts, 1, function(x)
  mean(x[meta$group == "treat"]) - mean(x[meta$group == "ctrl"]))

# 6. Сборка результатов
results <- tibble::rownames_to_column(
  data.frame(log2fc = log2fc, pval = pvals),
  var = "gene"
) |>
  mutate(padj = p.adjust(pval, method = "BH"),
         significant = padj <-  0.05 & abs(log2fc) > 1) |>
  arrange(padj)

# 7. Сохранение
write.csv(results, "DE_results.csv", row.names = FALSE)
ggplot(results, aes(log2fc, -log10(pval), color = significant)) + geom_point()
```

---

# Шорткаты для "разглядывания" объектов

```r
class(x)          # логический тип (S3/S4 диспетчеризация)
typeof(x)         # физический тип хранения
str(x)            # структура (работает для всего)
attributes(x)     # все метаданные
names(x)          # имена элементов
dim(x)            # размерности (NULL для векторов)
slotNames(x)      # для S4-объектов
is(x)             # иерархия классов (S4)
methods(class = "ClassName")   # S3-методы класса
showMethods("generic")         # S4-методы generic
getAnywhere("function_name")   # найти функцию, не зная пакет
View(x)           # табличный просмотр в RStudio
```
