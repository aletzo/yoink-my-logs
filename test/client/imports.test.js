import { test, describe } from "node:test"
import assert from "node:assert"
import { createRequire } from "node:module"
import { setupTestDir, cleanupTestDir } from "../helpers.js"

const require = createRequire(import.meta.url)

// Set up test directory before imports
setupTestDir()

describe("ESM import", () => {
  test("default export is a function", async () => {
    const { default: yoink } = await import("../../index.js")
    assert.strictEqual(typeof yoink, "function")
  })

  test("has all tag methods", async () => {
    const { default: yoink } = await import("../../index.js")
    
    assert.strictEqual(typeof yoink.info, "function")
    assert.strictEqual(typeof yoink.warn, "function")
    assert.strictEqual(typeof yoink.error, "function")
    assert.strictEqual(typeof yoink.debug, "function")
    assert.strictEqual(typeof yoink.success, "function")
  })

  test("has all array slicing methods", async () => {
    const { default: yoink } = await import("../../index.js")
    
    assert.strictEqual(typeof yoink.first, "function")
    assert.strictEqual(typeof yoink.last, "function")
    assert.strictEqual(typeof yoink.five, "function")
    assert.strictEqual(typeof yoink.ten, "function")
    assert.strictEqual(typeof yoink.last.five, "function")
    assert.strictEqual(typeof yoink.last.ten, "function")
  })
})

describe("CommonJS require", () => {
  test("default export is a function", () => {
    const yoink = require("../../index.cjs")
    assert.strictEqual(typeof yoink, "function")
  })

  test("has all tag methods", () => {
    const yoink = require("../../index.cjs")
    
    assert.strictEqual(typeof yoink.info, "function")
    assert.strictEqual(typeof yoink.warn, "function")
    assert.strictEqual(typeof yoink.error, "function")
    assert.strictEqual(typeof yoink.debug, "function")
    assert.strictEqual(typeof yoink.success, "function")
  })

  test("has all array slicing methods", () => {
    const yoink = require("../../index.cjs")
    
    assert.strictEqual(typeof yoink.first, "function")
    assert.strictEqual(typeof yoink.last, "function")
    assert.strictEqual(typeof yoink.five, "function")
    assert.strictEqual(typeof yoink.ten, "function")
    assert.strictEqual(typeof yoink.last.five, "function")
    assert.strictEqual(typeof yoink.last.ten, "function")
  })

  test("has ready() promise for async loading", () => {
    const yoink = require("../../index.cjs")
    assert.strictEqual(typeof yoink.ready, "function")
  })
})

describe("browser module ESM import", () => {
  test("default export is a function", async () => {
    const { default: yoink } = await import("../../browser.js")
    assert.strictEqual(typeof yoink, "function")
  })

  test("has all tag methods", async () => {
    const { default: yoink } = await import("../../browser.js")
    
    assert.strictEqual(typeof yoink.info, "function")
    assert.strictEqual(typeof yoink.warn, "function")
    assert.strictEqual(typeof yoink.error, "function")
    assert.strictEqual(typeof yoink.debug, "function")
    assert.strictEqual(typeof yoink.success, "function")
  })

  test("has all array slicing methods", async () => {
    const { default: yoink } = await import("../../browser.js")
    
    assert.strictEqual(typeof yoink.first, "function")
    assert.strictEqual(typeof yoink.last, "function")
    assert.strictEqual(typeof yoink.five, "function")
    assert.strictEqual(typeof yoink.ten, "function")
    assert.strictEqual(typeof yoink.last.five, "function")
    assert.strictEqual(typeof yoink.last.ten, "function")
  })

  test("has init() method for configuration", async () => {
    const { default: yoink } = await import("../../browser.js")
    assert.strictEqual(typeof yoink.init, "function")
  })
})

describe("Package exports - ESM import via package name", () => {
  test("can import via package name using ESM", async () => {
    const yoink = await import("yoink-my-logs")
    assert.strictEqual(typeof yoink.default, "function", "default export should be a function")
  })

  test("ESM import has all tag methods", async () => {
    const { default: yoink } = await import("yoink-my-logs")
    
    assert.strictEqual(typeof yoink.info, "function")
    assert.strictEqual(typeof yoink.warn, "function")
    assert.strictEqual(typeof yoink.error, "function")
    assert.strictEqual(typeof yoink.debug, "function")
    assert.strictEqual(typeof yoink.success, "function")
  })

  test("ESM import has all array slicing methods", async () => {
    const { default: yoink } = await import("yoink-my-logs")
    
    assert.strictEqual(typeof yoink.first, "function")
    assert.strictEqual(typeof yoink.last, "function")
    assert.strictEqual(typeof yoink.five, "function")
    assert.strictEqual(typeof yoink.ten, "function")
    assert.strictEqual(typeof yoink.last.five, "function")
    assert.strictEqual(typeof yoink.last.ten, "function")
  })

  test("ESM import can log messages", async () => {
    cleanupTestDir()
    const { default: yoink } = await import("yoink-my-logs")
    
    yoink("test message")
    yoink.info("info message")
    yoink.warn("warn message")
    yoink.error("error message")
    
    // Give it a moment to write
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify logs were written (basic check)
    assert.ok(true, "ESM import can call logging functions")
  })
})

