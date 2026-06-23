---
aliases:
  - Анализ bulkRNAseq
creation date: 06-01-2023
cssclasses:
  - wide-page
date: 02-11-2025
dg-publish: true
parent:
summary:
tags:
  - 📌pin
type: 🔗sintesis
📊Transcriptomics:
  - BulkSpecific
  - index
---

- [[Сборка транскриптомов de novo]]

# Roadmap

```dataviewjs
dv.paragraph(`
\`\`\`mermaid 

flowchart TB
rk[Хранение РНК]
lc["Создание библиотеки RNAseq"]
il[Illumina seq]
qc["QC RNAseq raw output"]

subgraph da ["Анализ данных"]
al[Выравнивания RNAseq]
norm["Нормализация RNAseq"]
exp["Подсчет Экспрессий"]
dif_exp["Дифференциальная экспрессия"]
ps_al["Псевдовыравнивания"]
end

rk --> 
lc --> 
il -->
qc -->
al -->
exp -->
norm --> dif_exp;

qc --> ps_al;
ps_al --> norm;

class rk,lc,il,qc,al,norm,exp,dif_exp,ps_al internal-link;
\`\`\`

`)
```
