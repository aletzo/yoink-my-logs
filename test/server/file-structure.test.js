import { test, describe } from "node:test"
import assert from "node:assert"
import path from "path"
import os from "os"
import { setupTestDir, logDir, todayFile, getLogLines, getLastLog, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("log file structure", () => {
  test("logs are stored in temp test directory", () => {
    // Now using temp directory instead of ~/.yoink-my-logs/
    assert.ok(logDir.includes("yoink-test-logs"))
    assert.ok(logDir.startsWith(os.tmpdir()))
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
    const yoink = (await import(`../../index.js?t=${Date.now() + 30}`)).default
    yoink("structure test", { key: "value" })
    
    await wait(100)
    
    const log = getLastLog()
    assert.ok("message" in log, "should have message field")
    assert.ok("timestamp" in log, "should have timestamp field")
    assert.ok("data" in log, "should have data field when provided")
  })
})
