import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import { setupTestDir, getLogLines, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

const TAG_TEST_PORT = 7344

describe("tag validation", () => {
  let server
  
  function request(body) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: TAG_TEST_PORT,
        path: "/yoink",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, (res) => {
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
      req.write(JSON.stringify(body))
      req.end()
    })
  }
  
  before(async () => {
    process.env.YOINK_PORT = TAG_TEST_PORT
    const serverModule = await import(`../../server.js?t=${Date.now() + 600}`)
    
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${TAG_TEST_PORT}`)
      
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
    
    await new Promise(resolve => server.listen(TAG_TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("accepts valid tag: info", async () => {
    const response = await request({ message: "test-info", tag: "info" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("accepts valid tag: success", async () => {
    const response = await request({ message: "test-success", tag: "success" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("accepts valid tag: warn", async () => {
    const response = await request({ message: "test-warn", tag: "warn" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("accepts valid tag: error", async () => {
    const response = await request({ message: "test-error", tag: "error" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("accepts valid tag: debug", async () => {
    const response = await request({ message: "test-debug", tag: "debug" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("accepts undefined tag", async () => {
    const response = await request({ message: "test-no-tag" })
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.success, true)
  })
  
  test("rejects invalid tag", async () => {
    const response = await request({ message: "test-invalid", tag: "invalid-tag" })
    
    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.data.success, false)
    assert.strictEqual(response.data.error, "Invalid tag")
  })
  
  test("rejects XSS attempt in tag", async () => {
    const response = await request({ message: "test-xss", tag: "<script>alert(1)</script>" })
    
    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.data.success, false)
  })
  
  test("rejects SQL injection attempt in tag", async () => {
    const response = await request({ message: "test-sql", tag: "'; DROP TABLE logs; --" })
    
    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.data.success, false)
  })
  
  test("stores valid tags correctly in log file", async () => {
    // Clear logs first
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: TAG_TEST_PORT,
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
    
    const testId = `tag-storage-${Date.now()}`
    await request({ message: testId, tag: "warn" })
    
    await wait(100)
    
    const lines = getLogLines()
    const log = lines.map(l => JSON.parse(l)).find(l => l.message === testId)
    
    assert.ok(log, "should have written the log")
    assert.strictEqual(log.tag, "warn", "should store the tag correctly")
  })
})

