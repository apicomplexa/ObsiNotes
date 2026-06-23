---
aliases:
  - fitdistrplus
creation date: 27-07-2023
date: 02-11-2025
dg-publish: true
parent:
summary: Пакет `R` для определения распределения статистических данных
tags: []
type: 📄note
💻Bioinfo:
  - tool
  - mathModeling
📊Statistic:
  - distr
📊Transcriptomics:
  - nornalisation
---

> [!def] Описание
> (def:: Пакет `R` для определения распределения статистических данных)

wiki_link:: [fitdistrplus-doc](https://cran.r-project.org/web/packages/fitdistrplus/fitdistrplus.pdf)

# Использование

## Установка

```shell
Rscript -e 'install.packages("fitdistrplus")'
```

## Использование

```R
library(fitdistrplus)
fit_result <- fitdist(data, "<distr-name>")
```
