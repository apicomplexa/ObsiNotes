-- Подписи и рисунки для DOCX-экспорта (подключается из official.yaml / mobile.yaml).
-- В заметках подписи пишутся обычным текстом, без синтаксиса pandoc:
--   __Таблица 3. Показания…__          → стиль «Table Caption», держится с таблицей
--   ![](путь/к/картинке.png)           → стиль «Figure»: по центру, без абзацного отступа
--   _Схема 1. Общая карта…_            → стиль «Image Caption»
-- Префиксы подписей — в TABLE_PREFIXES и IMAGE_PREFIXES ниже.

local stringify = pandoc.utils.stringify

local TABLE_PREFIXES = { "Таблица" }
local IMAGE_PREFIXES = { "Схема", "Рисунок", "Рис." }

local function starts_with_any(s, prefixes)
  for _, p in ipairs(prefixes) do
    if s:sub(1, #p) == p then return true end
  end
  return false
end

-- содержимое абзаца без пробелов и переносов по краям
local function meaningful(inlines)
  local out = {}
  for _, el in ipairs(inlines) do
    if el.t ~= "Space" and el.t ~= "SoftBreak" and el.t ~= "LineBreak" then
      table.insert(out, el)
    end
  end
  return out
end

local function styled(block, style)
  return pandoc.Div({ block }, pandoc.Attr("", {}, { ["custom-style"] = style }))
end

function Para(p)
  local c = meaningful(p.content)
  if #c == 1 then
    local el = c[1]
    if el.t == "Image" then
      return styled(p, "Figure")
    elseif el.t == "Strong" and starts_with_any(stringify(el), TABLE_PREFIXES) then
      return styled(p, "Table Caption")
    elseif el.t == "Emph" and starts_with_any(stringify(el), IMAGE_PREFIXES) then
      return styled(p, "Image Caption")
    end
  end
end
