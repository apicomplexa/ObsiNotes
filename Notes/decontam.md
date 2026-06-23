---
aliases: []
date: 02-11-2025
dg-publish: true
parent:
summary: Простая статистическая идентификация и удаление организмов-загрязнений в данных секвенирования маркерных генов и метагеномики
tags: []
type: 📄note
wiki_link: https://benjjneb.github.io/decontam/vignettes/decontam_intro.html
⚙️Methods:
  - QC
🦠Metagenomics:
  - ASV
  - contamination
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

Сравнивает организмы которые появились негативных контрольных пробах с теми что появились в экспериментальных

# AVS

Связка с [[DADA2]] – без данных о концентрации ДНК - опираемся на _представленность AVS_

Начнем с [[DADA2#Генерация таблицы каунтов|таблицы каунтов]]

```R
colnames(count_tab)
vector_for_decontam <- c(rep(TRUE, 4), rep(FALSE, 16)) # ПРИМЕР: логический вектор который говорит явялется ли образец пустым (т.е. контрольным).
# vector_for_decontam <- sample_data(ps)$Sample_or_Control == "Control Sample" другой вариант где логический фильтр контроль или обычный семпл

contam_df <- isContaminant(t(count_tab), neg=vector_for_decontam)

table(contam_df$contaminant) # identify contaminants

    # getting vector holding the identified contaminant IDs
contam_asvs <- row.names(contam_df[contam_df$contaminant == TRUE, ])

asv_tax[row.names(asv_tax) %in% contam_asvs, ]

#         Kingdom    Phylum           Class                 Order                   Family               Genus                                       
# ASV_104 "Bacteria" "Proteobacteria" "Gammaproteobacteria" "Betaproteobacteriales" "Burkholderiaceae"   "Burkholderia-Caballeronia-Paraburkholderia"
# ASV_219 "Bacteria" "Proteobacteria" "Gammaproteobacteria" "Enterobacteriales"     "Enterobacteriaceae" "Escherichia/Shigella"                      
# ...
```

После можно извлечь последовательности и прогнать через BLAST чтобы убедиться, что это действительно те организмы
