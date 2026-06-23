async function color(text) {
    let color = await tp.system.suggester([
        "gray | серый ",
        "brown | коричневый",
        "orange | оранжевый",
        "yellow | желтый",
        "green | зеленый",
        "blue", "purple",
        "pink | розовый",
        "red | красный"], ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"], "цвет");
    if (text.includes(`\n`)) {
        let textLines = text.split(`\n`)
        return textLines.map((line) => `<span class="${color}">${line}</span>`).join(`\n`)
    }
    return `<span class="${color}">${text}</span>`
}

let a = dv.page(dv.current().file.path);
let outlinkedPages = a.file.outlinks.values.map((link) => `"${link.path}"`);
let b = dv.pages(`${outlinkedPages.join(' or ')} and #papers`)
console.log(b)
dv.table(['Citekey', 'Bib'], b
    .sort(p => p.title)
    .map(p => [
        p.Citekey,
        p.Bib
    ]))

async function color(text) {
    let color = await tp.system.suggester([
        "default | цвет страницы",
        "gray | серый ",
        "brown | коричневый",
        "orange | оранжевый",
        "yellow | желтый",
        "green | зеленый",
        "blue | синий",
        "purple | фиолетовый",
        "pink | розовый",
        "red | красный"], ["def", "gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"], "цвет");
    if (color === "def") {
        return `==${text}==`
    }
    if (text.includes(`\n`)) {
        let textLines = text.split(`\n`)
        return textLines.map((line) => `<span class="${color}">${line}</span>`).join(`\n`)
    }
    return `<span class="${color}">${text}</span>`
}
let a = await color(tp.file.selection())




let pages = dv.pages("#map and #biology and -#papers and -#project")
let regexp = /#biology\/[^/]+/
let groups = pages.groupBy(p => p.file.tags.filter(tag => tag.match(regexp))[0].match(regexp))
for (let groupe of groups) {
    dv.header(5, groupe.key[0].replace('#', ''))
    dv.table(['Theme', 'File', 'Tags'],
        groupe.rows
            .sort(p => p.file.tags.filter(t => t.match(/#biology\/[^/]+/))[0])
            .map(p => [
                p.file.tags.filter(t => t.match(/#biology\/[^/]+/))[0].replace(regexp, '').replace(/[^\^]\//g, ' / ').replace('/', ''),
                dv.fileLink(p.file.path, false, p.file.title),
                p.file.tags.sort().filter(tag => tag !== '#map' && tag !== '#biology' && tag !== groupe.key[0]).join(' ')])
    )
}

