/**
 * Extracts file and line number information from the call stack.
 * Returns the location where yoink() was actually called (not the yoink function itself).
 */

export function getCallerInfo() {
  const stack = new Error().stack
  if (!stack) return null

  const lines = stack.split("\n")
  
  // Skip: Error, getCallerInfo, createLog, yoink/yoink.info/etc
  // We want the 4th or 5th line (the actual caller)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip internal yoink functions
    if (line.includes("get-caller.js") || 
        line.includes("index.js") || 
        line.includes("browser.js") ||
        line.includes("node_modules")) {
      continue
    }
    
    // Parse stack trace line
    // Node.js format: "at functionName (file:line:col)" or "at file:line:col"
    // Browser format: "functionName@file:line:col" or "at functionName (file:line:col)"
    const nodeMatch = line.match(/\((.+):(\d+):(\d+)\)/)
    const browserMatch = line.match(/@(.+):(\d+):(\d+)/)
    const atMatch = line.match(/at\s+(.+):(\d+):(\d+)/)
    
    let file, lineNum
    
    if (nodeMatch) {
      file = nodeMatch[1]
      lineNum = nodeMatch[2]
    } else if (browserMatch) {
      file = browserMatch[1]
      lineNum = browserMatch[2]
    } else if (atMatch) {
      file = atMatch[1]
      lineNum = atMatch[2]
    }
    
    if (file && lineNum) {
      // Clean up file path - show relative path or just filename
      const fileName = file.split(/[/\\]/).pop()
      const pathParts = file.split(/[/\\]/)
      // Show last 2 parts of path for context
      const shortPath = pathParts.length > 1 
        ? pathParts.slice(-2).join("/")
        : fileName
      
      return {
        file: shortPath,
        line: parseInt(lineNum, 10),
        fullPath: file
      }
    }
  }
  
  return null
}

