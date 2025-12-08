import { test, describe } from "node:test"
import assert from "node:assert"
import fs from "fs"
import path from "path"
import os from "os"

const logDir = path.join(os.homedir(), ".yoink-my-logs")

function todayFile() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return path.join(logDir, `${y}-${m}-${day}.log`)
}

function getLogLines() {
  try {
    const content = fs.readFileSync(todayFile(), "utf8")
    return content.trim().split("\n").filter(Boolean)
  } catch {
    return []
  }
}

function getLastLog() {
  const lines = getLogLines()
  return lines.length > 0 ? JSON.parse(lines[lines.length - 1]) : null
}

describe("yoink()", () => {
  test("writes a log entry with message and timestamp", async () => {
    const yoink = (await import(`./index.js?t=${Date.now()}`)).default
    const before = getLogLines().length
    
    yoink("test message " + Date.now())
    
    // Wait for async file write
    await new Promise(r => setTimeout(r, 100))
    
    const after = getLogLines().length
    assert.strictEqual(after, before + 1, "should add one log entry")
    
    const log = getLastLog()
    assert.ok(log.message.startsWith("test message"), "message should be logged")
    assert.ok(log.timestamp, "should have timestamp")
    assert.match(log.timestamp, /^\d{4}-\d{2}-\d{2}T/, "timestamp should be ISO format")
  })

  test("writes a log entry with data payload", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 1}`)).default
    const testData = { userId: 123, action: "click", nested: { foo: "bar" } }
    
    yoink("with data", testData)
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "with data")
    assert.deepStrictEqual(log.data, testData)
  })

  test("handles undefined data gracefully", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 2}`)).default
    
    yoink("no data")
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "no data")
    assert.strictEqual(log.data, undefined)
  })

  test("converts non-string messages to strings", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 3}`)).default
    
    yoink(42)
    await new Promise(r => setTimeout(r, 50))
    
    yoink(null)
    await new Promise(r => setTimeout(r, 50))
    
    yoink(true)
    await new Promise(r => setTimeout(r, 100))
    
    const lines = getLogLines()
    const messages = lines.map(l => JSON.parse(l).message)
    
    assert.ok(messages.includes("42"), "should convert number to string")
    assert.ok(messages.includes("null"), "should convert null to string")
    assert.ok(messages.includes("true"), "should convert boolean to string")
  })

  test("supports emojis in messages and data", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 4}`)).default
    
    yoink("🚀 Deploy started", { status: "✅", env: "🔥 production" })
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "🚀 Deploy started")
    assert.strictEqual(log.data.status, "✅")
    assert.strictEqual(log.data.env, "🔥 production")
  })
})

describe("yoink tags", () => {
  test("yoink() without tag has undefined tag", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 10}`)).default
    
    yoink("no tag message")
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "no tag message")
    assert.strictEqual(log.tag, undefined)
  })

  test("yoink.info() sets tag to info", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 11}`)).default
    
    yoink.info("info message", { detail: "test" })
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "info message")
    assert.strictEqual(log.tag, "info")
    assert.deepStrictEqual(log.data, { detail: "test" })
  })

  test("yoink.warn() sets tag to warn", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 12}`)).default
    
    yoink.warn("warning message")
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "warning message")
    assert.strictEqual(log.tag, "warn")
  })

  test("yoink.error() sets tag to error", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 13}`)).default
    
    yoink.error("error message", { code: 500 })
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "error message")
    assert.strictEqual(log.tag, "error")
    assert.deepStrictEqual(log.data, { code: 500 })
  })

  test("yoink.debug() sets tag to debug", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 14}`)).default
    
    yoink.debug("debug message")
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "debug message")
    assert.strictEqual(log.tag, "debug")
  })

  test("yoink.success() sets tag to success", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 15}`)).default
    
    yoink.success("success message")
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.strictEqual(log.message, "success message")
    assert.strictEqual(log.tag, "success")
  })
})

describe("pushLog()", () => {
  test("creates log directory if it does not exist", async () => {
    // Directory should exist after any yoink call
    const yoink = (await import(`./index.js?t=${Date.now() + 4}`)).default
    yoink("test")
    
    await new Promise(r => setTimeout(r, 100))
    
    assert.ok(fs.existsSync(logDir), "log directory should exist")
  })

  test("appends to existing log file", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 5}`)).default
    const before = getLogLines().length
    
    yoink("append1")
    yoink("append2")
    yoink("append3")
    
    await new Promise(r => setTimeout(r, 150))
    
    const after = getLogLines().length
    assert.strictEqual(after, before + 3, "should append 3 entries")
  })
})

describe("log file structure", () => {
  test("logs are stored in ~/.yoink-my-logs/", () => {
    assert.ok(logDir.includes(".yoink-my-logs"))
    assert.ok(logDir.startsWith(os.homedir()))
  })

  test("log filename is YYYY-MM-DD.log format", () => {
    const filename = path.basename(todayFile())
    assert.match(filename, /^\d{4}-\d{2}-\d{2}\.log$/)
  })

  test("each log line is valid JSON", async () => {
    const lines = getLogLines()
    
    for (const line of lines) {
      assert.doesNotThrow(() => JSON.parse(line), "each line should be valid JSON")
    }
  })

  test("log entries have required fields", async () => {
    const yoink = (await import(`./index.js?t=${Date.now() + 6}`)).default
    yoink("structure test", { key: "value" })
    
    await new Promise(r => setTimeout(r, 100))
    
    const log = getLastLog()
    assert.ok("message" in log, "should have message field")
    assert.ok("timestamp" in log, "should have timestamp field")
    assert.ok("data" in log, "should have data field when provided")
  })
})

describe("server exports", () => {
  test("exports pushLog function", async () => {
    const server = await import(`./server.js?t=${Date.now()}`)
    assert.strictEqual(typeof server.pushLog, "function")
  })

  test("exports startServer function", async () => {
    const server = await import(`./server.js?t=${Date.now() + 1}`)
    assert.strictEqual(typeof server.startServer, "function")
  })
})

describe("index exports", () => {
  test("default export is the yoink function", async () => {
    const mod = await import(`./index.js?t=${Date.now() + 7}`)
    assert.strictEqual(typeof mod.default, "function")
  })
})
