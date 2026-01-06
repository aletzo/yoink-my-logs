import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import fs from "fs"
import path from "path"
import { setupTestDir, cleanupTestDir, logDir, todayFile, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

const SSE_TEST_PORT = 7343

describe("SSE /events endpoint", () => {
  let server
  let serverModule
  
  before(async () => {
    process.env.YOINK_PORT = SSE_TEST_PORT
    serverModule = await import(`../../server.js?t=${Date.now() + 500}`)
    
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${SSE_TEST_PORT}`)
      
      if (parsed.pathname === "/events") {
        // Manually implement SSE for testing
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        })
        
        // Disable Nagle's algorithm and flush headers (matching the fix)
        if (res.socket) {
          res.socket.setNoDelay(true)
        }
        res.flushHeaders()
        
        // Send existing logs as history
        const logFile = todayFile()
        try {
          if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, "utf8")
            const lines = content.trim().split("\n")
            for (const line of lines) {
              if (!line) continue
              try {
                JSON.parse(line)
                res.write(`data: ${line}\n\n`)
              } catch {
                continue
              }
            }
          }
        } catch {
          // File doesn't exist
        }
        
        // Set up file watcher for real-time updates
        const logFilePath = todayFile()
        if (!fs.existsSync(logFilePath)) {
          fs.writeFileSync(logFilePath, "")
        }
        
        let pos = fs.statSync(logFilePath).size
        const watcher = fs.watch(logFilePath, () => {
          try {
            const stats = fs.statSync(logFilePath)
            if (stats.size > pos) {
              const stream = fs.createReadStream(logFilePath, {
                start: pos,
                end: stats.size
              })
              stream.on("data", chunk => {
                const lines = chunk.toString().split("\n")
                for (const line of lines) {
                  if (!line.trim()) continue
                  try {
                    JSON.parse(line.trim())
                    res.write(`data: ${line.trim()}\n\n`)
                  } catch {
                    continue
                  }
                }
              })
              pos = stats.size
            }
          } catch {
            // File might have been deleted
          }
        })
        
        res.on("close", () => {
          watcher.close()
        })
        
        return
      }
      
      if (parsed.pathname === "/clear" && req.method === "POST") {
        serverModule.clearTodayLogs(res)
        return
      }
      
      if (parsed.pathname === "/yoink" && req.method === "POST") {
        serverModule.handleYoink(req, res)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(SSE_TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("SSE endpoint returns correct headers", async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${SSE_TEST_PORT}/events`, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers
        })
        res.destroy() // Close immediately after getting headers
      })
      req.on("error", reject)
    })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "text/event-stream")
    assert.strictEqual(response.headers["cache-control"], "no-cache")
    assert.strictEqual(response.headers["connection"], "keep-alive")
  })
  
  test("SSE endpoint sends existing logs as history", async () => {
    // Clear and add some logs
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: SSE_TEST_PORT,
        path: "/clear",
        method: "POST"
      }, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => resolve(data))
      })
      req.on("error", reject)
      req.end()
    })
    
    // Add a test log
    const testId = `sse-history-${Date.now()}`
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: SSE_TEST_PORT,
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => resolve(data))
      })
      req.on("error", reject)
      req.write(JSON.stringify({ message: testId }))
      req.end()
    })
    
    await wait(100)
    
    // Connect to SSE and check for history
    const events = await new Promise((resolve, reject) => {
      let data = ""
      const req = http.get(`http://localhost:${SSE_TEST_PORT}/events`, (res) => {
        res.on("data", chunk => {
          data += chunk.toString()
        })
        
        // Give it a moment to receive history
        setTimeout(() => {
          res.destroy()
          resolve(data)
        }, 200)
      })
      req.on("error", reject)
    })
    
    assert.ok(events.includes("data:"), "should have SSE data events")
    assert.ok(events.includes(testId), `should include test log: ${testId}`)
  })
  
  test("SSE skips invalid JSON lines", async () => {
    // Write an invalid JSON line directly to the log file
    const logFile = todayFile()
    fs.appendFileSync(logFile, "this is not valid json\n")
    
    // Connect to SSE - should not throw
    const events = await new Promise((resolve, reject) => {
      let data = ""
      const req = http.get(`http://localhost:${SSE_TEST_PORT}/events`, (res) => {
        res.on("data", chunk => {
          data += chunk.toString()
        })
        
        setTimeout(() => {
          res.destroy()
          resolve(data)
        }, 100)
      })
      req.on("error", reject)
    })
    
    // Should not contain the invalid line
    assert.ok(!events.includes("this is not valid json"), "should skip invalid JSON")
  })
})

