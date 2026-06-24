---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Инструмент для [[Деконволюция bulkRNAseq]]. Заточен под Карциному и лимфому.
tags: []
type: 📄note
wiki_link:
  - https://ecotyper.stanford.edu
💻Bioinfo:
  - tool
📊Transcriptomics:
  - functionalAnalisis
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

https://ecotyper.stanford.edu

Информация разбита на файлы по каждому типу клеток. Чтобы получить сводную таблицу по макрокатегориям клеток, просто читаем каждый файл и суммируем все подтипы

```python
import os
celltypes = os.listdir("ecotyper/Carcinoma_Cell_States/")

celltype_df = pd.DataFrame()
for celltype in celltypes:
    _ = pd.read_csv(f"ecotyper/Carcinoma_Cell_States/{celltype}/{celltype}_Cell_State_Abundance.txt", sep="\t", index_col=0)
    celltype_df[celltype] = _.sum(axis=1)
```
