import { test, describe } from "node:test"
import assert from "node:assert"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

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

