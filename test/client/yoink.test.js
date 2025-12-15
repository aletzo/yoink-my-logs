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
    
    yoink(testData, "with data")
    
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

  test("treats single non-string argument as data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 3}`)).default
    
    yoink({ userId: 123, action: "test" })
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "", "message should be empty")
    assert.deepStrictEqual(log.data, { userId: 123, action: "test" }, "should have data")
  })
  
  test("treats single string argument as message", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 31}`)).default
    
    yoink("just a message")
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "just a message", "should be message")
    assert.strictEqual(log.data, undefined, "data should be undefined")
  })
  
  test("two arguments: first is data, second is message", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 32}`)).default
    
    yoink({ foo: "bar" }, "my message")
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "my message")
    assert.deepStrictEqual(log.data, { foo: "bar" })
  })
  
  test("two arguments: converts non-string message to string", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 33}`)).default
    
    yoink({ count: 1 }, 42)
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "42", "should convert number to string")
    assert.deepStrictEqual(log.data, { count: 1 })
  })

  test("supports emojis in messages and data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 4}`)).default
    
    yoink({ status: "✅", env: "🔥 production" }, "🚀 Deploy started")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "🚀 Deploy started")
    assert.strictEqual(log.data.status, "✅")
    assert.strictEqual(log.data.env, "🔥 production")
  })
})
