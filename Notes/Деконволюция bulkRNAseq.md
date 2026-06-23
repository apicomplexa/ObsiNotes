---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: это процесс определения того, в каких долях какие клеточные типы содержатся в пробе. Похоже на [[xCell]], но строже - хотим найти реальные доли представленности клеточных типов в ткани
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - functionalAnalisis
  - BulkSpecific
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

Глобально сводится к поискам коэффицентов регрессии для сравнения профилей экспрессии чистых клеток с нашим образцом

похоже: [GitHub - BostonGene/MFP: Mollecular Functional Portraits](https://github.com/BostonGene/MFP)

Есть множество методов:

- На основе сигнатур маркерных генов как в [[xCell]]
- Но основе референсного scRNAseq
- Многое другое

![[{818D8807-172E-4C62-88F4-DA42AF8B58C4}.png]]
