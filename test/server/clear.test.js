import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import fs from "fs"
import { setupTestDir, logDir, getLogLines, todayFile, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

const TEST_PORT = 7339
const DELETE_TEST_PORT = 7340

// Helper to make HTTP requests
function request(method, path, body = null, port = TEST_PORT) {
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
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    
    req.on("error", reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

describe("/clear endpoint", () => {
  let server
  
  before(async () => {
    // Start a test server
    process.env.YOINK_PORT = TEST_PORT
    const serverModule = await import(`../../server.js?t=${Date.now() + 100}`)
    
    // Create server manually for testing
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${TEST_PORT}`)
      
      if (parsed.pathname === "/clear" && req.method === "POST") {
        serverModule.clearTodayLogs(res)
        return
      }
      
      if (parsed.pathname === "/delete" && req.method === "POST") {
        serverModule.deleteLog(req, res)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("clears all logs from today's files", async () => {
    // First add some logs
    const yoink = (await import(`../../index.js?t=${Date.now() + 101}`)).default
    const testId = `clear-test-${Date.now()}`
    
    yoink(`${testId}-1`)
    yoink(`${testId}-2`)
    yoink(`${testId}-3`)
    
    await wait(100)
    
    // Verify logs were written
    const beforeLines = getLogLines()
    const beforeTestLogs = beforeLines.filter(line => line.includes(testId))
    assert.strictEqual(beforeTestLogs.length, 3, "should have 3 test logs before clearing")
    
    // Clear the logs
    const response = await request("POST", "/clear")
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, true, "should return success: true")
    
    // Verify logs were cleared
    const afterLines = getLogLines()
    assert.strictEqual(afterLines.length, 0, "should have no logs after clearing")
  })
  
  test("returns success even when no logs exist", async () => {
    // Clear again when already empty
    const response = await request("POST", "/clear")
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, true, "should return success: true")
  })
})

describe("/delete endpoint", () => {
  let server
  
  before(async () => {
    // Start a test server
    process.env.YOINK_PORT = DELETE_TEST_PORT
    const serverModule = await import(`../../server.js?t=${Date.now() + 200}`)
    
    server = http.createServer((req, res) => {
      const parsed = new URL(req.url, `http://localhost:${DELETE_TEST_PORT}`)
      
      if (parsed.pathname === "/clear" && req.method === "POST") {
        serverModule.clearTodayLogs(res)
        return
      }
      
      if (parsed.pathname === "/delete" && req.method === "POST") {
        serverModule.deleteLog(req, res)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(DELETE_TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("deletes a specific log entry by timestamp and message", async () => {
    // Clear existing logs first
    await request("POST", "/clear", null, DELETE_TEST_PORT)
    
    // Add some logs
    const yoink = (await import(`../../index.js?t=${Date.now() + 201}`)).default
    const testId = `delete-test-${Date.now()}`
    
    yoink(`${testId}-keep-1`)
    yoink(`${testId}-delete-me`)
    yoink(`${testId}-keep-2`)
    
    await wait(100)
    
    // Get the log we want to delete
    const lines = getLogLines()
    const logToDelete = lines
      .map(line => JSON.parse(line))
      .find(log => log.message === `${testId}-delete-me`)
    
    assert.ok(logToDelete, "should find the log to delete")
    
    // Delete the specific log
    const response = await request("POST", "/delete", {
      timestamp: logToDelete.timestamp,
      message: logToDelete.message
    }, DELETE_TEST_PORT)
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, true, "should return success: true")
    
    // Verify only the target log was deleted
    const afterLines = getLogLines()
    const afterLogs = afterLines.map(line => JSON.parse(line))
    
    assert.strictEqual(afterLogs.length, 2, "should have 2 logs remaining")
    assert.ok(afterLogs.some(log => log.message === `${testId}-keep-1`), "should keep first log")
    assert.ok(afterLogs.some(log => log.message === `${testId}-keep-2`), "should keep second log")
    assert.ok(!afterLogs.some(log => log.message === `${testId}-delete-me`), "should not have deleted log")
  })
  
  test("returns success: false when log is not found", async () => {
    const response = await request("POST", "/delete", {
      timestamp: "99:99:99",
      message: "non-existent-log-message"
    }, DELETE_TEST_PORT)
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, false, "should return success: false for non-existent log")
  })
  
  test("returns 400 when timestamp is missing", async () => {
    const response = await request("POST", "/delete", {
      message: "some-message"
    }, DELETE_TEST_PORT)
    
    assert.strictEqual(response.status, 400, "should return 400 status")
    assert.strictEqual(response.data.success, false, "should return success: false")
    assert.ok(response.data.error, "should return an error message")
  })
  
  test("returns 400 when message is missing", async () => {
    const response = await request("POST", "/delete", {
      timestamp: "12:34:56"
    }, DELETE_TEST_PORT)
    
    assert.strictEqual(response.status, 400, "should return 400 status")
    assert.strictEqual(response.data.success, false, "should return success: false")
    assert.ok(response.data.error, "should return an error message")
  })
  
  test("deletes only the first matching log when duplicates exist", async () => {
    // Clear existing logs first
    await request("POST", "/clear", null, DELETE_TEST_PORT)
    
    // We'll write directly to the file to create duplicates with same timestamp/message
    const logFile = todayFile()
    const timestamp = "00:00:00"
    const message = "duplicate-log"
    
    const logEntry = JSON.stringify({ timestamp, message }) + "\n"
    fs.appendFileSync(logFile, logEntry)
    fs.appendFileSync(logFile, logEntry)
    fs.appendFileSync(logFile, logEntry)
    
    await wait(50)
    
    // Verify we have 3 duplicates
    const beforeLines = getLogLines()
    assert.strictEqual(beforeLines.length, 3, "should have 3 duplicate logs")
    
    // Delete one
    const response = await request("POST", "/delete", { timestamp, message }, DELETE_TEST_PORT)
    
    assert.strictEqual(response.status, 200, "should return 200 status")
    assert.strictEqual(response.data.success, true, "should return success: true")
    
    // Should have 2 remaining (only first match deleted)
    const afterLines = getLogLines()
    assert.strictEqual(afterLines.length, 2, "should have 2 logs remaining after deleting one duplicate")
  })
})
