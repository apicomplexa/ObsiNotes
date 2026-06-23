---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Пайплайн реализующий  Быстрое и точное выведение последовательностей из данных ампликонов с разрешением на уровне одного нуклеотида
tags:
  - task
type: 📄note
wiki_link: https://benjjneb.github.io/dada2/index.html
💻Bioinfo:
  - tool
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
  - preprocessing
🧬Sequencing:
  - trimming
---

# Начало работы

```R
library(dada2)

## first we're setting a few variables we're going to use ##
  # one with all sample names, by scanning our "samples" file we made earlier
samples <- scan("samples", what="character")

  # one holding the file names of all the forward reads
forward_reads <- paste0(samples, "R1_trimmed.fq.gz")
  # and one with the reverse
reverse_reads <- paste0(samples, "R2_trimmed.fq.gz")

  # and variables holding file names for the forward and reverse
  # filtered reads we're going to generate below
filtered_forward_reads <- paste0(samples, "R1_filtered.fq.gz")
filtered_reverse_reads <- paste0(samples, "R2_filtered.fq.gz")
```

# Подготовка

## Контроль качества, тримминг, фильтрация

Построить графики качества в каждом файле

```R
plotQualityProfile(forward_reads)
plotQualityProfile(reverse_reads)
```

![[Pasted image 20260417115325.png|309]]

> На этих графиках нуклеотиды расположены по оси x, а показатель качества — по оси y. Черная тепловая карта внизу отражает частоту встречаемости каждого значения показателя качества в каждой позиции нуклеотида; зеленая линия обозначает среднее значение показателя качества в данной позиции, оранжевая — медиану, а оранжевые пунктирные линии — квартили. Красная линия внизу показывает, какая доля чтений имеет данную длину.

- Параметры подрезания - интуитивно по качеству
- Или можно попробовать [[Figaro]]

### `filterAndTrim()`

```R 
filterAndTrim(
	forward_reads, filtered_forward_reads,
	reverse_reads, filtered_reverse_reads, 
	maxEE=c(2,2),
    rm.phix=TRUE, 
    minLen=175, 
    truncLen=c(250,200)
)
```