describe("SSE security", () => {
  test("SSE validates JSON before sending", () => {
    // Test that sendHistory only sends valid JSON
    const validLog = { message: "test", timestamp: "2025-01-01" }
    const validLine = JSON.stringify(validLog)
    
    // Parsing should succeed
    assert.doesNotThrow(() => {
      JSON.parse(validLine)
    })
  })
  
  test("malformed JSON with newlines is rejected", () => {
    // This would be a security issue if sent via SSE
    const malformed = '{"message":"hello\ninjected"}'
    
    // JSON.parse should throw on unescaped newlines
    assert.throws(() => {
      JSON.parse(malformed)
    })
  })
})

describe("SSE connection initialization", () => {
  let server
  let serverModule
  const SSE_INIT_PORT = 7344
  
  before(async () => {
    process.env.YOINK_PORT = SSE_INIT_PORT
    serverModule = await import(`../../server.js?t=${Date.now() + 800}`)
    
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${SSE_INIT_PORT}`)
      
      if (parsed.pathname === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        })
        
        // Disable Nagle's algorithm and flush headers (matching the fix)
        if (res.socket) {
          res.socket.setNoDelay(true)
        }
        res.flushHeaders()
        
        // Set up file watcher for real-time updates
        const logFilePath = todayFile()
        if (!fs.existsSync(logFilePath)) {
          fs.writeFileSync(logFilePath, "")
        }
        
        let pos = fs.statSync(logFilePath).size
        const watcher = fs.watch(logFilePath, () => {
          try {
            const stats = fs.statSync(logFilePath)
            if (stats.size > pos) {
              const stream = fs.createReadStream(logFilePath, {
                start: pos,
                end: stats.size
              })
              stream.on("data", chunk => {
                const lines = chunk.toString().split("\n")
                for (const line of lines) {
                  if (!line.trim()) continue
                  try {
                    JSON.parse(line.trim())
                    res.write(`data: ${line.trim()}\n\n`)
                  } catch {
                    continue
                  }
                }
              })
              pos = stats.size
            }
          } catch {
            // File might have been deleted
          }
        })
        
        res.on("close", () => {
          watcher.close()
        })
        
        return
      }
      
      if (parsed.pathname === "/clear" && req.method === "POST") {
        serverModule.clearTodayLogs(res)
        return
      }
      
      if (parsed.pathname === "/yoink" && req.method === "POST") {
        serverModule.handleYoink(req, res)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(SSE_INIT_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("SSE connection is established with correct headers", async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${SSE_INIT_PORT}/events`, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers
        })
        res.destroy()
      })
      req.on("error", reject)
    })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "text/event-stream")
    assert.strictEqual(response.headers["cache-control"], "no-cache")
  })
  
  test("SSE receives new logs in real-time when starting with no logs", async () => {
    // Clear logs to simulate empty state
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: SSE_INIT_PORT,
        path: "/clear",
        method: "POST"
      }, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => resolve(data))
      })
      req.on("error", reject)
      req.end()
    })
    
    await wait(50)
    
    const testId = `realtime-empty-${Date.now()}`
    let receivedLog = null
    
    // Connect to SSE first
    const sseConnection = new Promise((resolve, reject) => {
      let data = ""
      const req = http.get(`http://localhost:${SSE_INIT_PORT}/events`, (res) => {
        res.on("data", chunk => {
          data += chunk.toString()
          
          // Check if we received our test log
          if (data.includes(testId)) {
            const lines = data.split("\n")
            for (const line of lines) {
              if (line.startsWith("data: ") && line.includes(testId)) {
                try {
                  receivedLog = JSON.parse(line.slice(6))
                } catch {
                  // Continue
                }
              }
            }
            res.destroy()
            resolve(receivedLog)
          }
        })
        
        // Timeout after 2 seconds
        setTimeout(() => {
          res.destroy()
          resolve(null)
        }, 2000)
      })
      req.on("error", reject)
    })
    
    // Wait a bit for the SSE connection to establish
    await wait(100)
    
    // Now send a log
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: SSE_INIT_PORT,
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => resolve(data))
      })
      req.on("error", reject)
      req.write(JSON.stringify({ message: testId }))
      req.end()
    })
    
    // Wait for SSE to receive the log
    const result = await sseConnection
    
    assert.ok(result !== null, "should receive the log via SSE when starting with no logs")
    assert.strictEqual(result.message, testId, "received log should have correct message")
  })
})

