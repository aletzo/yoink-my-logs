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
// Allow overriding log directory for testing
const dir = process.env.YOINK_LOG_DIR || path.join(os.homedir(), ".yoink-my-logs")
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

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}

export function clearTodayLogs(res) {
  const files = getTodayFiles()
  
  try {
    for (const fileName of files) {
      const filePath = path.join(dir, fileName)
      fs.truncateSync(filePath, 0)
    }
    res.writeHead(200, { "Content-Type": "application/json", ...securityHeaders })
    res.end(JSON.stringify({ success: true }))
  } catch (err) {
    console.error("yoink: Failed to clear logs:", err.message)
    res.writeHead(500, { "Content-Type": "application/json", ...securityHeaders })
    res.end(JSON.stringify({ success: false, error: err.message }))
  }
}

export function handleYoinkPreflight(res) {
  res.writeHead(204, { ...securityHeaders, ...corsHeaders })
  res.end()
}

const ALLOWED_TAGS = new Set(["info", "success", "warn", "error", "debug", undefined])

export function handleYoink(req, res) {
  let body = ""
  req.on("data", chunk => body += chunk)
  req.on("end", () => {
    try {
      const { message, data, tag, location } = JSON.parse(body)
      
      if (message === undefined) {
        res.writeHead(400, { "Content-Type": "application/json", ...securityHeaders, ...corsHeaders })
        res.end(JSON.stringify({ success: false, error: "Missing message" }))
        return
      }
      
      // Validate tag if provided
      if (tag !== undefined && !ALLOWED_TAGS.has(tag)) {
        res.writeHead(400, { "Content-Type": "application/json", ...securityHeaders, ...corsHeaders })
        res.end(JSON.stringify({ success: false, error: "Invalid tag" }))
        return
      }
      
      const logEntry = { message: String(message), data, tag, timestamp: new Date().toISOString() }
      
      // Include location if provided (from browser client or Node.js)
      if (location && typeof location === 'object' && location.file && location.line) {
        logEntry.location = {
          file: String(location.file),
          line: parseInt(location.line, 10)
        }
      }
      
      pushLog(logEntry)
      res.writeHead(200, { "Content-Type": "application/json", ...securityHeaders, ...corsHeaders })
      res.end(JSON.stringify({ success: true }))
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json", ...securityHeaders, ...corsHeaders })
      res.end(JSON.stringify({ success: false, error: "Invalid JSON" }))
    }
  })
}

export function deleteLog(req, res) {
  let body = ""
  req.on("data", chunk => body += chunk)
  req.on("end", () => {
    try {
      const { timestamp, message } = JSON.parse(body)
      if (!timestamp || !message) {
        res.writeHead(400, { "Content-Type": "application/json", ...securityHeaders })
        res.end(JSON.stringify({ success: false, error: "Missing timestamp or message" }))
        return
      }
      
      const files = getTodayFiles()
      let deleted = false
      
      for (const fileName of files) {
        const filePath = path.join(dir, fileName)
        try {
          const content = fs.readFileSync(filePath, "utf8")
          const lines = content.split("\n")
          const filteredLines = []
          
          for (const line of lines) {
            if (!line.trim()) {
              filteredLines.push(line)
              continue
            }
            
            // Only delete the first match
            if (!deleted) {
              try {
                const log = JSON.parse(line)
                if (log.timestamp === timestamp && log.message === message) {
                  deleted = true
                  continue // Skip this line (delete it)
                }
              } catch {
                // Not valid JSON, keep it
              }
            }
            
            filteredLines.push(line)
          }
          
          if (deleted) {
            fs.writeFileSync(filePath, filteredLines.join("\n"))
            break
          }
        } catch {
          // File doesn't exist or can't be read, skip it
        }
      }
      
      res.writeHead(200, { "Content-Type": "application/json", ...securityHeaders })
      res.end(JSON.stringify({ success: deleted }))
    } catch (err) {
      console.error("yoink: Failed to delete log:", err.message)
      res.writeHead(500, { "Content-Type": "application/json", ...securityHeaders })
      res.end(JSON.stringify({ success: false, error: err.message }))
    }
  })
}

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
  
  try {
    fs.appendFileSync(targetFile, line)
  } catch (err) {
    console.error("yoink: Failed to write log:", err.message)
  }
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

    if (parsed.pathname === "/styles.css") {
      serveStatic("styles.css", "text/css", res)
      return
    }

    if (parsed.pathname === "/") {
      serveStatic("index.html", "text/html", res)
      return
    }

    if (parsed.pathname === "/clear" && req.method === "POST") {
      clearTodayLogs(res)
      return
    }

    if (parsed.pathname === "/delete" && req.method === "POST") {
      deleteLog(req, res)
      return
    }

    if (parsed.pathname === "/yoink" && req.method === "OPTIONS") {
      handleYoinkPreflight(res)
      return
    }

    if (parsed.pathname === "/yoink" && req.method === "POST") {
      handleYoink(req, res)
      return
    }

    if (parsed.pathname === "/yoink.js") {
      serveYoinkClient(res)
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
    console.log(`  → Logs:    ${dir}`)
    console.log()
  })
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
        // Validate that the line is valid JSON before sending
        // This prevents SSE injection if the file is corrupted
        try {
          JSON.parse(line)
          res.write(`data: ${line}\n\n`)
        } catch {
          // Skip invalid JSON lines (defensive: shouldn't happen with normal operation)
          continue
        }
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
              // Validate that the line is valid JSON before sending
              // This prevents SSE injection if the file is corrupted
              try {
                JSON.parse(line.trim())
                res.write(`data: ${line.trim()}\n\n`)
              } catch {
                // Skip invalid JSON lines (defensive: shouldn't happen with normal operation)
                continue
              }
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

