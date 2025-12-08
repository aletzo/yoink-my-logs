const el = document.getElementById("logs")
const events = new EventSource("/events")

const tagColors = {
  info: "#3b82f6",
  warn: "#f59e0b",
  error: "#ef4444",
  debug: "#8b5cf6",
  success: "#22c55e"
}

function createJsonTree(data, collapsed = true) {
  if (data === null) return createPrimitive("null", "null")
  if (data === undefined) return createPrimitive("undefined", "undefined")
  
  const type = typeof data
  if (type === "string") return createPrimitive(`"${data}"`, "string")
  if (type === "number") return createPrimitive(String(data), "number")
  if (type === "boolean") return createPrimitive(String(data), "boolean")
  
  if (Array.isArray(data)) {
    return createCollapsible(data, "array", collapsed)
  }
  
  if (type === "object") {
    return createCollapsible(data, "object", collapsed)
  }
  
  return createPrimitive(String(data), "unknown")
}

function createPrimitive(text, className) {
  const span = document.createElement("span")
  span.className = `json-${className}`
  span.textContent = text
  return span
}

function createCollapsible(data, type, collapsed) {
  const isArray = type === "array"
  const keys = Object.keys(data)
  const container = document.createElement("span")
  container.className = "json-collapsible"
  
  const toggle = document.createElement("span")
  toggle.className = "json-toggle"
  toggle.textContent = collapsed ? "▶" : "▼"
  container.appendChild(toggle)
  
  const preview = document.createElement("span")
  preview.className = "json-preview"
  if (isArray) {
    preview.textContent = `Array(${keys.length})`
  } else {
    const previewKeys = keys.slice(0, 3).join(", ")
    preview.textContent = `{${previewKeys}${keys.length > 3 ? ", ..." : ""}}`
  }
  container.appendChild(preview)
  
  const content = document.createElement("div")
  content.className = "json-content"
  content.style.display = collapsed ? "none" : "block"
  
  const bracket = isArray ? "[" : "{"
  const closeBracket = isArray ? "]" : "}"
  
  const open = document.createElement("div")
  open.className = "json-bracket"
  open.textContent = bracket
  content.appendChild(open)
  
  const items = document.createElement("div")
  items.className = "json-items"
  
  keys.forEach((key, i) => {
    const item = document.createElement("div")
    item.className = "json-item"
    
    if (!isArray) {
      const keySpan = document.createElement("span")
      keySpan.className = "json-key"
      keySpan.textContent = `"${key}"`
      item.appendChild(keySpan)
      
      const colon = document.createElement("span")
      colon.textContent = ": "
      item.appendChild(colon)
    }
    
    item.appendChild(createJsonTree(data[key], true))
    
    if (i < keys.length - 1) {
      const comma = document.createElement("span")
      comma.textContent = ","
      item.appendChild(comma)
    }
    
    items.appendChild(item)
  })
  
  content.appendChild(items)
  
  const close = document.createElement("div")
  close.className = "json-bracket"
  close.textContent = closeBracket
  content.appendChild(close)
  
  container.appendChild(content)
  
  toggle.addEventListener("click", () => {
    const isHidden = content.style.display === "none"
    content.style.display = isHidden ? "block" : "none"
    preview.style.display = isHidden ? "none" : "inline"
    toggle.textContent = isHidden ? "▼" : "▶"
  })
  
  return container
}

events.onmessage = (e) => {
  const log = JSON.parse(e.data)
  const li = document.createElement("li")
  
  const header = document.createElement("div")
  header.className = "log-header"
  
  const time = document.createElement("span")
  time.className = "time"
  time.textContent = `[${log.timestamp}]`
  header.appendChild(time)
  
  if (log.tag) {
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = log.tag.toUpperCase()
    tag.style.backgroundColor = tagColors[log.tag] || "#6b7280"
    header.appendChild(tag)
  }
  
  const msg = document.createElement("span")
  msg.className = "message"
  msg.textContent = log.message
  header.appendChild(msg)
  
  li.appendChild(header)
  
  if (log.data !== undefined) {
    const dataContainer = document.createElement("div")
    dataContainer.className = "log-data"
    dataContainer.appendChild(createJsonTree(log.data, false))
    li.appendChild(dataContainer)
  }
  
  el.appendChild(li)
  window.scrollTo(0, document.body.scrollHeight)
}
