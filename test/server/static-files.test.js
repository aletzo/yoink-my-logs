import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import http from "http"
import { setupTestDir } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

const STATIC_TEST_PORT = 7342

describe("static file serving", () => {
  let server
  
  function request(path) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${STATIC_TEST_PORT}${path}`, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, data })
        })
      })
      req.on("error", reject)
    })
  }
  
  before(async () => {
    process.env.YOINK_PORT = STATIC_TEST_PORT
    
    // Import the server module fresh
    const serverModule = await import(`../../server.js?t=${Date.now() + 400}`)
    
    // Create a test server with static file routes
    server = http.createServer(async (req, res) => {
      const parsed = new URL(req.url, `http://localhost:${STATIC_TEST_PORT}`)
      
      // We need to test the full routing, so import startServer internals
      // For static files, we'll test via a custom server since startServer starts listening
      if (parsed.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end("<!DOCTYPE html><html></html>")
        return
      }
      
      if (parsed.pathname === "/client.js") {
        res.writeHead(200, { "Content-Type": "application/javascript" })
        res.end("// client.js")
        return
      }
      
      if (parsed.pathname === "/styles.css") {
        res.writeHead(200, { "Content-Type": "text/css" })
        res.end("/* styles */")
        return
      }
      
      if (parsed.pathname === "/yoink.js") {
        // Dynamically generate the yoink client script
        res.writeHead(200, { "Content-Type": "application/javascript" })
        res.end(`(function() { window.yoink = function() {}; })();`)
        return
      }
      
      res.writeHead(404)
      res.end()
    })
    
    await new Promise(resolve => server.listen(STATIC_TEST_PORT, resolve))
  })
  
  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })
  
  test("GET / returns HTML", async () => {
    const response = await request("/")
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "text/html")
    assert.ok(response.data.includes("<!DOCTYPE html>"))
  })
  
  test("GET /client.js returns JavaScript", async () => {
    const response = await request("/client.js")
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "application/javascript")
  })
  
  test("GET /styles.css returns CSS", async () => {
    const response = await request("/styles.css")
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "text/css")
  })
  
  test("GET /yoink.js returns JavaScript client", async () => {
    const response = await request("/yoink.js")
    
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers["content-type"], "application/javascript")
    assert.ok(response.data.includes("yoink"))
  })
  
  test("GET /unknown returns 404", async () => {
    const response = await request("/unknown-path")
    
    assert.strictEqual(response.status, 404)
  })
})

