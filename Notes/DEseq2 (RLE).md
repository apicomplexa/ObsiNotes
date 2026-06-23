---
aliases:
  - DEseq2
  - DEseq
  - RLE
creation date: 08-08-2023
date: 24-07-2023
dg-publish: true
nsmu: false
parent:
  - "[[Дифференциальная Экспрессия|Дифференциальная Экспрессия]]"
  - "[[Нормализация RNAseq|Нормализация RNAseq]]"
summary: The text is an in-depth description of the DESeq2 package, an algorithm for differential gene expression analysis based on the negative binomial distribution. It explains the scaling factor, calculation of normalized proportions, and estimation of the parameters of the negative binomial distribution (mean and dispersion). The method uses a pseudo-reference rather than raw gene counts, allowing the comparison of multiple gene expression levels across samples, and incorporates the normalization coefficients directly into the model. It highlights the use of a generalized linear model to map the data onto a linear regression, effectively handling overdispersion and providing a better estimate of the fold change. The text also discusses the use of Wald-tests for assessing the significance of each gene and the overall usage of the DESeq2 package for differential gene expression analyses.
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - exprCount
  - difExpr
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

> [!$] Описание
> (def:: Дифференциальный анализ экспрессии генов на основе отрицательного биномиального распределения. Для сравнения _1 гена из разных библиотек_)

- Не нормирует на длину транскрипта
- ⇒ нет возможности сравнивать разные гены в 1 образце, а только 1 ген между разными сэплами
- Для оценки правдоподобия использует в дефолте Wald-test

wiki_link:: [Bioconductor - DESeq2](https://bioconductor.org/packages/release/bioc/html/DESeq2.html)

# Скалирующий фактор

Пусть есть несколько образцов с каунтами генов

|Gene|Counts in Sample A|Sample B|…|Sample N|
|:--|:--|:--|:--|:--|
|EF2A|1489|906 |… |n(EF2A)|
|ABCD1 |22|13|… |n(ABCD1)|

Теперь посчитаем среднее геометрическое для каждого гена для псевдо-референсного значения каунтов

| Gene  | Counts in Sample A | … | Sample N | Pseudo-ref                       |
|:----- |:------------------ |:--- |:-------- |:-------------------------------- |
| EF2A  | 1489               | … |986| $\sqrt[N] {\prod _N counts_n}$   |
| ABCD1 | 22                 | … |26| $\sqrt[N] {22 * … * n(ABCD1)}$ |

Теперь для каждого образца посчитаем отличие от среднеквадратичного

| Gene  | Counts in Sample A | … | Sample N | Pseudo-ref                             | Ratio of Sample A/ref |
|:----- |:------------------ |:--- |:-------- |:-------------------------------------- |:--------------------- |
| EF2A  | 1489               | … | n(EF2A)  | $\sqrt[N] {\prod _{n = A}^N counts_n}$ | $1489 / ref$          |
| ABCD1 | 22                 | … | 26       | 16.9                                   | $22 / 16.9 = 1.3$     |

Теперь находим медиану этих отличий – нормировочный коэффициент

И домножаем на него каунты всех образцов

При расчете диф. экспрессии используют не отнормированные образцы, в просто включают нормировочные коэффициенты в модель

# Вычисление параметров NBD's

Пусть есть 2 выборки

```chart
type: line
labels: ['-','-','-',group 1,'-','-','-','-','-','-','-','-','-','-','-',group 2, '-','-','-','-','-',]
series:
  - title: group 1
    data: [null, null, 3, 1, 9,0,  ]
  - title: group 2
    data: [null,null,null,null,null,null,null,null,'-','-','-','-','-', 12,20, 16, 11]
tension: 0.2
width: 80%
labelColors: false
fill: false
beginAtZero: false
bestFit: false
bestFitTitle: undefined
bestFitNumber: 0
```

Каждая описывается NBD. Тогда методом MLE оценим параметры (среднее и дисперсия)

## Подрезание дисперсий

Из-за маленьких выборок дисперсия данных будет нестабильной. Что делать?

В модели есть определенная связь между средним и дисперсией.

Поэтому можно по всей совокупности генов построить "линию тренда" дисперсии от среднего по данным MLE.

- [b] Построение зависимости прямой от среднего

	![[Pasted image 20230801190136.png|400]]

	Черные точки – предсказанные MLE средние и дисперсии для каждого гена

	Красная линия – "линия тренда" дисперсии от среднего

	Синие точки – результат урезания дисперсий черных точек

Далее можно _сдвинуть_ каждую черную точку в сторону красной прямо, таки образом ==подрезав дисперсию== (т.е. приведя ее ближе к ожидаемой)

Таким образом можно получить ==MAP-оценку дисперсии== – апостериорную вероятность

Но некоторые точки не поддаются кривой – выбросы дисперсии – не подчиняются общему тренду и не урезаются.

- [b] То же самое, но меньше генов. Синие стрелки – урезание. Обведенные – выброс

	![[Pasted image 20230801191421.png|Pasted image 20230801191421.png]]

> [!$] Позволяет не получать ложноположительные результаты из-за завышенной оценки среднего и дисперсии

# Модель

Данные заданы [[Отрицательное биномиальное распределение|NBD]], но необходимо свести к [[Регрессионный анализ|линейной регрессии]]

Для этого используется метод ==__Обобщенной Линейной Модели__==

Смысл в том, чтобы через какую-то функцию преобразовать данные так чтобы они стали похожими на линейную модель

В DeSeq2 модель можно описать след. образом, используя NBD

$$
K_{i,j} \sim NB(\mu_{i,j}, \alpha_i)
$$

- $K_{i,j}$ – матрица каунтов генов (из данных \[псевдо\]выравнивания)
- $\mu_{i,j}$ – среднее NBD гена $i$ образца $j$
- $\alpha_i$ – дисперсия
- $\mu_{i,j} = s_{j}p_{i,j}$
- $p_{i,j}$ – вероятность успеха из NBD
- $s_j$ – скалирующий фактор между образцами (см. выше)

$$
\log_{2}{p_{i,j}} = x_{j,A}\cdot\beta_{i,A} + x_{i,B}\cdot\beta_{i,B}
$$

$\beta_{i,j}$ – (log) вероятность получить рид из гена $i$ в зависимости от условий

$x$ – матрица коэффициентов (1/0 в зависимости от условий)

$log_2 p_{i,j} - Log_2\ fold\ change$ – изменение экспрессии гена – swap на прямой регрессии ^f1d95c

> [!$] В итоге $\log_2 p_{i,j}$ будет хорошо ложиться на линейную регрессию

## Оценка правдоподобия модели

> [!$] Wald-test (попарно для каждой пары параметров)

> [!$] В высоко параметрических моделях завышает значимость (из-за множественного сравнения)

# Использование

1. Создание [[Модельная матрица линейной регрессии|создание модельной матрицы]]
2. [[Множественное сравнение]]

## P-value = NA

[[Гистограмма p-value]]

- Если все значения в строке = 0
- Если есть большой выброс
- Строка не прошла фильтрацию по средней экспрессии (одна из настроек, которая отфильтровывает очень низко экспрессированные гены)
---
