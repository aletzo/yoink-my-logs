const el = document.getElementById("logs")
const events = new EventSource("/events")

const tagColors = {
  info: "#3b82f6",
  warn: "#f59e0b",
  error: "#ef4444",
  debug: "#8b5cf6",
  success: "#22c55e"
}

events.onmessage = (e) => {
  const log = JSON.parse(e.data)
  const li = document.createElement("li")
  
  const time = document.createElement("span")
  time.className = "time"
  time.textContent = `[${log.timestamp}]`
  li.appendChild(time)
  
  if (log.tag) {
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = log.tag.toUpperCase()
    tag.style.backgroundColor = tagColors[log.tag] || "#6b7280"
    li.appendChild(tag)
  }
  
  const msg = document.createElement("span")
  msg.className = "message"
  msg.textContent = log.message
  li.appendChild(msg)
  
  el.appendChild(li)
  window.scrollTo(0, document.body.scrollHeight)
}
