---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary:
tags: []
type: 📄note
🦠Metagenomics:
  - ASV
  - 16S
  - norm
---

В статье [Waste Not, Want Not: Why Rarefying Microbiome Data Is Inadmissible \| PLOS Computational Biology](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003531) указано. что лучший вариант для нормализации ASVs - variance stabilizing transformation

Реализация есть в [[DEseq2 (RLE)|DEseq2]]

Создать объект Deseq из матрицы каунтов

```R
deseq_counts <- DESeqDataSetFromMatrix(
	count_tab, 
	colData = sample_info_tab, 
	design = design) 
```

Но дизайн (design) и названия колонок (colData) – не имею здесь роли, т.к. здесь deseq только для нормализации данных

Теперь можно применить нормализацию

```R
deseq_counts_vst <- varianceStabilizingTransformation(deseq_counts)
```

> [!warning]- Если возникла ошибка
>
> ```
> "Error in estimateSizeFactorsForMatrix(counts(object), locfunc =locfunc, : every gene contains at least one zero, cannot compute log geometric means"
> ```
> Это вероятно потому что в таблице каунтов (count_tab) слишком много нулей (что нормально)
>
> Можно использовать
>
> ```R
> deseq_counts <- estimateSizeFactors(deseq_counts, type = "poscounts")
> deseq_counts_vst <- varianceStabilizingTransformation(deseq_counts)
> ```

Извлекаем матрицу трансформированных каунтов

```R
vst_trans_count_tab <- assay(deseq_counts)
```

И матрицу Евклидовых расстояний

```R
euc_dist <- dist(t(vst_trans_count_tab))
```

# Альтернатива - microbiome

![[microbiome#Нормализация ASVs]]
