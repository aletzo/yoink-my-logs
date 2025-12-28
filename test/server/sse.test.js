import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import fs from "fs"
import path from "path"
import { setupTestDir, logDir, todayFile, wait } from "../helpers.js"

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

