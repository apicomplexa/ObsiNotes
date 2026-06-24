---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Агрегатор отчетов QC ([[FastQC]], [[RSeQC]] и др)
tags: []
type: 📄note
⚙️Methods:
  - QC
💻Bioinfo:
  - tool
🧬Sequencing: 
---

# MultiQC

> [!def] Описание
> (def:: Агрегатор отчетов QC ([[Notes/FastQC]], [[RSeQC]] и др))

wiki_link:: `pip install multiqc`

## Алгоритм

### Установка

```BASH
pip install multiqc
```

### Запуск

- аргумент – путь к папке с отчетами `fastQC`

```bash
multiqc qc
```
