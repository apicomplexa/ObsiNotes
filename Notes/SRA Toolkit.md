---
aliases:
  - SRA Toolkit
date: 02-11-2025
dg-publish: true
parent:
summary: Загружает файлы прочтений NGS из [[SRA]]
tags: []
type: 📄note
wiki_link:
  - https://github.com/ncbi/sra-tools/wiki
💻Bioinfo:
  - tool
🧬Sequencing: 
---

# SRA Toolkit

> [!def] Описание
> (def:: Загружает файлы прочтений NGS из [[SRA]])

wiki_link:: [Home · ncbi/sra-tools Wiki · GitHub](https://github.com/ncbi/sra-tools/wiki)

## Алгоритм

### Загрузка

```bash
wget --output-document sratoolkit.tar.gz https://ftp-trace.ncbi.nlm.nih.gov/sra/sdk/current/sratoolkit.current-ubuntu64.tar.gz

tar -vxzf sratoolkit.tar.gz
```

### Конфигурация

- при запуске в Google Colab выдаст ошибку – это норма

```
/sratoolkit.3.0.1-ubuntu64/bin/vdb-config -i
```

### Загрузка прочтений

- Используется утилита `fasterq-dump`
- Для нее в качестве основного аргумента - `SRA acsess_number`
- сразу разбивает на `for\rev`

```bash
sratoolkit.3.0.1-ubuntu64/bin/fasterq-dump SRR3900953
```
