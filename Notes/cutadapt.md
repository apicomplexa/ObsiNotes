---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Праймеры из ридов и фильтрует по качеству
tags: []
type: 📄note
wiki_link: https://cutadapt.readthedocs.io/en/stable/
⚙️Methods:
  - samplePreparation
💻Bioinfo:
  - tool
🦠Metagenomics:
  - preprocessing
  - contamination
🧬Sequencing:
  - trimming
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

# Удаление праймеров

- Нужно получить последовательности праймеров использовавшихся при [[Подготовка библиотек ДНК|подготовке библиотеки ДНК]]

## Простейший вариант

```bash
cutadapt -a AACCGGTT -o output.fastq input.fastq.gz
```

## Типы адаптеров

| Adapter type                                                                                       | Command-line option                                       |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Regular 3’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#three-prime-adapters)    | `-a ADAPTER`                                              |
| [Regular 5’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#five-prime-adapters)     | `-g ADAPTER`                                              |
| [Non-internal 3’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#non-internal)       | `-a ADAPTERX`                                             |
| [Non-internal 5’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#non-internal)       | `-g XADAPTER`                                             |
| [Anchored 3’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#anchored-3adapters)     | `-a ADAPTER$`                                             |
| [Anchored 5’ adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#anchored-5adapters)     | `-g ^ADAPTER`                                             |
| [5’ or 3’ (both possible)](https://cutadapt.readthedocs.io/en/stable/guide.html#anywhere-adapters) | `-b ADAPTER`                                              |
| [Linked adapter](https://cutadapt.readthedocs.io/en/stable/guide.html#linked-adapters)             | `-a ^ADAPTER1…ADAPTER2`<br><br>`-g ADAPTER1…ADAPTER2` |

## Другие флаги

|                  Флаг | Описание                                                | Комментарий                    |
| --------------------: | ------------------------------------------------------- | ------------------------------ |
|                  `-m` | минимальная длина рида                                  | Обычно -10% от ожидаемой блины |
|                  `-M` | максимальная длина рида                                 | +10% от ожидаемой блины        |
| `--discard-untrimmed` | Выкинуть риды без указаных праймеров в указанных местах |                                |
|                  `-o` | Аутпут прямых ридов                                     |                                |
|                  `-p` | Аутпут обратных ридов                                   |                                |

## Сжатие

- работает с `.fastq.gz` из коробки

# Рецепты

## Pair-end reads

 [Recipes - Trimming (amplicon-) primers from paired-end reads — Cutadapt 5.2 documentation](https://cutadapt.readthedocs.io/en/stable/recipes.html#trimming-amplicon-primers-from-paired-end-reads)

Простой пример с линкерными адаптерами

```bash
cutadapt -a ^FWDPRIMER...RCREVPRIMER -A ^REVPRIMER...RCFWDPRIMER --discard-untrimmed -o out.1.fastq.gz -p out.2.fastq.gz in.1.fastq.gz in.2.fastq.gz
```

### Универсальный пример для 16S

```bash
cutadapt -a ^GTGCCAGCMGCCGCGGTAA...ATTAGAWACCCBDGTAGTCC \
         -A ^GGACTACHVGGGTWTCTAAT...TTACCGCGGCKGCTGGCAC \
         -m 215 -M 285 --discard-untrimmed \
         -o B1_sub_R1_trimmed.fq -p B1_sub_R2_trimmed.fq \
         B1_sub_R1.fq B1_sub_R2.fq
```

__Описание:__

- `-a` Отрежет прямые праймеры `5'-^GTGCCAGCMGCCGCGGTAA…ATTAGAWACCCBDGTAGTCC`
- `-A` Отрежет обратный праймер `5'-^GGACTACHVGGGTWTCTAAT…TTACCGCGGCKGCTGGCAC`
- `-m` минимальная длина рида 215
- `-M` максимальная длина рида 285
- `--discard-untrimmed` Выкинуть риды без указаных праймеров в указанных местах
- `-o` прямые риды в `B1_sub_R1_trimmed.fq`
- `-p` обратные риды в `B1_sub_R2_trimmed.fq`

## Получить сводку

```bash 
paste samples <(grep "passing" cutadapt.log | cut -f3 -d "(" | tr -d ")") <(grep "filtered" cutadapt.log | cut -f3 -d "(" | tr -d ")")

# B1    96.5%   83.0%
# B2    96.6%   83.3%
# B3    95.4%   82.4%
# B4    96.8%   83.4%
# BW1   96.4%   83.0%
# BW2   94.6%   81.6%
```
