---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: 
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - functionalAnalisis
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

# Bulk

Можно оценить сигнатуры типов клеток, и перейти, в первом приближении, в пространство клеток и работать с этим, сравнивая состав - гетерогенность ткани

![[{9769A2E9-BA27-405C-A261-EBFF4CA4178B}.png]]

У каждого типа клеток есть своя почти неперекрываемая сигнатура экспрессии. Поэтому можно переходить от балка к клеткам

Н.п. равниваем рак / не рак. И может выйти так, что DE ген просто из-за того что в раке больше Б-клеток

Или н.п. выраженность клеток в балк-секвенированиях разных опухолей

![[{4F4C0071-76E6-4AAF-ADC6-780E3A77BB06}.png]]

подробнее см [GitHub - BostonGene/MFP: Mollecular Functional Portraits](https://github.com/BostonGene/MFP)
