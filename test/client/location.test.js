import { test, describe } from "node:test"
import assert from "node:assert"
import { getCallerInfo } from "../../get-caller.js"

describe("getCallerInfo()", () => {
  test("returns an object with file and line", () => {
    const result = getCallerInfo()
    
    assert.ok(result, "should return a result")
    assert.ok(result.file, "should have file")
    assert.ok(typeof result.line === "number", "should have numeric line")
    assert.ok(result.fullPath, "should have fullPath")
  })

  test("file contains test filename", () => {
    const result = getCallerInfo()
    
    assert.ok(result.file.includes("location.test.js"), 
      `file should include 'location.test.js', got: ${result.file}`)
  })

  test("line number is positive", () => {
    const result = getCallerInfo()
    
    assert.ok(result.line > 0, `line should be positive, got: ${result.line}`)
  })

  test("fullPath contains absolute path", () => {
    const result = getCallerInfo()
    
    // In Node.js, fullPath should contain "file://" or an absolute path
    assert.ok(
      result.fullPath.includes("file://") || 
      result.fullPath.startsWith("/") ||
      result.fullPath.includes(":\\"), // Windows
      `fullPath should be an absolute path, got: ${result.fullPath}`
    )
  })

  test("returns correct line when called from different lines", () => {
    const line1Result = getCallerInfo() // Line 37
    
    // Some spacing
    
    const line2Result = getCallerInfo() // Line 41
    
    // The line numbers should be different
    assert.ok(line2Result.line > line1Result.line,
      `second call should have higher line number: ${line1Result.line} vs ${line2Result.line}`)
  })

  test("works when called from nested function", () => {
    function innerFunction() {
      return getCallerInfo()
    }
    
    const result = innerFunction()
    
    assert.ok(result, "should return result from nested function")
    assert.ok(result.file.includes("location.test.js"))
    assert.ok(result.line > 0)
  })

  test("works when called from arrow function", () => {
    const arrowFn = () => getCallerInfo()
    
    const result = arrowFn()
    
    assert.ok(result, "should return result from arrow function")
    assert.ok(result.file.includes("location.test.js"))
  })

  test("works when called from async function", async () => {
    async function asyncFn() {
      return getCallerInfo()
    }
    
    const result = await asyncFn()
    
    assert.ok(result, "should return result from async function")
    assert.ok(result.file.includes("location.test.js"))
  })

  test("file shows short path (last 2 parts)", () => {
    const result = getCallerInfo()
    
    // File should show something like "client/location.test.js" not full path
    const parts = result.file.split("/")
    assert.ok(parts.length <= 2, `file should show at most 2 path parts, got: ${result.file}`)
  })
})

describe("getCallerInfo() URL handling", () => {
  test("handles file:// URLs correctly", () => {
    // This tests that the function works with Node.js file:// URLs
    const result = getCallerInfo()
    
    // In Node.js, the fullPath should be a file:// URL
    if (result.fullPath.startsWith("file://")) {
      // The short path should not include "file://"
      assert.ok(!result.file.includes("file://"), 
        `short path should not include file://, got: ${result.file}`)
    }
  })
})

describe("browser module location tracking", () => {
  test("browser module exports getCallerInfo internally", async () => {
    // We can't directly test the internal getCallerInfo, but we can verify
    // the module has the right structure
    const browserModule = await import("../../browser.js")
    const yoink = browserModule.default
    
    assert.strictEqual(typeof yoink, "function", "yoink should be a function")
    assert.strictEqual(typeof yoink.info, "function", "yoink.info should be a function")
  })
})

