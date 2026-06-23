---
aliases:
  - edgeR
creation date: 24-07-2023
date: 02-11-2025
dg-publish: true
parent:
  - "[[Дифференциальная Экспрессия|Дифференциальная Экспрессия]]"
  - "[[Нормализация RNAseq|Нормализация RNAseq]]"
summary: 
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - exprCount
  - difExpr
---

> [!def] Описание
> (def:: Анализ диф. экспресси генов. Втч нормирует данные на эффективную глубину библиотеки - для сравнения экспрессии _1 гена из разных библиотек_)

- Не нормирует на длину транскрипта
- Использует для оценки правдоподобия в дефолте – quasi-likelihood F-test (QLF) (похоже на LRE – likelihood ratio test)

wiki_link:: [Bioconductor - edgeR](https://bioconductor.org/packages/release/bioc/html/edgeR.html)

> [!$] Принцип работы
> Примем, что большинство генов не меняют экспрессию, поэтому на них можно опираться для скалирования экспрессии остальных

![[Pasted image 20230724201055.png]]

Т.е. Можно сравнить что кол-во каунтов (1) и (2) изменились значительно меньше, чем (3) ⇒ можно предположить что они не изменились вообще

Можно н.п. использовать гены домашнего хозяйства и т.п.

![[Pasted image 20230724200538.png]]

# How to use

[[tximport#How to use|tximport]] для скалирования агрегации данных

![[tximport#^6adcd2]]

Получим данные о каунтах и длинах генов

```R
cts <- txi$counts
length <- txi$length
```

И сделаем поправку на длину гена

```R
normMat <- normMat/exp(rowMean(log(length)))
normCts <- cts/normMat
```
