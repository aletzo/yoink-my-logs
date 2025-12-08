import http from "http"
import fs from "fs"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Validate port: must be a number between 1-65535
let port = parseInt(process.env.YOINK_PORT, 10)
if (isNaN(port) || port < 1 || port > 65535) {
  port = 7337
}
const homedir = os.homedir()
const dir = path.join(homedir, ".yoink-my-logs")
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

function todayPrefix() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getTodayFiles() {
  ensureDir()
  const prefix = todayPrefix()
  try {
    const files = fs.readdirSync(dir)
    return files
      .filter(f => f.startsWith(prefix) && f.endsWith(".log"))
      .sort((a, b) => {
        // Sort by number suffix: 2025-12-08.log < 2025-12-08_2.log < 2025-12-08_3.log
        const getNum = (name) => {
          const match = name.match(/_(\d+)\.log$/)
          return match ? parseInt(match[1], 10) : 1
        }
        return getNum(a) - getNum(b)
      })
  } catch {
    return []
  }
}

function todayFile() {
  const files = getTodayFiles()
  const prefix = todayPrefix()
  
  if (files.length === 0) {
    return path.join(dir, `${prefix}.log`)
  }
  
  // Return the latest (highest numbered) file
  return path.join(dir, files[files.length - 1])
}

function getNextLogFile() {
  const files = getTodayFiles()
  const prefix = todayPrefix()
  
  if (files.length === 0) {
    return path.join(dir, `${prefix}.log`)
  }
  
  const latestFile = files[files.length - 1]
  const match = latestFile.match(/_(\d+)\.log$/)
  const nextNum = match ? parseInt(match[1], 10) + 1 : 2
  
  return path.join(dir, `${prefix}_${nextNum}.log`)
}

function ensureDir() {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const MAX_LOG_SIZE = 100000 // 100KB limit per log entry

export function pushLog(log) {
  ensureDir()
  const line = JSON.stringify(log) + "\n"
  
  // Prevent excessively large log entries
  if (line.length > MAX_LOG_SIZE) {
    console.warn("yoink: Log payload too large, skipping")
    return
  }
  
  // Check if current file exceeds 100MB, rotate if needed
  let targetFile = todayFile()
  try {
    const stats = fs.statSync(targetFile)
    if (stats.size >= MAX_FILE_SIZE) {
      targetFile = getNextLogFile()
    }
  } catch {
    // File doesn't exist yet, use default
  }
  
  fs.appendFile(targetFile, line, (err) => {
    if (err) console.error("yoink: Failed to write log:", err.message)
  })
}

export function startServer() {
  ensureDir()
  const server = http.createServer((req, res) => {
    const parsed = new URL(req.url, `http://localhost:${port}`)

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

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
}

function startStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    ...securityHeaders
  })

  sendHistory(res)
  followFile(res)

  res.on("close", () => {
    // no need to track clients, the fs watcher handles broadcast to all
  })
}

function sendHistory(res) {
  // Read all of today's log files to show complete history
  const files = getTodayFiles()
  
  for (const fileName of files) {
    try {
      const filePath = path.join(dir, fileName)
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.trim().split("\n")
      for (const line of lines) {
        if (!line) continue
        res.write(`data: ${line}\n\n`)
      }
    } catch {
      // File doesn't exist or can't be read, skip it
    }
  }
}

function followFile(res) {
  ensureDir()
  
  let currentFile = todayFile()
  let pos = 0
  let fileWatcher = null
  let dirWatcher = null
  
  // Create file if it doesn't exist
  if (!fs.existsSync(currentFile)) {
    fs.writeFileSync(currentFile, "")
  }

  try {
    const stats = fs.statSync(currentFile)
    pos = stats.size
  } catch {
    // File was just created, start from beginning
  }

  function watchCurrentFile() {
    if (fileWatcher) fileWatcher.close()
    
    fileWatcher = fs.watch(currentFile, () => {
      fs.stat(currentFile, (err, stats) => {
        if (err) return
        if (stats.size > pos) {
          const read = fs.createReadStream(currentFile, {
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
  }

  // Watch the directory for new log files (handles rotation)
  dirWatcher = fs.watch(dir, (eventType, filename) => {
    if (eventType === "rename" && filename && filename.startsWith(todayPrefix()) && filename.endsWith(".log")) {
      const newLatest = todayFile()
      if (newLatest !== currentFile) {
        // A new rotated file was created, switch to it
        currentFile = newLatest
        pos = 0
        watchCurrentFile()
      }
    }
  })

  watchCurrentFile()

  res.on("close", () => {
    if (fileWatcher) fileWatcher.close()
    if (dirWatcher) dirWatcher.close()
  })
}

function serveStatic(fileName, contentType, res) {
  const filePath = path.join(__dirname, "public", fileName)
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, securityHeaders)
      res.end("error")
      return
    }
    res.writeHead(200, { "Content-Type": contentType, ...securityHeaders })
    res.end(content)
  })
}
