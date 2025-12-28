import { test, describe } from "node:test"
import assert from "node:assert"
import { setupTestDir, getLastLog, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("location tracking (server-side)", () => {
  test("log entry includes location with file and line", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 100}`)).default
    
    yoink("location test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "log should have location")
    assert.ok(log.location.file, "location should have file")
    assert.ok(typeof log.location.line === "number", "location should have line number")
    assert.ok(log.location.line > 0, "line number should be positive")
  })

  test("location.file contains the test filename", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 101}`)).default
    
    yoink("file test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location.file.includes("location.test.js"), 
      `file should include 'location.test.js', got: ${log.location.file}`)
  })

  test("tagged methods also include location", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 102}`)).default
    
    yoink.info({ test: true }, "info location test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "info log should have location")
    assert.ok(log.location.file.includes("location.test.js"))
  })

  test("yoink.warn includes location", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 103}`)).default
    
    yoink.warn("warn test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "warn log should have location")
  })

  test("yoink.error includes location", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 104}`)).default
    
    yoink.error("error test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "error log should have location")
  })

  test("yoink.debug includes location", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 105}`)).default
    
    yoink.debug("debug test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "debug log should have location")
  })

  test("yoink.success includes location", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 106}`)).default
    
    yoink.success("success test")
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "success log should have location")
  })

  test("location line number is a reasonable positive integer", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 107}`)).default
    
    yoink("line number test")
    
    await wait(100)
    
    const log = getLastLog()
    // Line number should be a reasonable positive integer
    // We can't predict exact line numbers, but they should be within test file range
    assert.ok(log.location.line > 0, "line should be positive")
    assert.ok(log.location.line < 200, "line should be within test file range")
    assert.strictEqual(typeof log.location.line, "number", "line should be a number")
  })

  test("location is present with data-only logs", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 108}`)).default
    
    yoink({ userId: 123, action: "test" })
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "data-only log should have location")
    assert.ok(log.location.file)
    assert.ok(log.location.line > 0)
  })

  test("location is present with nested function calls", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 109}`)).default
    
    function nestedFunction() {
      yoink("nested call")
    }
    
    nestedFunction()
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok(log.location, "nested call should have location")
    // The location should point to where yoink was called inside nestedFunction
    assert.ok(log.location.file.includes("location.test.js"))
  })
})

