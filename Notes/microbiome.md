---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Нормализация и трансформация ASV данных микробиома для статистического анализа и сравнения выборок
tags: []
type: 📄note
💻Bioinfo:
  - tool
🦠Metagenomics:
  - ASV
  - norm
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

# Нормализация ASVs

Вариант нормализации ASVs сета - для [[Phyloseq]] объекта

```R
#' Применить трансформацию к phyloseq-объекту
#'
#' @param ps           phyloseq-объект
#' @param transform    тип: "compositional", "clr", "hellinger", "NONE", …
#' @return трансформированный phyloseq-объект
transform_phyloseq <function(ps, transform = "compositional") {
  if (transform == "NONE") return(ps)
  microbiome::transform(ps, transform)
}
```

Получаются относительные значения представленности ASVs подходит для [[Бета разнообразие]]
