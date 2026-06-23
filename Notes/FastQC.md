---
dg-publish: true
type: 📄note
summary: Рассчитывает различные метрики качества для NGS
aliases: 
tags: 
💻Bioinfo:
  - tool
📊Transcriptomics: 
🧬Sequencing: 
⚙️Methods:
  - QC
---

# FastQC

> [!def] Описание
> (def:: Рассчитывает различные метрики качества для NGS)

wiki_link:: [Link](https://www.bioinformatics.babraham.ac.uk/projects/fastqc/)

## Алгоритм

###### Загрузка, распаковка, назначение исполняемым, сознание папки для результатов

``` Bash
wget https://www.bioinformatics.babraham.ac.uk/projects/fastqc/fastqc_v0.11.9.zip
unzip fastqc_v0.11.9.zip
chmod +x FastQC/fastqc
mkdir qc
```

###### Запуск fastqc

- `-o` - папка для результатов
- `-f` - формат входа (необязателен, может спарсить формат сам)
- затем все файла которые надо проверить (можно архивированный - `.fastq.gz`)
- Сохранит резы в `html`-отчет в указанной папке

```bash
FastQC/fastqc -o qc -f fastq file_1.fastq file_2.fastq
```
