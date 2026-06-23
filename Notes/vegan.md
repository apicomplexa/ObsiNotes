---
aliases:
  - vegan R package
date: 02-11-2025
dg-publish: true
parent:
summary: Многофункциональный статистический пакет. Преимущественно используется в экологической статистике, включая метагеномный анализа
tags: []
type: 📄note
wiki_link: https://vegandevs.github.io/vegan/
🦠Metagenomics:
  - alpha
  - ASV
  - taxonomicProfiling
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

> [!important] Входные данные всех функций
> - стоки – образцы
> - колонки – наблюдения

[[Визуализация ординации с Vegan|Полная документация по визуализации ординации]]

# Оценка богатства образцов ASVs – `rarecurve`

[Rarefaction Species Richness — rarefy • vegan](https://vegandevs.github.io/vegan/reference/rarefy.html)

> [!$] Рефракционные кривые
> Это график Количества ASVs от размера библиотеки
>
> Не стоит использовать для оценки общего богатая образцов, но позволяет прикинуть что и как

```R
rarecurve(t(count_tab), step=100, col=sample_info_tab$color, lwd=2, ylab="ASVs", label=F)

    # and adding a vertical line at the fewest seqs in any sample
abline(v=(min(rowSums(t(count_tab)))))
```

![[Pasted image 20260424102645.png|455]]
