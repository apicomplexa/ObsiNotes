#!/usr/bin/env python3
"""Собирает reference-шаблоны DOCX для стилей экспорта (макрос QuickAdd «Export: DOC»).

    python3 "_.Settings/Pandoc/build_reference_docs.py"

Берёт штатный reference.docx текущего pandoc и переписывает в нём стили, тему,
параметры страницы и колонтитулы. Результат лежит рядом:
    reference-official.docx  — официальный: Times New Roman, A4, разделы с новой страницы
    reference-mobile.docx    — для чтения с телефона: узкая страница, Arial, без разрывов

Стиль подключается к экспорту через official.yaml / mobile.yaml (поле reference-doc).
Чтобы поменять оформление — править словари STYLES ниже и пересобрать. Только stdlib.

Единицы: размеры шрифта в половинах пункта (24 = 12 pt), отступы и поля в twips
(567 = 1 см, 20 twips = 1 pt).
"""
import io
import re
import subprocess
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
CM = 567  # twips в сантиметре


# --------------------------------------------------------------------------- XML-помощники

def rpr(font=None, sz=None, b=None, i=None, color=None, u=None, caps=False):
    x = ""
    if font:
        x += f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:eastAsia="{font}" w:cs="{font}"/>'
    if b is not None:
        x += "<w:b/><w:bCs/>" if b else '<w:b w:val="0"/><w:bCs w:val="0"/>'
    if i is not None:
        x += "<w:i/><w:iCs/>" if i else '<w:i w:val="0"/><w:iCs w:val="0"/>'
    if caps:
        x += "<w:caps/>"
    if color:
        x += f'<w:color w:val="{color}"/>'
    if sz:
        x += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/>'
    if u is not None:
        x += f'<w:u w:val="{u}"/>'
    return f"<w:rPr>{x}</w:rPr>" if x else ""


def ppr(before=None, after=None, line=None, first=None, left=None, hanging=None, jc=None,
        keep_next=False, keep_lines=False, page_break=False, outline=None, border=None,
        shade=None, widow=True):
    x = ""
    if keep_next:
        x += "<w:keepNext/>"
    if keep_lines:
        x += "<w:keepLines/>"
    if page_break:
        x += "<w:pageBreakBefore/>"
    if widow:
        x += "<w:widowControl/>"
    if border:
        x += f"<w:pBdr>{border}</w:pBdr>"
    if shade:
        x += f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>'
    sp = ""
    if before is not None:
        sp += f' w:before="{before}"'
    if after is not None:
        sp += f' w:after="{after}"'
    if line is not None:
        sp += f' w:line="{line}" w:lineRule="auto"'
    if sp:
        x += f"<w:spacing{sp}/>"
    ind = ""
    if left is not None:
        ind += f' w:left="{left}"'
    if first is not None:
        ind += f' w:firstLine="{first}"'
    if hanging is not None:
        ind += f' w:hanging="{hanging}"'
    if ind:
        x += f"<w:ind{ind}/>"
    if jc:
        x += f'<w:jc w:val="{jc}"/>'
    if outline is not None:
        x += f'<w:outlineLvl w:val="{outline}"/>'
    return f"<w:pPr>{x}</w:pPr>" if x else ""


def pstyle(sid, name, based="Normal", nxt=None, p="", r="", custom=False, default=False):
    attrs = f'w:type="paragraph" w:styleId="{sid}"'
    if default:
        attrs += ' w:default="1"'
    if custom:
        attrs += ' w:customStyle="1"'
    x = f'<w:style {attrs}><w:name w:val="{name}"/>'
    if based:
        x += f'<w:basedOn w:val="{based}"/>'
    if nxt:
        x += f'<w:next w:val="{nxt}"/>'
    if sid.startswith("TOC"):
        x += '<w:uiPriority w:val="39"/><w:unhideWhenUsed/>'
    x += f"<w:qFormat/>{p}{r}</w:style>"
    return x


def cstyle(sid, name, r=""):
    return (f'<w:style w:type="character" w:styleId="{sid}"><w:name w:val="{name}"/>'
            f'<w:basedOn w:val="DefaultParagraphFont"/>{r}</w:style>')


