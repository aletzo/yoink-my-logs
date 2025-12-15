import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import { setupTestDir, getLogLines, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

const YOINK_TEST_PORT = 7341

// Helper to make HTTP requests
function request(method, path, body = null, port = YOINK_TEST_PORT) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port,
      path,
      method,
      headers: body ? { "Content-Type": "application/json" } : {}
    }
    
    const req = http.request(options, (res) => {
      let data = ""
      res.on("data", chunk => data += chunk)
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data })
        }
      })
    })
    
    req.on("error", reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

describe("POST /yoink endpoint", () => {
  let server
  let serverModule
  
  before(async () => {
    process.env.YOINK_PORT = YOINK_TEST_PORT
    serverModule = await import(`../../server.js?t=${Date.now() + 300}`)
    
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${YOINK_TEST_PORT}`)
      
      if (parsed.pathname === "/yoink" && req.method === "OPTIONS") {
        serverModule.handleYoinkPreflight(res)
        return
      }
      
      if (parsed.pathname === "/yoink" && req.method === "POST") {
        serverModule.handleYoink(req, res)
        return
      }
      
      if (parsed.pathname === "/clear" && req.method === "POST") {
        serverModule.clearTodayLogs(res)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(YOINK_TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("writes a log entry with message", async () => {
    // Clear logs first
    await request("POST", "/clear")
    
    const testId = `yoink-endpoint-${Date.now()}`
    const response = await request("POST", "/yoink", {
      message: testId,
      data: { foo: "bar" }
    })
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, true, "should return success: true")
    
    await wait(50)
    
    const lines = getLogLines()
    const log = lines.map(l => JSON.parse(l)).find(l => l.message === testId)
    
    assert.ok(log, "should have written the log")
    assert.deepStrictEqual(log.data, { foo: "bar" }, "should have data payload")
    assert.ok(log.timestamp, "should have timestamp")
  })
  
  test("writes a log entry with tag", async () => {
    await request("POST", "/clear")
    
    const testId = `yoink-tag-${Date.now()}`
    await request("POST", "/yoink", {
      message: testId,
      tag: "error"
    })
    
    await wait(50)
    
    const lines = getLogLines()
    const log = lines.map(l => JSON.parse(l)).find(l => l.message === testId)
    
    assert.ok(log, "should have written the log")
    assert.strictEqual(log.tag, "error", "should have error tag")
  })
  
  test("returns 400 when message is missing", async () => {
    const response = await request("POST", "/yoink", {
      data: { some: "data" }
    })
    
    assert.strictEqual(response.status, 400, "should return 400 status")
    assert.strictEqual(response.data.success, false, "should return success: false")
    assert.ok(response.data.error, "should return an error message")
  })
  
  test("returns 400 for invalid JSON", async () => {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: YOINK_TEST_PORT,
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
      
      const req = http.request(options, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) })
          } catch {
            resolve({ status: res.statusCode, data })
          }
        })
      })
      
      req.on("error", reject)
      req.write("not valid json")
      req.end()
    })
    
    assert.strictEqual(response.status, 400, "should return 400 status")
    assert.strictEqual(response.data.success, false, "should return success: false")
  })
  
  test("includes CORS headers in response", async () => {
    const response = await request("POST", "/yoink", {
      message: "cors-test"
    })
    
    assert.strictEqual(response.headers["access-control-allow-origin"], "*", "should have Access-Control-Allow-Origin: *")
  })
  
  test("OPTIONS preflight returns CORS headers", async () => {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: YOINK_TEST_PORT,
        path: "/yoink",
        method: "OPTIONS"
      }
      
      const req = http.request(options, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, data })
        })
      })
      
      req.on("error", reject)
      req.end()
    })
    
    assert.strictEqual(response.status, 204, "should return 204 status")
    assert.strictEqual(response.headers["access-control-allow-origin"], "*", "should have Access-Control-Allow-Origin: *")
    assert.strictEqual(response.headers["access-control-allow-methods"], "POST, OPTIONS", "should have Access-Control-Allow-Methods")
    assert.strictEqual(response.headers["access-control-allow-headers"], "Content-Type", "should have Access-Control-Allow-Headers")
  })
  
  test("converts non-string message to string", async () => {
    await request("POST", "/clear")
    
    const response = await request("POST", "/yoink", {
      message: 12345,
      data: null
    })
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    
    await wait(50)
    
    const lines = getLogLines()
    const log = lines.map(l => JSON.parse(l)).find(l => l.message === "12345")
    
    assert.ok(log, "should have written the log with stringified message")
  })
})

