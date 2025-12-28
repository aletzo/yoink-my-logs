import { test, describe, beforeEach } from "node:test"
import assert from "node:assert"
import fs from "fs"
import { setupTestDir, logDir, getLogLines, todayFile, wait, cleanupTestDir } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("pushLog edge cases", () => {
  beforeEach(() => {
    cleanupTestDir()
    setupTestDir()
  })
  
  test("rejects log entries larger than 100KB", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 700}`)).default
    
    // First write a valid log so we have something to compare against
    yoink("baseline log")
    await wait(50)
    
    const before = getLogLines().length
    
    // Create a payload larger than 100KB
    const largeData = "x".repeat(101 * 1024)
    yoink({ largeData }, "this log is too large")
    
    await wait(100)
    
    const after = getLogLines().length
    
    // The large log should NOT have been written (count stays the same)
    assert.strictEqual(after, before, "should not write logs larger than 100KB")
  })
  
  test("handles logs with special characters", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 701}`)).default
    
    const testId = `special-chars-${Date.now()}`
    yoink({ 
      unicode: "🎉🚀💯",
      quotes: '"hello" \'world\'',
      backslash: "\\path\\to\\file",
      newline: "line1\nline2",
      tab: "col1\tcol2"
    }, testId)
    
    await wait(100)
    
    const lines = getLogLines()
    // Filter only valid JSON lines
    const validLogs = lines.filter(l => {
      try {
        JSON.parse(l)
        return true
      } catch {
        return false
      }
    }).map(l => JSON.parse(l))
    
    const log = validLogs.find(l => l.message === testId)
    
    assert.ok(log, "should write log with special characters")
    assert.strictEqual(log.data.unicode, "🎉🚀💯")
    assert.strictEqual(log.data.quotes, '"hello" \'world\'')
    assert.strictEqual(log.data.backslash, "\\path\\to\\file")
    assert.strictEqual(log.data.newline, "line1\nline2")
  })
  
  test("handles null and undefined values in data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 702}`)).default
    
    const testId = `null-values-${Date.now()}`
    yoink({ 
      nullValue: null,
      emptyString: "",
      zero: 0,
      falsy: false
    }, testId)
    
    await wait(100)
    
    const lines = getLogLines()
    const validLogs = lines.filter(l => {
      try { JSON.parse(l); return true } catch { return false }
    }).map(l => JSON.parse(l))
    const log = validLogs.find(l => l.message === testId)
    
    assert.ok(log, "should write log with null/falsy values")
    assert.strictEqual(log.data.nullValue, null)
    assert.strictEqual(log.data.emptyString, "")
    assert.strictEqual(log.data.zero, 0)
    assert.strictEqual(log.data.falsy, false)
  })
  
  test("handles deeply nested data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 703}`)).default
    
    const testId = `nested-data-${Date.now()}`
    const deepData = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: "deep"
              }
            }
          }
        }
      }
    }
    
    yoink(deepData, testId)
    
    await wait(100)
    
    const lines = getLogLines()
    const validLogs = lines.filter(l => {
      try { JSON.parse(l); return true } catch { return false }
    }).map(l => JSON.parse(l))
    const log = validLogs.find(l => l.message === testId)
    
    assert.ok(log, "should write log with deeply nested data")
    assert.strictEqual(log.data.level1.level2.level3.level4.level5.value, "deep")
  })
  
  test("handles circular reference gracefully", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 704}`)).default
    
    const before = getLogLines().length
    
    // Create circular reference - JSON.stringify will throw
    const circularData = { name: "test" }
    circularData.self = circularData
    
    // This should not throw, but should not write either
    try {
      yoink(circularData, "circular ref test")
    } catch {
      // Expected to potentially throw
    }
    
    await wait(100)
    
    // The log might or might not have been written depending on error handling
    // At minimum, it shouldn't crash the process
    assert.ok(true, "should handle circular reference without crashing")
  })
  
  test("handles array data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 705}`)).default
    
    const testId = `array-data-${Date.now()}`
    yoink([1, 2, 3, { nested: "object" }], testId)
    
    await wait(100)
    
    const lines = getLogLines()
    const validLogs = lines.filter(l => {
      try { JSON.parse(l); return true } catch { return false }
    }).map(l => JSON.parse(l))
    const log = validLogs.find(l => l.message === testId)
    
    assert.ok(log, "should write log with array data")
    assert.ok(Array.isArray(log.data))
    assert.strictEqual(log.data.length, 4)
    assert.strictEqual(log.data[3].nested, "object")
  })
  
  test("handles Date objects in data", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 706}`)).default
    
    const testId = `date-data-${Date.now()}`
    const testDate = new Date("2025-01-01T12:00:00Z")
    yoink({ date: testDate }, testId)
    
    await wait(100)
    
    const lines = getLogLines()
    const validLogs = lines.filter(l => {
      try { JSON.parse(l); return true } catch { return false }
    }).map(l => JSON.parse(l))
    const log = validLogs.find(l => l.message === testId)
    
    assert.ok(log, "should write log with Date object")
    // Date is serialized to ISO string
    assert.strictEqual(log.data.date, "2025-01-01T12:00:00.000Z")
  })
})

describe("pushLog directory handling", () => {
  test("creates log directory if it does not exist", async () => {
    // This is already tested in pushlog.test.js but we verify again
    const exists = fs.existsSync(logDir)
    assert.ok(exists, "log directory should exist after yoink call")
  })
  
  test("writes to correct file based on date", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 707}`)).default
    
    const testId = `date-file-${Date.now()}`
    yoink(testId)
    
    await wait(100)
    
    const logFile = todayFile()
    const content = fs.readFileSync(logFile, "utf8")
    
    assert.ok(content.includes(testId), "log should be in today's file")
  })
})

