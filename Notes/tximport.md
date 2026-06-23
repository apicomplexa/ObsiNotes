---
type: 📄note
summary: The `tximport` package is designed to aggregate transcript-level data into gene-level summaries for RNA-seq analysis, facilitating data integration from various quantification tools like Salmon and Kallisto. It allows for the import of transcript abundance estimates while accounting for transcript lengths, making it useful for differential expression analysis.
dg-publish: true
aliases:
  - tximport
creation date: 01-09-2023
tags: []
💻Bioinfo:
  - tool
📊Transcriptomics:
  - difExpr
---

# Общая информация

> [!def] Описание
> (def:: Агрегирует данные с уровня транскриптов до уговня генов)

wiki_link:: [Importing transcript abundance with tximport](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html#Introduction)
wiki_link:: [Bioconductor - tximport](https://bioconductor.org/packages/release/bioc/html/tximport.html)

# Принцип работы с изоформами

Добавляет в модель 
![[DEseq2 (RLE)#^f1d95c]]

Доп. коф для учета длины транскрипта

# How to use

[Importing transcript abundance with tximport](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html#Introduction)

```R
txdb <- EnsDb.___.___ # Ярлык для БД аннотация генов исследуемых организмов
tx2gene <- transcripts(txdb, return.type="DataFrame")
tx2gene <- tx2gene[c("tx_id", "gene_id")]

files <- # как нибудь создаем массив имен файлов
```

Общий шаг для любого псевдокартировщика

```R
txi <- tximport(
	files,
	type="salmon / kallisto / RSEM / ...", # Откуда импортируем
	tx2gene=tx2gene, # Указываем ранее созданный 
	                 # массив преревода транскриптов в гены
	 ignoreTxVErsion=T
)
```
^6adcd2

Можно седлать импорт TPM для ручных подсчетов

```R
tpm_ <- tximport(
    files,
    type="...",
    tx2gene=tx2gene,
    ignoreTxVersion=T,
    countsFromAbundance = "lengthScaledTPM"
)$counts
```

