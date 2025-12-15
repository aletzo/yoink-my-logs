import { test, describe } from "node:test"
import assert from "node:assert"
import { setupTestDir, getLastLog, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("yoink tags", () => {
  test("yoink() without tag has undefined tag", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 10}`)).default
    
    yoink("no tag message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "no tag message")
    assert.strictEqual(log.tag, undefined)
  })

  test("yoink.info() sets tag to info", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 11}`)).default
    
    yoink.info({ detail: "test" }, "info message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "info message")
    assert.strictEqual(log.tag, "info")
    assert.deepStrictEqual(log.data, { detail: "test" })
  })

  test("yoink.warn() sets tag to warn", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 12}`)).default
    
    yoink.warn("warning message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "warning message")
    assert.strictEqual(log.tag, "warn")
  })

  test("yoink.error() sets tag to error", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 13}`)).default
    
    yoink.error({ code: 500 }, "error message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "error message")
    assert.strictEqual(log.tag, "error")
    assert.deepStrictEqual(log.data, { code: 500 })
  })

  test("yoink.debug() sets tag to debug", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 14}`)).default
    
    yoink.debug("debug message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "debug message")
    assert.strictEqual(log.tag, "debug")
  })

  test("yoink.success() sets tag to success", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 15}`)).default
    
    yoink.success("success message")
    
    await wait(100)
    
    const log = getLastLog()
    assert.strictEqual(log.message, "success message")
    assert.strictEqual(log.tag, "success")
  })
})
