<%* 
const replace_ = (title_with__) => {
	if (title_with__.match(/^_/)) {
		title_without__ = title_with__.replace(/^_/, '')
		return `${title_with__}|${title_without__}`
	}
	return title_with__
}
_%>
---
aliases: 
- <%tp.file.title.replace(/^_/, '')%>
date: <% tp.file.creation_date("YYYY-MM-DD") %>
dg-publish: true
nsmu: false
type: 📄note
tags:
parent: <%tp.file.cursor()%>
summary:
---