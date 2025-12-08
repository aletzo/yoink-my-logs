import { test, describe } from "node:test"
import assert from "node:assert"
import fs from "fs"
import { logDir, getLogLines, wait } from "../helpers.js"

describe("pushLog()", () => {
  test("creates log directory if it does not exist", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 20}`)).default
    yoink("test")
    
    await wait(100)
    
    assert.ok(fs.existsSync(logDir), "log directory should exist")
  })

  test("appends to existing log file", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 21}`)).default
    const before = getLogLines().length
    
    yoink("append1")
    yoink("append2")
    yoink("append3")
    
    await wait(150)
    
    const after = getLogLines().length
    assert.strictEqual(after, before + 3, "should append 3 entries")
  })

  test("logs are written in order when called rapidly", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 22}`)).default
    const testId = `order-test-${Date.now()}`
    
    // Write 10 logs rapidly with sequential numbers
    for (let i = 0; i < 10; i++) {
      yoink(`${testId}-${i}`, { index: i })
    }
    
    await wait(100)
    
    // Find our test logs and verify order
    const lines = getLogLines()
    const testLogs = lines
      .map(line => JSON.parse(line))
      .filter(log => log.message.startsWith(testId))
    
    assert.strictEqual(testLogs.length, 10, "should have 10 test logs")
    
    // Verify they are in correct order
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(testLogs[i].message, `${testId}-${i}`, `log ${i} should be in correct position`)
      assert.strictEqual(testLogs[i].data.index, i, `log ${i} should have correct index data`)
    }
  })

  test("logs maintain order across different tag types", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 23}`)).default
    const testId = `tags-order-${Date.now()}`
    
    // Write logs with different tags in a specific order
    yoink.info(`${testId}-0`, { step: 0 })
    yoink.warn(`${testId}-1`, { step: 1 })
    yoink.error(`${testId}-2`, { step: 2 })
    yoink.debug(`${testId}-3`, { step: 3 })
    yoink.success(`${testId}-4`, { step: 4 })
    yoink(`${testId}-5`, { step: 5 })
    
    await wait(100)
    
    const lines = getLogLines()
    const testLogs = lines
      .map(line => JSON.parse(line))
      .filter(log => log.message.startsWith(testId))
    
    assert.strictEqual(testLogs.length, 6, "should have 6 test logs")
    
    // Verify order and tags
    const expectedTags = ["info", "warn", "error", "debug", "success", undefined]
    for (let i = 0; i < 6; i++) {
      assert.strictEqual(testLogs[i].data.step, i, `log ${i} should be in correct position`)
      assert.strictEqual(testLogs[i].tag, expectedTags[i], `log ${i} should have correct tag`)
    }
  })

  test("logs with large data payloads maintain order", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 24}`)).default
    const testId = `large-data-order-${Date.now()}`
    
    // Create logs with varying payload sizes
    const payloads = [
      { size: "small", data: "x".repeat(100) },
      { size: "medium", data: "y".repeat(1000) },
      { size: "large", data: "z".repeat(10000) },
      { size: "small2", data: "a".repeat(50) },
      { size: "medium2", data: "b".repeat(5000) }
    ]
    
    for (let i = 0; i < payloads.length; i++) {
      yoink(`${testId}-${i}`, { index: i, payload: payloads[i] })
    }
    
    await wait(150)
    
    const lines = getLogLines()
    const testLogs = lines
      .map(line => JSON.parse(line))
      .filter(log => log.message.startsWith(testId))
    
    assert.strictEqual(testLogs.length, payloads.length, `should have ${payloads.length} test logs`)
    
    // Verify order is maintained despite different payload sizes
    for (let i = 0; i < payloads.length; i++) {
      assert.strictEqual(testLogs[i].data.index, i, `log ${i} should be in correct position`)
      assert.strictEqual(testLogs[i].data.payload.size, payloads[i].size, `log ${i} should have correct payload`)
    }
  })
})

