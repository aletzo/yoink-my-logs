#!/usr/bin/env node

/**
 * Simple server to serve the browser demo HTML file
 * and open it in the default browser
 */

import http from "http"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { exec } from "child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const demoFile = path.join(__dirname, "browser-demo.html")
const port = 8080

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/browser-demo.html") {
    fs.readFile(demoFile, (err, content) => {
      if (err) {
        res.writeHead(500)
        res.end("Error reading demo file")
        return
      }
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(content)
    })
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(port, () => {
  const url = `http://localhost:${port}`
  console.log(`🌐 Serving browser demo at ${url}`)
  console.log(`📝 Make sure the yoink server is running on http://localhost:7337\n`)
  
  // Open in default browser
  const command = process.platform === "win32" 
    ? `start ${url}`
    : process.platform === "darwin"
    ? `open ${url}`
    : `xdg-open ${url}`
  
  exec(command, (err) => {
    if (err) {
      console.log(`⚠️  Could not open browser automatically. Please open ${url} manually`)
    }
  })
  
  console.log("Press Ctrl+C to stop the server")
})

process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down server...")
  server.close()
  process.exit(0)
})

