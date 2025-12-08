const el = document.getElementById("logs")
const emptyState = document.getElementById("empty-state")
const searchInput = document.getElementById("search")
const events = new EventSource("/events")

const tagColors = {
  info: "#3b82f6",
  warn: "#f59e0b",
  error: "#ef4444",
  debug: "#8b5cf6",
  success: "#22c55e"
}

let allLogs = []
let searchQuery = ""
let activeTags = new Set(["info", "warn", "error", "debug", "success", "none"])

// Theme toggle
let currentMode = localStorage.getItem('yoink-theme') || 'system'

function applyTheme(mode) {
  currentMode = mode
  localStorage.setItem('yoink-theme', mode)
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
  
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  
  // Update button states
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode)
  })
}

// Initialize theme buttons
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.mode))
})

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentMode === 'system') applyTheme('system')
})

// Apply initial theme
applyTheme(currentMode)

// Initialize filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.tag
    
    if (tag === "all") {
      const allActive = activeTags.size === 6
      if (allActive) {
        activeTags.clear()
        document.querySelectorAll(".filter-btn:not([data-tag='all'])").forEach(b => b.classList.remove("active"))
      } else {
        activeTags = new Set(["info", "warn", "error", "debug", "success", "none"])
        document.querySelectorAll(".filter-btn:not([data-tag='all'])").forEach(b => b.classList.add("active"))
      }
      btn.classList.toggle("active", !allActive)
    } else {
      if (activeTags.has(tag)) {
        activeTags.delete(tag)
        btn.classList.remove("active")
      } else {
        activeTags.add(tag)
        btn.classList.add("active")
      }
      // Update "all" button state
      const allBtn = document.querySelector(".filter-btn[data-tag='all']")
      allBtn.classList.toggle("active", activeTags.size === 6)
    }
    
    renderLogs()
  })
})

// Search input
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase()
  renderLogs()
})

function matchesFilter(log) {
  const logTag = log.tag || "none"
  if (!activeTags.has(logTag)) return false
  
  if (searchQuery) {
    const searchText = JSON.stringify(log).toLowerCase()
    if (!searchText.includes(searchQuery)) return false
  }
  
  return true
}

function updateEmptyState() {
  emptyState.style.display = allLogs.length === 0 ? "block" : "none"
}

function renderLogs() {
  el.innerHTML = ""
  const filtered = allLogs.filter(matchesFilter)
  filtered.forEach(log => {
    el.appendChild(createLogElement(log))
  })
  updateEmptyState()
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

function createLogElement(log) {
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
  
  return li
}

events.onmessage = (e) => {
  const log = JSON.parse(e.data)
  allLogs.push(log)
  updateEmptyState()
  
  if (matchesFilter(log)) {
    el.appendChild(createLogElement(log))
    window.scrollTo(0, document.body.scrollHeight)
  }
}
