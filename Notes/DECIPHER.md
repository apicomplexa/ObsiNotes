---
aliases:
  - idTaxa
date: 02-11-2025
dg-publish: true
parent:
  - "[[DADA2]]"
summary: Комплексная штука для работы с последовательностями. Мне нужно `idTaxa`- делает таксономию для ASV-16S
tags: []
type: 📄note
wiki_link: https://decipher.codes/Documentation.html
💻Bioinfo:
  - tool
🦠Metagenomics:
  - ASV
  - 16S
  - taxonomicProfiling
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

# Построение таксономии

Подробнее см [[deciper_taxa.pdf]]

Состоит из 2 частей:

1. __Тренировка модели__ на датасете таксономии (при помощи `LearnTaxa`) - на выходе тренировочный сет-объект. Может быть претренирован заранее на популярных сетах. - [DECIPHER - Downloads](https://decipher.codes/Downloads.html)
2. __Классификация новых последовательностей__ - на основе тренировочного сета - классифицируются новые последовательности.

```R
# load the DECIPHER library in R
library(DECIPHER)

# specify the path to the FASTA file (in quotes)
fas <- "<<REPLACE WITH PATH TO FASTA FILE>>"

# load the sequences from the file
seqs <- readDNAStringSet(fas) # or readRNAStringSet

# remove any gaps (if needed)
seqs <- RemoveGaps(seqs)

# for help, see the IdTaxa help page (optional)
?IdTaxa

# load a training set object (trainingSet)
# see http://DECIPHER.codes/Downloads.html
load("<<REPLACE WITH PATH TO RData file>>")

# classify the sequences
ids <- IdTaxa(
	seqs,
	trainingSet,
	strand="both", # or "top" if same as trainingSet
	threshold=60, # 60 (cautious) or 50 (sensible)   
	processors=NULL) # use all available processors

# look at the results
print(ids)
plot(ids)
```

__ИЛИ__ – _совместимо с пайпами под встроенный DADA2 классификатор_

```R
dna <- DNAStringSet(getSequences(seqtab.nochim)) # Create a DNAStringSet from the ASVs
load("~/tax/IDTaxa/SILVA_SSU_r138_2_2024.RData") # CHANGE TO THE PATH OF YOUR TRAINING SET
ids <- IdTaxa(dna, trainingSet, strand="top", processors=NULL, verbose=FALSE) # use all processors
ranks <- c("domain", "phylum", "class", "order", "family", "genus", "species") # ranks of interest
# Convert the output object of class "Taxa" to a matrix analogous to the output from assignTaxonomy
taxid <- t(sapply(ids, function(x) {
        m <- match(ranks, x$rank)
        taxa <- x$taxon[m]
        taxa[startsWith(taxa, "unclassified_")] <- NA
        taxa
}))
colnames(taxid) <- ranks
rownames(taxid) <- getSequences(seqtab.nochim)
```
