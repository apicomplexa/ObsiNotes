---
aliases:
  - SLEUTH
creation date: 01-09-2023
date: 02-11-2025
dg-publish: true
parent:
summary: Программа для дифференциального анализа РНК-seq, использующая оценки неопределённости из kallisto
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - difExpr
---

# Общая информация

> [!def] Описание
> (def::Программа для дифференциального анализа данных РНК-Seq. Она использует оценки неопределенности количественного анализа, полученные с помощью kallisto, для точного дифференциального анализа изоформ или генов. Втч. для учета различного Δ изоформ 1 гена в RNA-seq)

wiki_link:: [GitHub - pachterlab/sleuth: Differential analysis of RNA-Seq](https://github.com/pachterlab/sleuth)

# Принцип работы с изоформами

- Посчитать диф. экспрессию между изоформами
- Агрегировать p-value для подсчета экспрессии гена
