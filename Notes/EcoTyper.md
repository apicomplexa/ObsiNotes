---
dg-publish: true
type: 📄note
aliases: 
tags: 
summary: Инструмент для [[Деконволюция bulkRNAseq]]. Заточен под Карциному и лимфому.
📊Transcriptomics:
  - functionalAnalisis
💻Bioinfo:
  - tool
wiki_link:
  - https://ecotyper.stanford.edu
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