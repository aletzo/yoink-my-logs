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
})