def borders(color, sz=4, tag="tblBorders", sides=("top", "left", "bottom", "right", "insideH", "insideV")):
    inner = "".join(f'<w:{s} w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>' for s in sides)
    return f"<w:{tag}>{inner}</w:{tag}>"


def tstyle(border_color, cell_v, cell_h, sz, head_fill, head_color=None, line=None):
    head_r = rpr(b=True, color=head_color)
    cell_p = ppr(before=0, after=0, line=line, first=0, jc="left") if line else ""
    return (
        '<w:style w:type="table" w:default="1" w:styleId="Table"><w:name w:val="Table"/>'
        '<w:basedOn w:val="TableNormal"/><w:qFormat/>'
        f"{cell_p}{rpr(sz=sz)}"
        '<w:tblPr><w:tblInd w:w="0" w:type="dxa"/>'
        f"{borders(border_color)}"
        f'<w:tblCellMar><w:top w:w="{cell_v}" w:type="dxa"/><w:left w:w="{cell_h}" w:type="dxa"/>'
        f'<w:bottom w:w="{cell_v}" w:type="dxa"/><w:right w:w="{cell_h}" w:type="dxa"/></w:tblCellMar>'
        "</w:tblPr>"
        '<w:tblStylePr w:type="firstRow">'
        '<w:pPr><w:keepNext/><w:jc w:val="center"/></w:pPr>'
        f"{head_r}"
        '<w:tblPr/><w:trPr><w:tblHeader/></w:trPr>'
        f'<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{head_fill}"/><w:vAlign w:val="center"/></w:tcPr>'
        "</w:tblStylePr></w:style>"
    )


# --------------------------------------------------------------------------- Стили

def official():
    F = "Times New Roman"
    body = dict(before=0, after=120, line=276, first=425, jc="both")
    s = {
        "Normal": pstyle("Normal", "Normal", based=None, default=True),
        "BodyText": pstyle("BodyText", "Body Text", p=ppr(**body)),
        "FirstParagraph": pstyle("FirstParagraph", "First Paragraph", based="BodyText", nxt="BodyText"),
        # Compact — пункты тесных списков и текст в ячейках таблиц
        "Compact": pstyle("Compact", "Compact", custom=True,
                          p=ppr(before=0, after=60, line=264, first=0, jc="left")),
        "Title": pstyle("Title", "Title", nxt="Subtitle",
                        p=ppr(before=3400, after=240, line=240, jc="center", keep_next=True),
                        r=rpr(b=True, sz=40, color="000000")),
        "Subtitle": pstyle("Subtitle", "Subtitle", nxt="Author",
                           p=ppr(before=0, after=900, jc="center", keep_next=True), r=rpr(sz=28)),
        "Author": pstyle("Author", "Author", custom=True,
                         p=ppr(before=0, after=120, jc="center", keep_next=True), r=rpr(i=True, sz=26)),
        "Date": pstyle("Date", "Date", custom=True, p=ppr(before=2400, after=0, jc="center"), r=rpr(sz=24)),
        "Heading1": pstyle("Heading1", "heading 1", nxt="BodyText",
                           p=ppr(before=0, after=240, line=240, jc="left", keep_next=True, keep_lines=True,
                                 page_break=True, outline=0),
                           r=rpr(b=True, sz=30, color="000000")),
        "Heading2": pstyle("Heading2", "heading 2", nxt="BodyText",
                           p=ppr(before=260, after=140, line=240, keep_next=True, keep_lines=True, outline=1),
                           r=rpr(b=True, sz=26, color="000000")),
        "Heading3": pstyle("Heading3", "heading 3", nxt="BodyText",
                           p=ppr(before=200, after=80, line=240, keep_next=True, keep_lines=True, outline=2),
                           r=rpr(b=True, i=True, sz=24, color="000000")),
    }
    for n in (4, 5, 6):
        s[f"Heading{n}"] = pstyle(f"Heading{n}", f"heading {n}", nxt="BodyText",
                                  p=ppr(before=160, after=60, keep_next=True, outline=n - 1),
                                  r=rpr(i=True, sz=24, color="000000"))
    s.update({
        "TOCHeading": pstyle("TOCHeading", "TOC Heading", based="Heading1", nxt="BodyText",
                             p=ppr(outline=9), r=rpr(b=True, color="000000")),
        "TOC1": pstyle("TOC1", "toc 1", nxt="Normal", p=ppr(before=60, after=40)),
        "TOC2": pstyle("TOC2", "toc 2", nxt="Normal", p=ppr(before=0, after=20, left=280)),
        "TOC3": pstyle("TOC3", "toc 3", nxt="Normal", p=ppr(before=0, after=0, left=560)),
        "BlockText": pstyle("BlockText", "Block Text", based="BodyText",
                            p=ppr(left=567, first=0, before=60, after=120), r=rpr(sz=22)),
        "FootnoteText": pstyle("FootnoteText", "footnote text", p=ppr(after=0, line=240, jc="both"), r=rpr(sz=20)),
        "TableCaption": pstyle("TableCaption", "Table Caption", custom=True,
                               p=ppr(before=200, after=80, line=240, first=0, jc="left", keep_next=True),
                               r=rpr(sz=22)),
        "ImageCaption": pstyle("ImageCaption", "Image Caption", custom=True,
                               p=ppr(before=80, after=240, line=240, first=0, jc="center"), r=rpr(i=True, sz=20)),
        "Figure": pstyle("Figure", "Figure", custom=True,
                         p=ppr(before=120, after=0, line=240, first=0, jc="center", keep_next=True)),
        "CaptionedFigure": pstyle("CaptionedFigure", "Captioned Figure", based="Figure", custom=True),
        "Bibliography": pstyle("Bibliography", "Bibliography", nxt="Bibliography",
                               p=ppr(before=0, after=80, line=264, jc="both")),
        "Table": tstyle("000000", 40, 85, 20, "E8E8E8"),
        "Hyperlink": cstyle("Hyperlink", "Hyperlink", rpr(color="000000")),
        "VerbatimChar": cstyle("VerbatimChar", "Verbatim Char", rpr(font="Courier New", sz=20)),
    })
    return dict(
        font=F, size=24, color="000000", styles=s,
        page=dict(w=11906, h=16838, top=round(1.5 * CM), bottom=round(1.5 * CM),
                  left=2 * CM, right=1 * CM, header=425, footer=425),
        footer=True, update_fields=True,
    )