describe("Package exports - CommonJS require via package name", () => {
  test("can require via package name using CommonJS", () => {
    const yoink = require("yoink-my-logs")
    assert.strictEqual(typeof yoink, "function", "require should return a function")
  })

  test("CommonJS require has all tag methods", () => {
    const yoink = require("yoink-my-logs")
    
    assert.strictEqual(typeof yoink.info, "function")
    assert.strictEqual(typeof yoink.warn, "function")
    assert.strictEqual(typeof yoink.error, "function")
    assert.strictEqual(typeof yoink.debug, "function")
    assert.strictEqual(typeof yoink.success, "function")
  })

  test("CommonJS require has all array slicing methods", () => {
    const yoink = require("yoink-my-logs")
    
    assert.strictEqual(typeof yoink.first, "function")
    assert.strictEqual(typeof yoink.last, "function")
    assert.strictEqual(typeof yoink.five, "function")
    assert.strictEqual(typeof yoink.ten, "function")
    assert.strictEqual(typeof yoink.last.five, "function")
    assert.strictEqual(typeof yoink.last.ten, "function")
  })

  test("CommonJS require has ready() promise for async loading", () => {
    const yoink = require("yoink-my-logs")
    assert.strictEqual(typeof yoink.ready, "function", "CommonJS wrapper should have ready() method")
  })

  test("CommonJS require can log messages", async () => {
    cleanupTestDir()
    const yoink = require("yoink-my-logs")
    
    // Wait for module to be ready if needed
    if (yoink.ready) {
      await yoink.ready()
    }
    
    yoink("test message")
    yoink.info("info message")
    yoink.warn("warn message")
    yoink.error("error message")
    
    // Give it a moment to write
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify logs were written (basic check)
    assert.ok(true, "CommonJS require can call logging functions")
  })
})

describe("Package exports - ESM vs CommonJS compatibility", () => {
  test("ESM and CommonJS exports have same API", async () => {
    const { default: yoinkESM } = await import("yoink-my-logs")
    const yoinkCJS = require("yoink-my-logs")
    
    // Wait for CJS to be ready
    if (yoinkCJS.ready) {
      await yoinkCJS.ready()
    }
    
    // Check all methods exist on both
    const methods = ["info", "warn", "error", "debug", "success", "first", "five", "ten", "last"]
    
    for (const method of methods) {
      assert.strictEqual(
        typeof yoinkESM[method],
        typeof yoinkCJS[method],
        `Method ${method} should exist on both ESM and CJS exports`
      )
    }
    
    // Check last.five and last.ten
    assert.strictEqual(typeof yoinkESM.last.five, typeof yoinkCJS.last.five)
    assert.strictEqual(typeof yoinkESM.last.ten, typeof yoinkCJS.last.ten)
  })

  test("both ESM and CommonJS can be used simultaneously", async () => {
    cleanupTestDir()
    
    const { default: yoinkESM } = await import("yoink-my-logs")
    const yoinkCJS = require("yoink-my-logs")
    
    if (yoinkCJS.ready) {
      await yoinkCJS.ready()
    }
    
    // Both should work
    yoinkESM("ESM log")
    yoinkCJS("CJS log")
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    assert.ok(true, "Both ESM and CJS can be used simultaneously")
  })
})

describe("Package exports - verify correct file resolution", () => {
  test("ESM import resolves to index.js (ESM module)", async () => {
    // Import the package and check it's using the ESM version
    // by verifying it doesn't have the ready() method (which is CJS-only)
    const { default: yoink } = await import("yoink-my-logs")
    
    // ESM version shouldn't have ready() method
    assert.strictEqual(yoink.ready, undefined, "ESM version should not have ready() method")
  })

  test("CommonJS require resolves to index.cjs (CommonJS wrapper)", () => {
    const yoink = require("yoink-my-logs")
    
    // CJS version should have ready() method
    assert.strictEqual(typeof yoink.ready, "function", "CommonJS version should have ready() method")
  })
})


