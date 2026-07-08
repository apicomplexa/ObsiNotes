---
aliases:
  - Kalisto
creation date: 12-06-2023
date: 02-11-2025
dg-publish: true
parent:
  - "[[Псевдовыравнивания|Псевдовыравнивания]]"
summary: Инструмент для быстрого псевдовыравнивания RNAseq данных на референсный транскриптом через граф де Брёйна
tags: []
type: 📄note
💻Bioinfo:
  - tool
📊Transcriptomics:
  - aligniment
🧬Sequencing:
  - aligniment
---

> [!def] Описание
> (def:: Программа для псевдовыравнивания данных RNAseq на референсный транскриптом)

wiki_link:: [Manual](http://pachterlab.github.io/kallisto/manual.html)

# Принцип работы

## Структура хранения референса

- Референсный транскриптом хранится в виде ==__окрашенного направленного графа де Брёйна__==
- Где каждый узел – k-мер и общей последовательности, окрашенный в соответствие с принадлежностью к каждому из вариантов транскрипта
- (Разбитие на k-меры с перекрытием, но k-меры не повторяются)
- k-меры хэшируются, что ускоряет поиск ([Хеш-функция — Википедия](https://ru.wikipedia.org/wiki/%D0%A5%D0%B5%D1%88-%D1%84%D1%83%D0%BD%D0%BA%D1%86%D0%B8%D1%8F?useskin=vector#:~:text=%5B9%5D.-,%D0%A3%D1%81%D0%BA%D0%BE%D1%80%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%BF%D0%BE%D0%B8%D1%81%D0%BA%D0%B0%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85,-%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%B0%D1%8F%20%D1%81%D1%82%D0%B0%D1%82%D1%8C%D1%8F%3A))

> [!img]+
> ![[Pasted image 20230612211214.png]]

## Поиск

> [!img]+
> ![[Pasted image 20230612212754.png]]

1. Рид разбивается на такие же k-меры
2. Происходит поиск по хэшированному транскриптому (поэтому быстро)
3. Поиск пути по референсному графу, так чтобы все k-меры совпали
4. Записывается итоговый цвет транскрипта (пересечение цветов k-меров из найденного пути) – ==класс эквивалентности== (на изображении красно-синий/фиолетовый)
5. При помощи алгоритмов (н.п. [[RSEM]]) оценивается распределение экспрессий

### Мисматчи

- Каллисто отлавливает мисматчи внутри k-меров
- И также самостоятельно отрезает хвосты (с адаптерами и прочим)

## Результат

- Не выравнивание ⇒
- Нет BAM-файла
- Нет возможности посчитать экспрессию через HTSeq — Потому что оно считается на уровне поиска распределения экспрессий
- Нет поиска новых вариантов сплайсинга и полиморфизмов
- Можно попросить псевдо-BAM (но будет не честное выравнивание и некоторое додумывание) (это можно закинуть в [[RSeQC]])
- ==ОЧЕНЬ== быстро и ==ОЧЕНЬ== лояльно к железу (можно за ~¹/₂ ч. на ноуте посчитать большой RNAseq эксперимент)
	![[Pasted image 20230612215331.png]]

# Использование

[Manual](http://pachterlab.github.io/kallisto/manual.html)

## Загрузка

```shell
git clone https://github.com/pachterlab/kallisto.git
apt-get install autoconf
cd kallisto && mkdir build && cd build && cmake .. && make
```

## Создание индекса из fasta

```shell
./kallisto/build/src/kallisto index [args] PATH_TO_FASTA.fasta
```

### Agrs

| Required                          | arg                | type                | info                                                                  |
| :-------------------------------- | :----------------- | :------------------ | :-------------------------------------------------------------------- |
| <span class="red">required</span> | `-i, --index=`     | `PATH_TO_INDEX.idx` | имя файла куда будет собран индекс                                    |
| optional                          | `-k, --kmer-size=` | `INT (1-31, odd)`   | длина к-мера (нечетная) (по умолчанию: 31, максимальное значение: 31) |
| optional                          | `--make-uniq`      |                     | Замените повторяющиеся имена целей уникальными именами                |
|                                   |                    |                     |                                                                       |

### Готовые индексы референсных транскриптомов

[Releases · pachterlab/kallisto-transcriptome-indices](https://github.com/pachterlab/kallisto-transcriptome-indices/releases)

## Выравнивание

```shell
./kallisto/build/src/kallisto quant [arguments] FASTQ-files

Required arguments:
-i, --index=STRING            Filename for the kallisto index to be used for
                              quantification
-o, --output-dir=STRING       Directory to write output to

Optional arguments:
    --bias                    Perform sequence based bias correction
-b, --bootstrap-samples=INT   Number of bootstrap samples (default: 0)
    --seed=INT                Seed for the bootstrap sampling (default: 42)
    --plaintext               Output plaintext instead of HDF5
    --fusion                  Search for fusions for Pizzly
    --single                  Quantify single-end reads
    --single-overhang         Include reads where unobserved rest of fragment is
                              predicted to lie outside a transcript
    --fr-stranded             Strand specific reads, first read forward
    --rf-stranded             Strand specific reads, first read reverse
-l, --fragment-length=DOUBLE  Estimated average fragment length
-s, --sd=DOUBLE               Estimated standard deviation of fragment length
                              (default: -l, -s values are estimated from paired
                               end data, but are required when using --single)
-t, --threads=INT             Number of threads to use (default: 1)
    --pseudobam               Save pseudoalignments to transcriptome to BAM file
    --genomebam               Project pseudoalignments to genome sorted BAM file
-g, --gtf                     GTF file for transcriptome information
                              (required for --genomebam)
-c, --chromosomes             Tab separated file with chromosome names and lengths
                              (optional for --genomebam, but recommended)
```