def mobile():
    F = "Arial"
    ACC = "1F4E5F"  # акцентный цвет: заголовки, подписи
    s = {
        "Normal": pstyle("Normal", "Normal", based=None, default=True),
        "BodyText": pstyle("BodyText", "Body Text", p=ppr(before=0, after=140, line=276, first=0, jc="left")),
        "FirstParagraph": pstyle("FirstParagraph", "First Paragraph", based="BodyText", nxt="BodyText"),
        "Compact": pstyle("Compact", "Compact", custom=True,
                          p=ppr(before=0, after=60, line=252, first=0, jc="left")),
        "Title": pstyle("Title", "Title", nxt="Subtitle",
                        p=ppr(before=0, after=120, line=240, jc="left"), r=rpr(b=True, sz=32, color=ACC)),
        "Subtitle": pstyle("Subtitle", "Subtitle", nxt="Author",
                           p=ppr(before=0, after=200, line=252, jc="left"), r=rpr(sz=23, color="444444")),
        "Author": pstyle("Author", "Author", custom=True,
                         p=ppr(before=0, after=20, jc="left"), r=rpr(i=True, sz=19, color="555555")),
        "Date": pstyle("Date", "Date", custom=True,
                       p=ppr(before=60, after=200, jc="left",
                             border=f'<w:bottom w:val="single" w:sz="6" w:space="8" w:color="{ACC}"/>'),
                       r=rpr(sz=19, color="555555")),
        "Heading1": pstyle("Heading1", "heading 1", nxt="BodyText",
                           p=ppr(before=440, after=160, line=240, keep_next=True, keep_lines=True, outline=0,
                                 border=f'<w:bottom w:val="single" w:sz="6" w:space="3" w:color="{ACC}"/>'),
                           r=rpr(b=True, sz=28, color=ACC)),
        "Heading2": pstyle("Heading2", "heading 2", nxt="BodyText",
                           p=ppr(before=300, after=100, line=240, keep_next=True, keep_lines=True, outline=1),
                           r=rpr(b=True, sz=24, color=ACC)),
        "Heading3": pstyle("Heading3", "heading 3", nxt="BodyText",
                           p=ppr(before=200, after=80, line=240, keep_next=True, keep_lines=True, outline=2),
                           r=rpr(b=True, sz=22, color="333333")),
    }
    for n in (4, 5, 6):
        s[f"Heading{n}"] = pstyle(f"Heading{n}", f"heading {n}", nxt="BodyText",
                                  p=ppr(before=160, after=60, keep_next=True, outline=n - 1),
                                  r=rpr(b=True, i=True, sz=22, color="333333"))
    s.update({
        "TOCHeading": pstyle("TOCHeading", "TOC Heading", based="Heading1", nxt="BodyText", p=ppr(outline=9)),
        "TOC1": pstyle("TOC1", "toc 1", nxt="Normal", p=ppr(before=60, after=20)),
        "TOC2": pstyle("TOC2", "toc 2", nxt="Normal", p=ppr(before=0, after=0, left=200)),
        "BlockText": pstyle("BlockText", "Block Text", based="BodyText",
                            p=ppr(left=170, first=0, before=60, after=120, shade="F1F5F7",
                                  border='<w:left w:val="single" w:sz="18" w:space="6" w:color="9DB9C4"/>'),
                            r=rpr(sz=21)),
        "FootnoteText": pstyle("FootnoteText", "footnote text", p=ppr(after=0, line=240), r=rpr(sz=18)),
        "TableCaption": pstyle("TableCaption", "Table Caption", custom=True,
                               p=ppr(before=200, after=80, line=240, first=0, jc="left", keep_next=True),
                               r=rpr(sz=20, color=ACC)),
        "ImageCaption": pstyle("ImageCaption", "Image Caption", custom=True,
                               p=ppr(before=60, after=200, line=240, first=0, jc="center"),
                               r=rpr(i=True, sz=18, color="555555")),
        "Figure": pstyle("Figure", "Figure", custom=True,
                         p=ppr(before=120, after=0, line=240, first=0, jc="center", keep_next=True)),
        "CaptionedFigure": pstyle("CaptionedFigure", "Captioned Figure", based="Figure", custom=True),
        "Bibliography": pstyle("Bibliography", "Bibliography", nxt="Bibliography",
                               p=ppr(before=0, after=100, line=252), r=rpr(sz=19)),
        "Table": tstyle("BFBFBF", 50, 70, 18, "DCE8EC", head_color=ACC),
        "Hyperlink": cstyle("Hyperlink", "Hyperlink", rpr(color="1F6F8B", u="single")),
        "VerbatimChar": cstyle("VerbatimChar", "Verbatim Char", rpr(font="Courier New", sz=19)),
    })
    return dict(
        font=F, size=22, color="1A1A1A", styles=s,
        # 9,5 × 19 см — ширина колонки ≈ 8 см, ~35–40 знаков в строке на экране телефона
        page=dict(w=round(9.5 * CM), h=19 * CM, top=round(0.8 * CM), bottom=round(0.8 * CM),
                  left=round(0.7 * CM), right=round(0.7 * CM), header=284, footer=284),
        footer=False, update_fields=False,
    )