- `forward_reads`, `reverse_reads` - инпуты (предварительно удалить праймеры, н.п. через [[cutadapt#Универсальный пример для 16S|cutadapt]])
- `filtered_forward_reads`, `filtered_reverse_reads` - аутпуты - переменные в которые функция запишет результат фильтрации
- `maxEE=c(for, rev)` - фильтр по качеству. `c(2,2)` - откидываем риды, где больше 2 нк вероятно определены неверно (отдельно считается для прямых и обратных)
- `rm.phix` - удалить все риды которые матчатся с PhiX bacteriophage genome - используется в иллюмине для контроля качества
- `minLen` - минимальная длина рида
- `truncLen=c(for, rev)` - докуда обрезаем прямые и обратные праймеры

> По умолчанию эта функция обрезает фрагменты при первом появлении quality score=2, из-за чего мы можем получить фрагменты, короче тех, до которых мы их явно обрезаем. Для этого указано `minLen` чтобы риды точно перекрывались (см. [[Тримминг#Особенности спаренных ридов]])

- `truncQ def=2` позволяет изменить quality score после которого будет отрезаться
- `maxN def=0` откидывает риды в которых встречаются N (по умолчанию - разрешено 0)

#### Результат

![[Pasted image 20260419171504.png|553]]

# Создание модели ошибок

- Создает индивидуальную модель ошибок для датасета и сопоставить с предсказанными на основе качества
- Отдельно для for и rev ридов

```R
err_forward_reads <-learnErrors(filtered_forward_reads, multithread=TRUE)
plotErrors(err_forward_reads, nominalQ=TRUE)
```

![[Pasted image 20260419172214.png|493]]

- Красная линия - ожидание как должны вести себя данные, на основе качества
- Черная линия - оценка для данных ридов
- Точки - наблюдения

> [!$] Хорошие данные – точки стыкуются с черной линией

- Можно улучшить, увеличив кол-во оснований, которые оценивает функция (100 млн по-умолчанию)

## Дедупликация

> [!example] Отдельный шаг
> В DADA2 включено в `dada()`, но если ограничения по железу - лучше отдельный шаг

```R
derep_forward <- derepFastq(filtered_forward_reads, verbose=TRUE)
names(derep_forward) <- samples # the sample names in these objects are initially the file names of the samples, this sets them to the sample names for the rest of the workflow
derep_reverse <- derepFastq(filtered_reverse_reads, verbose=TRUE)
names(derep_reverse) <- samples
```

# Выявление ASVs

- [ ] #task Как DADA2 выявляет ASV ([по статье](https://www.nature.com/articles/nmeth.3869#methods))

- Можно применить как к каждому образцу по отдельности - менее ресурсоемко
- Так и сразу на все - __повысит разрешающую способность__

Н.п. секвенс А - имеет 10.000 копий в образце 1, а в образце 2 - всего 1 копию. При прогоне образцов раздельно - секвенс А в образце 2 будет интерпретирован как ошибочный. Но если обрабатывать все одновременно, тогда секвенс А будет иметь 10,001 копию во всех образцах.

- Совмещение - __pseudo-pooling__ (подробнее [здесь](https://benjjneb.github.io/dada2/pseudo.html#Pseudo-pooling))

Возвращаясь к секвенсу А, если уже знать, что в образце 1 его много, можно предположить что в образце 2 этот секвенс тоже есть но в низкой представленности.

```R
dada_forward <- dada(derep_forward, err=err_forward_reads, pool="pseudo", multithread=TRUE)
dada_reverse <- dada(derep_reverse, err=err_reverse_reads, pool="pseudo", multithread=TRUE)
```

## Объединение прямых и обратных ридов

Для реконструкции полного ампликона, нужно, чтобы прямые и обратные риды перекрывались (подробнее см [[Тримминг#Особенности спаренных ридов]])

По умолчанию, требование минимум 12 нк, но лучше __пересичтать основываясь на длине ридов после тримминга__

> [!$] Посчитать длину перекрытия ридов с максимальной длиной после тримминга и минимальной, выбрать среднее, ближе к верху.
> __Рекомендованная стратегия__
> 1. Оценить распределение длин после `filterAndTrim`
> ```R
> library(ShortRead)
> fq <- readFastq("sample.fastq.gz")
> reads <- sread(fq) 
> width(reads)
> summary(nchar(filtered_forward_reads))
> ```
> 2. Прикинуть overlap:
> - верхняя граница → из `truncLen`
> - нижняя → из квантилей длины
> 1. Выбрать `minOverlap`: __ближе к ожидаемому overlap__
> 
> __Но ближе к minLen , если:__
> - агрессивный trimming (много ридов близки к minLen)
> - широкая вариабельность длины ампликона (например ITS, а не 16S)
> - цель - максимальная ретенция ридов

> [!quote]- Пример
> праймеры нацелена на 515f–806r. Сами праймеры 39нк длиной. Поэтому после тримминга общая длина амплиона ожидается $806-515-39 ≈ 260 нк$
>
> Прямые риды подрезаны до 250нк, обратные до 200нк. Тогда перекрытие в среднем будет составлять 190-200нк.
>
> При этом `filterAndTrim(…minLen=175)` значит что в худшем случае (и прямой и обратный по 175) перекрытие - 90нк
>
> Выбрать среднее, но ближе к верху - т.е. `≈170`

```R
merged_amplicons <- mergePairs(dada_forward, derep_forward, dada_reverse,
                    derep_reverse, trimOverhang=TRUE, minOverlap=170)
```

## Итоги

```R
    # this object holds a lot of information that may be the first place you'd want to look if you want to start poking under the hood
class(merged_amplicons) # list
length(merged_amplicons)
names(merged_amplicons) # the names() function gives us the name of each element of the list 

class(merged_amplicons$B1) # each element of the list is a dataframe that can be accessed and manipulated like any ordinary dataframe

names(merged_amplicons$B1) # the names() function on a dataframe gives you the column names
# "sequence"  "abundance" "forward"   "reverse"   "nmatch"    "nmismatch" "nindel"    "prefer"    "accept"
```

# Генерация таблицы каунтов

```R
seqtab <- makeSequenceTable(merged_amplicons)
class(seqtab) # matrix
dim(seqtab)
```

__Таблица каунтов__ – один из главных аутпутов обработки данных

но в таком формате - неудобно смотреть, т.к. rownames - реальные секвенсы

# Идентификация химер

DADA2 выявляет вероятные химеры путем сравнения каждой последовательности с теми, которые были обнаружены в большем количестве, а затем проверяет, существуют ли последовательности с меньшей частотностью, которые можно точно получить путем смешивания левой и правой частей двух наиболее распространенных последовательностей. Затем такие последовательности удаляются

```R
seqtab.nochim <- removeBimeraDenovo(seqtab, verbose=T)

    # though we lost sequences, we don't know if they held a lot in terms of abundance, this is one quick way to look at that
sum(seqtab.nochim)/sum(seqtab) 
# 0.9931372 # in this case we barely lost any in terms of abundance
```

# Оценка потери ридов

- Сводная таблица, сколько ридов потеряно на каждом из этапов обработки
- Полезно, если риды куда то пропали

```R
    # set a little function
getN <- function(x) sum(getUniques(x))

    # making a little table
summary_tab <- data.frame(
	row.names=samples, 
	dada2_input=filtered_out[,1],
	filtered=filtered_out[,2], 
	dada_f=sapply(dada_forward, getN),
	dada_r=sapply(dada_reverse, getN), 
	merged=sapply(merged_amplicons, getN),
	nonchim=rowSums(seqtab.nochim),
	final_perc_reads_retained=round(
		rowSums(seqtab.nochim)/filtered_out[,1]*100, 1
	)
)

summary_tab
#       dada2_input filtered dada_f dada_r merged nonchim final_perc_reads_retained
# B1           1613     1498   1458   1466   1457    1457                      90.3
# B2            591      529    523    524    523     523                      88.5
# B3            503      457    450    451    450     450                      89.5
# B4            507      475    440    447    439     439                      86.6
```

_Полезно сохранить_

```R
write.table(summary_tab, "read-count-tracking.tsv", quote=FALSE, sep="\t", col.names=NA)
```

# Определение таксономии

## Встроенные методы

- [ ] #task Описать как используется наивный метода Байесовской классификации на определения таксономии в DADA2 [(статья)](https://pubmed.ncbi.nlm.nih.gov/17586664/)

Скачать из [[DADA2 pretrained taxa references]] SILVA референс. После выполняем:

```R
taxa <- assignTaxonomy(
	seqtab.nochim, 
	"~/tax/silva_nr99_v138.2_toGenus_trainset.fa.gz", 
	multithread=TRUE
)

taxa.print <-taxa # Removing sequence rownames for display only
rownames(taxa.print) <-NULL
head(taxa.print)
```

### Определение видов

> [Показано](https://academic.oup.com/bioinformatics/advance-article-abstract/doi/10.1093/bioinformatics/bty113/4913809), что только полное совпадение (100% идентичность) подходит для определения видов на основе 16S.

Точно также скачиваем [[DADA2 pretrained taxa references|референс]]. После выполняем:

```R
taxa <- addSpecies(taxa, "~/tax/silva_v138.2_assignSpecies.fa.gz")
```

## DECIPHER

Быстрее и свежее – [[DECIPHER#Построение таксономии]] __лучше использовать его__

## Если внезапные NA на всем

Вероятно риды в обратном направлении, по отношению к референсу. Нужно указать

```R
assignTaxonomy(..., tryRC=TRUE)
```

Для DECIPHER:

```R
IdTaxa (..., strand="both")
```

# Сохранение результатов

> [!$] Нужно сохранить:
> - fasta файлы
> - Таблицу каунтов
> - Таблицу таксономии ^nl3lgz

## Пример

(версия для аутпут DECIPHER, непреобразованный)

```R
# giving our seq headers more manageable names (ASV_1, ASV_2...)
asv_seqs <- colnames(seqtab.nochim)
asv_headers <- vector(dim(seqtab.nochim)[2], mode="character")

for (i in 1:dim(seqtab.nochim)[2]) {
    asv_headers[i] <- paste(">ASV", i, sep="_")
}

    # making and writing out a fasta of our final ASV seqs:
asv_fasta <- c(rbind(asv_headers, asv_seqs))
write(asv_fasta, "ASVs.fa")

    # count table:
asv_tab <- t(seqtab.nochim)
row.names(asv_tab) <-sub(">", "", asv_headers)
write.table(asv_tab, "ASVs_counts.tsv", sep="\t", quote=F, col.names=NA)

    # tax table:
    # creating table of taxonomy and setting any that are unclassified as "NA"
ranks <- c("domain", "phylum", "class", "order", "family", "genus", "species")
asv_tax <- t(sapply(tax_info, function(x) {
    m <- match(ranks, x$rank)
    taxa <- x$taxon[m]
    taxa[startsWith(taxa, "unclassified_")] <-NA
    taxa
    }))
colnames(asv_tax) <- ranks
rownames(asv_tax) <- gsub(pattern=">", replacement="", x=asv_headers)

write.table(asv_tax, "ASVs_taxonomy.tsv", sep = "\t", quote=F, col.names=NA)
```
