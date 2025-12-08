import { test, describe } from "node:test"
import assert from "node:assert"
import { setupTestDir, getLogLines, getLastLog, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("yoink()", () => {
  test("writes a log entry with message and timestamp", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now()}`)).default
    const before = getLogLines().length
    
    yoink("test message " + Date.now())
    
    await wait(100)
    
    const after = getLogLines().length
    assert.strictEqual(after, before + 1, "should add one log entry")
    
    const log = getLastLog()
    assert.ok(log.message.startsWith("test message"), "message should be logged")
    assert.ok(log.timestamp, "should have timestamp")
    assert.match(log.timestamp, /^\d{4}-\d{2}-\d{2}T/, "timestamp should be ISO format")
  })

  test("writes a log entry with data payload", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 1}`)).default
    const testData = { userId: 123, action: "click", nested: { foo: "bar" } }
    
    yoink("with data", testData)
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "with data")
    assert.deepStrictEqual(log.data, testData)
  })

  test("handles undefined data gracefully", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 2}`)).default
    
    yoink("no data")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "no data")
    assert.strictEqual(log.data, undefined)
  })

  test("converts non-string messages to strings", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 3}`)).default
    
    yoink(42)
    await wait(50)
    
    yoink(null)
    await wait(50)
    
    yoink(true)
    await wait(100)
    
    const lines = getLogLines()
    const messages = lines.map(l => JSON.parse(l).message)
    
    assert.ok(messages.includes("42"), "should convert number to string")
    assert.ok(messages.includes("null"), "should convert null to string")
    assert.ok(messages.includes("true"), "should convert boolean to string")
  })

  test("supports emojis in messages and data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 4}`)).default
    
    yoink("🚀 Deploy started", { status: "✅", env: "🔥 production" })
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "🚀 Deploy started")
    assert.strictEqual(log.data.status, "✅")
    assert.strictEqual(log.data.env, "🔥 production")
  })
})
