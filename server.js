import http from "http"
import url from "url"
import fs from "fs"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let port = process.env.YOINK_PORT || 7337
const homedir = os.homedir()
const dir = path.join(homedir, ".yoink-my-logs")

function todayFile() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return path.join(dir, `${y}-${m}-${day}.log`)
}

function ensureDir() {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function pushLog(log) {
  ensureDir()
  const line = JSON.stringify(log) + "\n"
  fs.appendFile(todayFile(), line, () => {})
}

export function startServer() {
  ensureDir()
  const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url)

    if (parsed.pathname === "/events") {
      startStream(res)
      return
    }

    if (parsed.pathname === "/client.js") {
      serveStatic("client.js", "application/javascript", res)
      return
    }

    if (parsed.pathname === "/") {
      serveStatic("index.html", "text/html", res)
      return
    }

    res.writeHead(404)
    res.end()
  })

  server.listen(port, () => {
    console.log()
    console.log(`  yoink-my-logs`)
    console.log()
    console.log(`  → Local:   http://localhost:${port}`)
    console.log(`  → Logs:    ~/.yoink-my-logs/`)
    console.log()
  })
}

function startStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  })

  sendHistory(res)
  followFile(res)

  res.on("close", () => {
    // no need to track clients, the fs watcher handles broadcast to all
  })
}

function sendHistory(res) {
  try {
    const content = fs.readFileSync(todayFile(), "utf8")
    const lines = content.trim().split("\n")
    for (const line of lines) {
      if (!line) continue
      res.write(`data: ${line}\n\n`)
    }
  } catch {}
}

function followFile(res) {
  const file = todayFile()
  ensureDir()
  
  // Create file if it doesn't exist
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "")
  }

  let pos = 0
  try {
    const stats = fs.statSync(file)
    pos = stats.size
  } catch {}

  const watcher = fs.watch(file, () => {
    fs.stat(file, (err, stats) => {
      if (err) return
      if (stats.size > pos) {
        const read = fs.createReadStream(file, {
          start: pos,
          end: stats.size
        })
        read.on("data", chunk => {
          const lines = chunk.toString().split("\n")
          for (const line of lines) {
            if (!line.trim()) continue
            res.write(`data: ${line.trim()}\n\n`)
          }
        })
        pos = stats.size
      }
    })
  })

  res.on("close", () => watcher.close())
}

function serveStatic(fileName, contentType, res) {
  const filePath = path.join(__dirname, "public", fileName)
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500)
      res.end("error")
      return
    }
    res.writeHead(200, { "Content-Type": contentType })
    res.end(content)
  })
}