# --------------------------------------------------------------------------- Сборка

FOOTER_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
    '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
    '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
    '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
    '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>1</w:t></w:r>'
    '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
    "</w:p></w:ftr>"
)


def patch_styles(xml, cfg):
    font, size, color = cfg["font"], cfg["size"], cfg["color"]
    defaults = (
        "<w:docDefaults><w:rPrDefault><w:rPr>"
        f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:eastAsia="{font}" w:cs="{font}"/>'
        f'<w:color w:val="{color}"/><w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
        '<w:lang w:val="ru-RU" w:eastAsia="ru-RU" w:bidi="ar-SA"/>'
        "</w:rPr></w:rPrDefault>"
        '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
        "</w:docDefaults>"
    )
    xml, n = re.subn(r"<w:docDefaults>.*?</w:docDefaults>", defaults, xml, flags=re.S)
    assert n == 1, "docDefaults не найден"
    for sid, new in cfg["styles"].items():
        pat = re.compile(r'<w:style\b[^>]*w:styleId="%s".*?</w:style>' % re.escape(sid), re.S)
        if pat.search(xml):
            xml = pat.sub(lambda _m: new, xml, count=1)
        else:
            xml = xml.replace("</w:styles>", new + "</w:styles>")
    return xml


def patch_theme(xml, font):
    # Всё, что ссылается на шрифты темы (asciiTheme=…), тоже получает нужный шрифт
    def fix(block):
        return re.sub(r'<a:latin typeface="[^"]*"', f'<a:latin typeface="{font}"', block.group(0))
    return re.sub(r"<a:(major|minor)Font>.*?</a:\1Font>", fix, xml, flags=re.S)


