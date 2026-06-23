---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Построение графика иерархии образцов на основе евклидовых расстояний AVS в образцах. Через встроенную функцию R `hclust`
tags: []
type: 📄note
⚙️Methods:
  - visualization
🦠Metagenomics:
  - ASV
  - taxonomicProfiling
  - beta
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

```R
euc_clust <- hclust(euc_dist, method="ward.D2")

    # hclust objects like this can be plotted with the generic plot() function
plot(euc_clust) 
    # but i like to change them to dendrograms for two reasons:
        # 1) it's easier to color the dendrogram plot by groups
        # 2) if wanted you can rotate clusters with the rotate() 
        #    function of the dendextend package

euc_dend <- as.dendrogram(euc_clust, hang=0.1)
dend_cols <- as.character(sample_info_tab$color[order.dendrogram(euc_dend)])
plot(euc_dend, ylab="VST Euc. dist.")
```

![[Pasted image 20260421150144.png|532]]

> [!warning] Это исследовательская визуализация, не имеющая статистической значимости. но позволяет прикинуть, куда копать дальше
