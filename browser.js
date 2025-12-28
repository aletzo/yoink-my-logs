const DEFAULT_HOST = "localhost"
const DEFAULT_PORT = 7337

let host = DEFAULT_HOST
let port = DEFAULT_PORT

function getBaseUrl() {
  return `http://${host}:${port}`
}

function getCallerInfo() {
  const stack = new Error().stack
  if (!stack) return null

  const lines = stack.split("\n")
  
  // Skip: Error, getCallerInfo, send, yoink/yoink.info/etc
  // We want the actual caller
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip internal yoink functions
    if (line.includes("browser.js") || 
        line.includes("node_modules") ||
        line.includes("get-caller") ||
        line.includes("yoink.js")) {
      continue
    }
    
    // Parse browser stack trace format
    // Format: "functionName@file:line:col" or "at functionName (file:line:col)"
    const browserMatch = line.match(/@(.+):(\d+):(\d+)/)
    const atMatch = line.match(/at\s+(?:.*\()?(.+):(\d+):(\d+)\)?/)
    
    let file, lineNum
    
    if (browserMatch) {
      file = browserMatch[1]
      lineNum = browserMatch[2]
    } else if (atMatch) {
      file = atMatch[1]
      lineNum = atMatch[2]
    }
    
    if (file && lineNum) {
      // Handle URLs (browser stack traces use full URLs)
      let shortPath = file
      let fullPath = file
      
      // Check if it's a URL
      if (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("file://")) {
        try {
          const url = new URL(file)
          const pathname = url.pathname
          
          if (pathname === "/" || pathname === "") {
            // Inline script in HTML page - use the page URL
            shortPath = url.hostname + (url.port ? ":" + url.port : "") + " (inline)"
          } else {
            // Extract filename from path
            const pathParts = pathname.split("/").filter(p => p)
            shortPath = pathParts.length > 0 
              ? pathParts.slice(-2).join("/") || pathParts[pathParts.length - 1]
              : pathname
          }
        } catch {
          // URL parsing failed, use the original
          shortPath = file
        }
      } else {
        // Not a URL - use original path splitting logic
        const pathParts = file.split(/[/\\]/)
        shortPath = pathParts.length > 1 
          ? pathParts.slice(-2).join("/")
          : file
      }
      
      return {
        file: shortPath,
        line: parseInt(lineNum, 10),
        fullPath: fullPath
      }
    }
  }
  
  return null
}

function parseArgs(first, second) {
  // Two arguments: first is data, second is message
  if (second !== undefined) {
    return { message: String(second), data: first }
  }
  
  // Single string argument: treat as message
  if (typeof first === "string") {
    return { message: first, data: undefined }
  }
  
  // Single non-string argument: treat as data
  return { message: "", data: first }
}

function send(first, second, tag) {
  const { message, data } = parseArgs(first, second)
  const caller = getCallerInfo()
  
  const payload = { message, data, tag }
  if (caller) {
    payload.location = {
      file: caller.file,
      line: caller.line,
      fullPath: caller.fullPath
    }
  }
  
  fetch(`${getBaseUrl()}/yoink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {})
}

function yoink(first, second) {
  send(first, second, undefined)
}

yoink.info = (first, second) => send(first, second, "info")
yoink.warn = (first, second) => send(first, second, "warn")
yoink.error = (first, second) => send(first, second, "error")
yoink.debug = (first, second) => send(first, second, "debug")
yoink.success = (first, second) => send(first, second, "success")

yoink.init = (options = {}) => {
  if (options.host) host = options.host
  if (options.port) port = options.port
}

export default yoink