def patch_document(xml, cfg):
    p = cfg["page"]
    footer = '<w:footerReference w:type="default" r:id="rIdStyleFooter1"/>' if cfg["footer"] else ""
    title_pg = "<w:titlePg/>" if cfg["footer"] else ""  # без номера на титуле
    sect = (
        f"<w:sectPr>{footer}"
        '<w:footnotePr><w:numRestart w:val="eachSect"/></w:footnotePr>'
        f'<w:pgSz w:w="{p["w"]}" w:h="{p["h"]}"/>'
        f'<w:pgMar w:top="{p["top"]}" w:right="{p["right"]}" w:bottom="{p["bottom"]}" w:left="{p["left"]}" '
        f'w:header="{p["header"]}" w:footer="{p["footer"]}" w:gutter="0"/>'
        f'<w:cols w:space="720"/>{title_pg}</w:sectPr>'
    )
    xml, n = re.subn(r"<w:sectPr>.*?</w:sectPr>", sect, xml, flags=re.S)
    assert n == 1, "sectPr не найден"
    if 'xmlns:r=' not in xml[:2000]:
        xml = xml.replace("<w:document ", '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
    return xml


def patch_settings(xml, cfg):
    xml = re.sub(r"<w:updateFields[^>]*/>", "", xml)
    if cfg["update_fields"]:
        # Word при открытии предложит обновить поля — оглавление заполнится само.
        # По схеме CT_Settings элемент стоит перед footnotePr/compat.
        m = re.search(r"<w:(hdrShapeDefaults|footnotePr|endnotePr|compat|docVars|rsids|m:mathPr|themeFontLang)\b", xml)
        tag = '<w:updateFields w:val="true"/>'
        xml = xml[:m.start()] + tag + xml[m.start():] if m else xml.replace("</w:settings>", tag + "</w:settings>")
    return xml


def build(name, cfg, base: bytes):
    src = zipfile.ZipFile(io.BytesIO(base))
    out_path = HERE / f"reference-{name}.docx"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as out:
        for item in src.infolist():
            data = src.read(item.filename)
            fn = item.filename
            if fn == "word/styles.xml":
                data = patch_styles(data.decode("utf-8"), cfg).encode("utf-8")
            elif fn == "word/theme/theme1.xml":
                data = patch_theme(data.decode("utf-8"), cfg["font"]).encode("utf-8")
            elif fn == "word/document.xml":
                data = patch_document(data.decode("utf-8"), cfg).encode("utf-8")
            elif fn == "word/settings.xml":
                data = patch_settings(data.decode("utf-8"), cfg).encode("utf-8")
            elif fn == "word/_rels/document.xml.rels" and cfg["footer"]:
                data = data.decode("utf-8").replace(
                    "</Relationships>",
                    '<Relationship Id="rIdStyleFooter1" '
                    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" '
                    'Target="footer1.xml"/></Relationships>').encode("utf-8")
            elif fn == "[Content_Types].xml" and cfg["footer"]:
                data = data.decode("utf-8").replace(
                    "</Types>",
                    '<Override PartName="/word/footer1.xml" '
                    'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
                    "</Types>").encode("utf-8")
            out.writestr(item, data)
        if cfg["footer"]:
            out.writestr("word/footer1.xml", FOOTER_XML)
    out_path.write_bytes(buf.getvalue())
    print("собран", out_path)


def main():
    try:
        base = subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"],
                              check=True, capture_output=True).stdout
    except (OSError, subprocess.CalledProcessError) as e:
        sys.exit(f"не удалось получить reference.docx от pandoc: {e}")
    build("official", official(), base)
    build("mobile", mobile(), base)


if __name__ == "__main__":
    main()