function serveYoinkClient(res) {
  const script = `(function() {
  window.__YOINK_PORT__ = ${port};
  var BASE = "http://localhost:${port}";
  
  function getCallerInfo() {
    var stack = new Error().stack;
    if (!stack) return null;
    
    var lines = stack.split("\\n");
    
    // Skip: Error, getCallerInfo, send, yoink/yoink.info/etc
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      
      // Skip internal yoink functions
      if (line.indexOf("browser.js") !== -1 || 
          line.indexOf("node_modules") !== -1 ||
          line.indexOf("get-caller") !== -1 ||
          line.indexOf("yoink.js") !== -1) {
        continue;
      }
      
      // Parse browser stack trace format
      var browserMatch = line.match(/@(.+):(\\d+):(\\d+)/);
      var atMatch = line.match(/at\\s+(?:.*\\()?(.+):(\\d+):(\\d+)\\)?/);
      
      var file, lineNum;
      
      if (browserMatch) {
        file = browserMatch[1];
        lineNum = browserMatch[2];
      } else if (atMatch) {
        file = atMatch[1];
        lineNum = atMatch[2];
      }
      
      if (file && lineNum) {
        var shortPath = file;
        var fullPath = file;
        
        // Check if it's a URL
        if (file.indexOf("http://") === 0 || file.indexOf("https://") === 0 || file.indexOf("file://") === 0) {
          try {
            var url = new URL(file);
            var pathname = url.pathname;
            
            if (pathname === "/" || pathname === "") {
              // Inline script in HTML page - use the page URL
              shortPath = url.hostname + (url.port ? ":" + url.port : "") + " (inline)";
            } else {
              // Extract filename from path
              var pathParts = pathname.split("/").filter(function(p) { return p; });
              shortPath = pathParts.length > 0 
                ? pathParts.slice(-2).join("/") || pathParts[pathParts.length - 1]
                : pathname;
            }
          } catch (e) {
            // URL parsing failed, use the original
            shortPath = file;
          }
        } else {
          // Not a URL - use original path splitting logic
          var pathParts = file.split(/[/\\\\]/);
          shortPath = pathParts.length > 1 
            ? pathParts.slice(-2).join("/")
            : file;
        }
        
        return {
          file: shortPath,
          line: parseInt(lineNum, 10),
          fullPath: fullPath
        };
      }
    }
    
    return null;
  }
  
  function parseArgs(first, second) {
    // Two arguments: first is data, second is message
    if (second !== undefined) {
      return { message: String(second), data: first };
    }
    
    // Single string argument: treat as message
    if (typeof first === "string") {
      return { message: first, data: undefined };
    }
    
    // Single non-string argument: treat as data
    return { message: "", data: first };
  }
  
  function send(first, second, tag) {
    var args = parseArgs(first, second);
    var caller = getCallerInfo();
    
    var payload = { message: args.message, data: args.data, tag: tag };
    if (caller) {
      payload.location = {
        file: caller.file,
        line: caller.line,
        fullPath: caller.fullPath
      };
    }
    
    fetch(BASE + "/yoink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function() {});
  }
  
  function yoink(first, second) {
    send(first, second, undefined);
  }
  
  yoink.info = function(first, second) { send(first, second, "info"); };
  yoink.warn = function(first, second) { send(first, second, "warn"); };
  yoink.error = function(first, second) { send(first, second, "error"); };
  yoink.debug = function(first, second) { send(first, second, "debug"); };
  yoink.success = function(first, second) { send(first, second, "success"); };
  
  window.yoink = yoink;
})();`
  res.writeHead(200, { "Content-Type": "application/javascript", ...securityHeaders, ...corsHeaders })
  res.end(script)
}
