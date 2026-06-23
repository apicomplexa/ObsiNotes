---
aliases: []
author: Jari Oksanen
date: 21-06-2026
dg-publish: true
parent:
  - "[[vegan]]"
r_version: 4.6.0
summary: Документ описывает типичные рабочие процессы ординации. Рассматриваются методы без ограничений (DCA и NMDS), интерпретация результатов через экологические векторы и поверхности, а также ординация с ограничениями (CCA).
tags:
  - R
  - ecology
  - ordination
  - vegan
  - statistics
title: "Vegan: введение в ординацию"
type: 📄note
wiki_link: https://vegandevs.github.io/vegan/
⚙️Methods:
  - visualization
🦠Metagenomics:
  - ASV
  - 16S
  - beta
---

> [!info] О документе
> Документ описывает типичные рабочие процессы ординации растительности. Рассматриваются методы без ограничений (DCA и NMDS), интерпретация результатов через экологические векторы и поверхности, а также ординация с ограничениями (CCA).

# Содержание

- [[#1 Ординация]]
  - [[#1.1 Анализ детрендированного соответствия (DCA)]]
  - [[#1.2 Непараметрическое многомерное шкалирование (NMDS)]]
- [[#2 Графики ординации]]
  - [[#2.1 Перегруженные графики]]
  - [[#2.2 Добавление элементов на график]]
- [[#3 Подбор экологических переменных]]
- [[#4 Ординация с ограничениями]]
  - [[#4.1 Тесты значимости]]
  - [[#4.2 Условная (частичная) ординация]]

---

# 1 Ординация

Пакет __vegan__ содержит все распространённые методы ординации:

| Метод | Функция(и) |
|---|---|
| Анализ главных компонент (PCA) | `pca`, `rda`, `prcomp` (base R) |
| Анализ соответствий (CA) | `ca`, `cca` |
| Детрендированный анализ соответствий (DCA) | `decorana` |
| Метрическое шкалирование / PCoA | `pco`, `wcmdscale`, `cmdscale` (base R) |
| Непараметрическое многомерное шкалирование (NMDS) | `monoMDS`, `metaMDS` |

> [!note] Функции `rda` и `cca` предназначены прежде всего для ординации с ограничениями — см. [[#4 Ординация с ограничениями]].

---

## 1.1 Анализ детрендированного соответствия (DCA)

```r
library(vegan)
data(dune)
ord <- decorana(dune)
```

__Просмотр результатов:__

```r
ord
# Call:
# decorana(veg = dune)
#
# Detrended correspondence analysis with 26 segments.
# Rescaling of axes with 4 iterations.
# Total inertia (scaled Chi-square): 2.1153
#
#           DCA1   DCA2    DCA3    DCA4
# Eigenvalues        0.5117 0.3036 0.12125 0.14266
# Additive Eigenvalues  0.5117 0.2985 0.12242 0.12984
# Decorana values    0.5360 0.2869 0.08136 0.04814
# Axis lengths       3.7004 3.1166 1.30054 1.47885
```

> [!tip] Извлечение координат
> Выводятся только собственные значения и параметры. Координаты ординации извлекаются командой `scores(ord)`. Функция `plot()` обращается к ним автоматически.

---

## 1.2 Непараметрическое многомерное шкалирование (NMDS)

`metaMDS` — обёртка над `monoMDS`, реализующая рекомендуемый пайплайн:

1. Вычисляет меры несходства (`vegdist`)
2. Запускает NMDS несколько раз со случайными начальными конфигурациями
3. Сравнивает результаты (`procrustes`)
4. Останавливается, найдя минимальный стресс дважды
5. Масштабирует и поворачивает решение
6. Добавляет координаты видов как взвешенные средние (`wascores`)

```r
ord <- metaMDS(dune, trace = FALSE)
ord
# Call:
# metaMDS(comm = dune, trace = FALSE)
#
# global Multidimensional Scaling using monoMDS
#
# Data:     dune
# Distance: bray
# Dimensions: 2
# Stress:   0.1183186
# Stress type 1, weak ties
# Best solution was repeated 2 times in 20 tries
# The best solution was from try 16 (random start)
# Scaling: centring, PC rotation, halfchange scaling
# Species: expanded scores based on 'dune'
```

---

# 2 Графики ординации

> [!quote] Ординация — это прежде всего способ рисовать графики, и результаты лучше всего оценивать визуально (что также означает: не стоит воспринимать их слишком серьёзно).

__Базовый график:__

```r
plot(ord)
```

По умолчанию: чёрные точки для сайтов, красные `+` для видов (или текст — в зависимости от количества объектов и метода).

__Расширенный контроль — послойное построение через pipe:__

```r
plot(ord, type = "n") |>
  points("sites", cex = 0.8, pch = 21, col = "red", bg = "yellow") |>
  text("species", cex = 0.7, col = "blue")
```

> [!tip] Аргументы `type`
> - `type = "p"` — точки
> - `type = "t"` — текст
> - `type = "n"` — пустой график (для ручного послойного добавления)

__Альтернативные методы построения:__

| Пакет | Функции | Возможности |
|---|---|---|
| `vegan3d` (CRAN) | `ordiplot3d`, `ordirgl`, `orditkplot` | Статические/динамические 3D, интерактивные 2D |
| `ggvegan` (CRAN) | — | `ggplot2`-графика для объектов vegan |

> [!note] `ordiplot`
> Альтернативная функция vegan, совместимая и с не-vegan методами (`prcomp`, `cmdscale`). Все функции `plot` в vegan возвращают невидимо объект `ordiplot`, с которым можно использовать `points`, `text`, `identify`.

---

## 2.1 Перегруженные графики

Когда на графике слишком много объектов, попробуйте следующее:

> [!tip] Способы борьбы с перегрузкой
> - __Только точки__ — используйте `points` + `identify` для подписи отдельных точек
> - __`optimize=TRUE` + `bg`__ — подписи размещаются с минимальным перекрытием, фон скрывает нижележащие элементы
> - __`xlim` / `ylim`__ — масштабирование области (задавайте оба параметра — vegan сохраняет пропорции осей)
> - __`select`__ — показывает только указанные объекты (вектор индексов или логический вектор); для ординации с ограничениями используйте `goodness()` для отбора видов
> - __`orditorp`__ — автоматически использует текст, если места достаточно, иначе точки
> - __`orditkplot`__ (пакет `vegan3d`) — интерактивное перетаскивание подписей; экспорт в графические форматы или возврат позиций в R

---

## 2.2 Добавление элементов на график

```r
data(dune.env)
attach(dune.env)

plot(ord, disp = "sites", type = "n")
ordihull(ord, Management, col = 1:4, lwd = 3)       # выпуклые оболочки
ordiellipse(ord, Management, col = 1:4,
            kind = "ehull", lwd = 3)                 # эллипсоидные оболочки
ordiellipse(ord, Management, col = 1:4,
            draw = "polygon")                        # эллипсы стандартного отклонения
ordispider(ord, Management, col = 1:4, label = TRUE) # паутина к центроидам
points(ord, disp = "sites", pch = 21,
       col = "red", bg = "yellow", cex = 1.3)
```

__Дополнительные функции:__

| Функция | Что добавляет |
|---|---|
| `ordihull` | Выпуклые оболочки |
| `ordiellipse` | Эллипсы (стд. откл., стд. ошибка, доверительная область) |
| `ordibar` | Крест вдоль главных осей эллипса |
| `ordispider` | Линии от объектов к центроиду |
| `ordicluster` | Дендрограмма иерархической кластеризации (`hclust`) |
| `ordiarrows` | Стрелки со сегментами |
| `ordisegments` | Линии |
| `ordigrid` | Регулярная сетка |

---

# 3 Подбор экологических переменных

Два подхода в vegan:

| Функция | Метод | Что возвращает |
|---|---|---|
| `envfit` | Векторы для непрерывных переменных, центроиды для факторов | Направление градиента; длина стрелки ∝ корреляции |
| `ordisurf` | Сглаженные поверхности (требует `mgcv`) | Изотропный сплайн с кросс-валидационным выбором гладкости |

```r
ord.fit <- envfit(ord ~ A1 + Management, data = dune.env, perm = 999)
ord.fit
# ***VECTORS
#
#       NMDS1   NMDS2    r2 Pr(>r)
# A1  0.96474 0.26320 0.3649  0.015 *
#
# ***FACTORS:
# Centroids:
#                NMDS1   NMDS2
# ManagementBF -0.4534 -0.0102
# ManagementHF -0.2636 -0.1282
# ManagementNM  0.2958  0.5790
# ManagementSF  0.1506 -0.4670
#
# Goodness of fit:
#            r2 Pr(>r)
# Management 0.4134  0.008 **
```

__Визуализация результатов:__

```r
plot(ord, dis = "site")
plot(ord.fit, bg = "yellow")
```

__Добавление сглаженной поверхности:__

```r
ordisurf(ord, A1, add = TRUE)
# Family: gaussian
# Link function: identity
# Formula: y ~ s(x1, x2, k = 10, bs = "tp", fx = FALSE)
# Estimated degrees of freedom: 1.59  total = 2.59
# REML score: 41.58727
```

---

# 4 Ординация с ограничениями

__Три метода в vegan:__

| Функция | Метод |
|---|---|
| `cca` | Ординация соответствий с ограничениями (CCA) |
| `rda` | Анализ избыточности (RDA) |
| `dbrda` | Дистанционный RDA |

> [!note] Все три функции принимают одинаковые команды. Ниже демонстрируется только `cca`.

__Синтаксис формулы__ (левая часть — матрица сообщества, правая — ограничивающие переменные):

```r
ord <- cca(dune ~ A1 + Management, data = dune.env)
ord
# Call: cca(formula = dune ~ A1 + Management, data = dune.env)
#
#               Inertia Proportion Rank
# Total          2.1153     1.0000
# Constrained    0.7798     0.3686    4
# Unconstrained  1.3355     0.6314   15
#
# Inertia is scaled Chi-square
#
# Eigenvalues for constrained axes:
#   CCA1   CCA2   CCA3   CCA4
# 0.3187 0.2372 0.1322 0.0917
```

__График:__

```r
plot(ord, spe.par = list(optimize = TRUE), sit.par = list(type = "p"))
```

> [!warning] Не используйте все переменные сразу
> Добавление лишних ограничений делает их слабее, и решение приближается к неограниченной ординации. В таком случае лучше применить неограниченную ординацию с подбором переменных через `envfit`.

__Ярлык "все переменные":__

```r
cca(dune ~ ., data = dune.env)
# включает: A1 + Moisture + Management + Use + Manure
```

> [!warning] Алиасирование
> Если переменные коллинеарны, появляется сообщение об алиасировании — такие переменные не имеют уникальной объяснительной силы и не отображаются в ординации.

---

## 4.1 Тесты значимости

__Тест всей модели:__

```r
anova(ord)
# Permutation test for cca under reduced model
# Permutation: free
# Number of permutations: 999
#
# Model: cca(formula = dune ~ A1 + Management, data = dune.env)
#           Df ChiSquare      F Pr(>F)
# Model      4   0.77978 2.1896  0.001 ***
# Residual  15   1.33549
```

__Последовательный тест по термам (Type I):__

```r
anova(ord, by = "term")
# Terms added sequentially (first to last)
#               Df ChiSquare      F Pr(>F)
# A1             1   0.22476 2.5245  0.009 **
# Management     3   0.55502 2.0780  0.002 **
# Residual      15   1.33549
```

__Маргинальные эффекты (Type III):__

```r
anova(ord, by = "margin")
# Marginal effects of terms
#               Df ChiSquare      F Pr(>F)
# A1             1   0.17594 1.9761  0.034 *
# Management     3   0.55502 2.0780  0.004 **
# Residual      15   1.33549
```

> [!note] `anova.cca`
> R автоматически выбирает правильный вариант `anova` для объектов ординации — полное имя функции вводить не нужно.

---

## 4.2 Условная (частичная) ординация

Исключение эффекта ковариаты перед анализом ограничений:

```r
ord <- cca(dune ~ A1 + Management + Condition(Moisture), data = dune.env)
ord
# Call: cca(formula = dune ~ A1 + Management + Condition(Moisture), ...)
#
#               Inertia Proportion Rank
# Total          2.1153     1.0000
# Conditional    0.6283     0.2970    3
# Constrained    0.5109     0.2415    4
# Unconstrained  0.9761     0.4615   12
```

__Тест с частичной ординацией:__

```r
anova(ord, by = "term")
#               Df ChiSquare      F Pr(>F)
# A1             1   0.11543 1.4190  0.107
# Management     3   0.39543 1.6205  0.007 **
# Residual      12   0.97610
```

__Ограниченные перестановки__ (перестановки только внутри уровней `Moisture`):

```r
how <- how(nperm = 999, plots = Plots(strata = dune.env$Moisture))
anova(ord, by = "term", permutations = how)
#               Df ChiSquare      F Pr(>F)
# A1             1   0.11543 1.4190  0.267
# Management     3   0.39543 1.6205  0.001 ***
# Residual      12   0.97610
```

> [!tip] Пакет `permute`
> Ограниченные перестановки основаны на мощном пакете `permute`. Функция `how()` позволяет задавать схемы перестановок (блоки, разделённые делянки и т.д.).

---

# Быстрая шпаргалка

```r
# --- Загрузка ---
library(vegan)
data(dune); data(dune.env)

# --- Неограниченная ординация ---
ord_dca  <- decorana(dune)                        # DCA
ord_nmds <- metaMDS(dune, trace = FALSE)          # NMDS

# --- Базовый график ---
plot(ord_nmds)

# --- Послойный график ---
plot(ord_nmds, type = "n") |>
  points("sites", pch = 21, col = "red", bg = "yellow") |>
  text("species", col = "blue")

# --- Подбор переменных ---
fit <- envfit(ord_nmds ~ A1 + Management, data = dune.env, perm = 999)
plot(fit)
ordisurf(ord_nmds, dune.env$A1, add = TRUE)

# --- Ординация с ограничениями ---
ord_cca <- cca(dune ~ A1 + Management, data = dune.env)
plot(ord_cca, spe.par = list(optimize = TRUE), sit.par = list(type = "p"))

# --- Тесты значимости ---
anova(ord_cca)                  # вся модель
anova(ord_cca, by = "term")    # последовательно
anova(ord_cca, by = "margin")  # маргинальные

# --- Частичная ординация ---
ord_part <- cca(dune ~ A1 + Management + Condition(Moisture), data = dune.env)
```
