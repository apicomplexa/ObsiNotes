---
dg-publish: true
type: 📄note
aliases: 
tags: []
summary: Агрегатор отчетов QC ([[FastQC]], [[RSeQC]] и др)
💻Bioinfo:
  - tool
⚙️Methods:
  - QC
🧬Sequencing: 
---

# MultiQC

> [!def] Описание
> (def:: Агрегатор отчетов QC ([[FastQC]], [[RSeQC]] и др))

wiki_link:: `pip install multiqc`

## Алгоритм

###### Установка
```BASH
pip install multiqc
```

###### Запуск
- аргумент – путь к папке с отчетами `fastQC`
```bash
multiqc qc
```