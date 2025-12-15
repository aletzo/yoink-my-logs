import { test, describe } from "node:test"
import assert from "node:assert"

describe("browser module exports", () => {
  test("default export is the yoink function", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink, "function", "yoink should be a function")
  })
  
  test("has info method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.info, "function", "yoink.info should be a function")
  })
  
  test("has warn method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.warn, "function", "yoink.warn should be a function")
  })
  
  test("has error method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.error, "function", "yoink.error should be a function")
  })
  
  test("has debug method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.debug, "function", "yoink.debug should be a function")
  })
  
  test("has success method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.success, "function", "yoink.success should be a function")
  })
  
  test("has init method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.init, "function", "yoink.init should be a function")
  })
  
  test("init accepts port option", async () => {
    const yoink = (await import("../../browser.js")).default
    // Should not throw
    assert.doesNotThrow(() => {
      yoink.init({ port: 8080 })
    })
  })
  
  test("init accepts host option", async () => {
    const yoink = (await import("../../browser.js")).default
    // Should not throw
    assert.doesNotThrow(() => {
      yoink.init({ host: "192.168.1.100" })
    })
  })
  
  test("init accepts both host and port options", async () => {
    const yoink = (await import("../../browser.js")).default
    // Should not throw
    assert.doesNotThrow(() => {
      yoink.init({ host: "192.168.1.100", port: 8080 })
    })
  })
})

