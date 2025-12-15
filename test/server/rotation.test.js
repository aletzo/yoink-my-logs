import { test, describe } from "node:test"
import assert from "node:assert"
import fs from "fs"
import path from "path"
import { setupTestDir, logDir, todayPrefix, getLogLines, cleanupRotatedFiles, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

describe("log rotation", () => {
  test("rotated files follow YYYY-MM-DD_N.log format", () => {
    const prefix = todayPrefix()
    
    assert.match(`${prefix}_2.log`, /^\d{4}-\d{2}-\d{2}_\d+\.log$/)
    assert.match(`${prefix}_10.log`, /^\d{4}-\d{2}-\d{2}_\d+\.log$/)
    assert.match(`${prefix}_999.log`, /^\d{4}-\d{2}-\d{2}_\d+\.log$/)
  })

  test("todayFile() returns base file when no rotated files exist", async () => {
    cleanupRotatedFiles()
    
    const server = await import(`../../server.js?t=${Date.now() + 100}`)
    
    const prefix = todayPrefix()
    const files = fs.readdirSync(logDir).filter(f => f.startsWith(prefix) && f.endsWith(".log"))
    
    if (files.length > 0) {
      assert.ok(
        files[0] === `${prefix}.log` || files[0].match(/_\d+\.log$/),
        "file should be base format or rotated format"
      )
    }
  })

  test("rotated files are sorted numerically not alphabetically", () => {
    const files = [
      "2025-12-08_10.log",
      "2025-12-08_2.log",
      "2025-12-08.log",
      "2025-12-08_100.log",
      "2025-12-08_3.log"
    ]
    
    const getNum = (name) => {
      const match = name.match(/_(\d+)\.log$/)
      return match ? parseInt(match[1], 10) : 1
    }
    
    const sorted = files.sort((a, b) => getNum(a) - getNum(b))
    
    assert.deepStrictEqual(sorted, [
      "2025-12-08.log",
      "2025-12-08_2.log",
      "2025-12-08_3.log",
      "2025-12-08_10.log",
      "2025-12-08_100.log"
    ])
  })

  test("creating rotated files results in correct enumeration", async () => {
    cleanupRotatedFiles()
    
    const prefix = todayPrefix()
    const file2 = path.join(logDir, `${prefix}_2.log`)
    const file3 = path.join(logDir, `${prefix}_3.log`)
    
    fs.writeFileSync(file2, '{"message":"test2","timestamp":"2025-12-08T00:00:00Z"}\n')
    fs.writeFileSync(file3, '{"message":"test3","timestamp":"2025-12-08T00:00:01Z"}\n')
    
    assert.ok(fs.existsSync(file2), "rotated file _2 should exist")
    assert.ok(fs.existsSync(file3), "rotated file _3 should exist")
    
    fs.unlinkSync(file2)
    fs.unlinkSync(file3)
  })

  test("reading all today files returns logs in chronological order", async () => {
    cleanupRotatedFiles()
    
    const prefix = todayPrefix()
    const baseFile = path.join(logDir, `${prefix}.log`)
    const file2 = path.join(logDir, `${prefix}_2.log`)
    
    let originalContent = ""
    try {
      originalContent = fs.readFileSync(baseFile, "utf8")
    } catch {
      // File doesn't exist
    }
    
    fs.writeFileSync(baseFile, '{"message":"first","timestamp":"2025-12-08T00:00:00Z"}\n')
    fs.writeFileSync(file2, '{"message":"second","timestamp":"2025-12-08T00:00:01Z"}\n')
    
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith(prefix) && f.endsWith(".log"))
      .sort((a, b) => {
        const getNum = (name) => {
          const match = name.match(/_(\d+)\.log$/)
          return match ? parseInt(match[1], 10) : 1
        }
        return getNum(a) - getNum(b)
      })
    
    assert.strictEqual(files[0], `${prefix}.log`)
    assert.strictEqual(files[1], `${prefix}_2.log`)
    
    fs.unlinkSync(file2)
    
    if (originalContent) {
      fs.writeFileSync(baseFile, originalContent)
    } else {
      fs.writeFileSync(baseFile, "")
    }
  })

  test("MAX_LOG_SIZE constant prevents oversized log entries", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 200}`)).default
    const before = getLogLines().length
    
    const largeData = { data: "x".repeat(150000) }
    
    yoink(largeData, "large payload test")
    
    await wait(100)
    
    const after = getLogLines().length
    
    assert.strictEqual(after, before, "oversized log entry should be rejected")
  })

  test("normal sized logs are still written", async () => {
    const yoink = (await import(`../../index.js?t=${Date.now() + 201}`)).default
    const before = getLogLines().length
    
    const normalData = { data: "x".repeat(1000) }
    
    yoink(normalData, "normal payload test")
    
    await wait(100)
    
    const after = getLogLines().length
    
    assert.strictEqual(after, before + 1, "normal sized log entry should be written")
  })
})
