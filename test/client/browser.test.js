import { test, describe, beforeEach, afterEach } from "node:test"
import assert from "node:assert"

// Store captured fetch calls
let fetchCalls = []
let originalFetch

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

describe("browser module array slicing exports", () => {
  test("has first method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.first, "function", "yoink.first should be a function")
  })
  
  test("has five method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.five, "function", "yoink.five should be a function")
  })
  
  test("has ten method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.ten, "function", "yoink.ten should be a function")
  })
  
  test("has last method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.last, "function", "yoink.last should be a function")
  })
  
  test("has last.five method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.last.five, "function", "yoink.last.five should be a function")
  })
  
  test("has last.ten method", async () => {
    const yoink = (await import("../../browser.js")).default
    assert.strictEqual(typeof yoink.last.ten, "function", "yoink.last.ten should be a function")
  })
})

describe("browser module fetch behavior", () => {
  beforeEach(() => {
    fetchCalls = []
    originalFetch = globalThis.fetch
    globalThis.fetch = (url, options) => {
      fetchCalls.push({ url, options })
      return Promise.resolve({ ok: true })
    }
  })
  
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  
  test("yoink sends POST request to /yoink endpoint", async () => {
    // Fresh import to get clean module state
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink({ test: "data" }, "test message")
    
    // Wait a tick for async fetch
    await new Promise(r => setTimeout(r, 10))
    
    assert.strictEqual(fetchCalls.length, 1)
    assert.ok(fetchCalls[0].url.endsWith("/yoink"))
    assert.strictEqual(fetchCalls[0].options.method, "POST")
  })
  
  test("yoink sends correct payload structure", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink({ userId: 123 }, "user logged in")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.message, "user logged in")
    assert.deepStrictEqual(body.data, { userId: 123 })
    assert.strictEqual(body.tag, undefined)
  })
  
  test("yoink.info sends info tag", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.info({ data: 1 }, "info message")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.tag, "info")
  })
  
  test("yoink.warn sends warn tag", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.warn({ data: 1 }, "warn message")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.tag, "warn")
  })
  
  test("yoink.error sends error tag", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.error({ data: 1 }, "error message")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.tag, "error")
  })
  
  test("yoink.debug sends debug tag", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.debug({ data: 1 }, "debug message")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.tag, "debug")
  })
  
  test("yoink.success sends success tag", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.success({ data: 1 }, "success message")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.tag, "success")
  })
  
  test("init changes the endpoint URL", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "192.168.1.50", port: 9999 })
    
    yoink("test")
    
    await new Promise(r => setTimeout(r, 10))
    
    assert.ok(fetchCalls[0].url.includes("192.168.1.50"))
    assert.ok(fetchCalls[0].url.includes("9999"))
  })
})

describe("browser module argument parsing", () => {
  beforeEach(() => {
    fetchCalls = []
    originalFetch = globalThis.fetch
    globalThis.fetch = (url, options) => {
      fetchCalls.push({ url, options })
      return Promise.resolve({ ok: true })
    }
  })
  
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  
  test("single object argument is treated as data", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink({ foo: "bar" })
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, { foo: "bar" })
    assert.strictEqual(body.message, "")
  })
  
  test("single string argument is treated as message", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink("hello world")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.message, "hello world")
    assert.strictEqual(body.data, undefined)
  })
  
  test("two arguments: first is data, second is message", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink({ id: 42 }, "found item")
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, { id: 42 })
    assert.strictEqual(body.message, "found item")
  })
  
  test("second argument is converted to string", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink({ id: 1 }, 12345)
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.message, "12345")
  })
})

describe("browser module array slicing behavior", () => {
  beforeEach(() => {
    fetchCalls = []
    originalFetch = globalThis.fetch
    globalThis.fetch = (url, options) => {
      fetchCalls.push({ url, options })
      return Promise.resolve({ ok: true })
    }
  })
  
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  
  test("yoink.first sends only first array item", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.first([1, 2, 3, 4, 5])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data, 1)
  })
  
  test("yoink.last sends only last array item", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.last([1, 2, 3, 4, 5])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data, 5)
  })
  
  test("yoink.five sends first 5 items", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.five([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, [1, 2, 3, 4, 5])
  })
  
  test("yoink.ten sends first 10 items", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    const arr = Array.from({ length: 15 }, (_, i) => i + 1)
    yoink.ten(arr)
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data.length, 10)
    assert.deepStrictEqual(body.data, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
  
  test("yoink.last.five sends last 5 items", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.last.five([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, [6, 7, 8, 9, 10])
  })
  
  test("yoink.last.ten sends last 10 items", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    const arr = Array.from({ length: 15 }, (_, i) => i + 1)
    yoink.last.ten(arr)
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data.length, 10)
    assert.deepStrictEqual(body.data, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  })
  
  test("slicing methods pass through non-array data", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.first({ notAnArray: true })
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, { notAnArray: true })
  })
  
  test("yoink.first returns undefined for empty array", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.first([])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data, undefined)
  })
  
  test("yoink.last returns undefined for empty array", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.last([])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.strictEqual(body.data, undefined)
  })
  
  test("yoink.five returns empty array for empty input", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.five([])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, [])
  })
  
  test("slicing returns all items if fewer than requested", async () => {
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    yoink.ten([1, 2, 3])
    
    await new Promise(r => setTimeout(r, 10))
    
    const body = JSON.parse(fetchCalls[0].options.body)
    assert.deepStrictEqual(body.data, [1, 2, 3])
  })
})

describe("browser module fetch error handling", () => {
  beforeEach(() => {
    fetchCalls = []
    originalFetch = globalThis.fetch
  })
  
  afterEach(() => {
    globalThis.fetch = originalFetch
  })
  
  test("fetch errors are silently caught", async () => {
    globalThis.fetch = () => Promise.reject(new Error("Network error"))
    
    const module = await import("../../browser.js?v=" + Date.now())
    const yoink = module.default
    yoink.init({ host: "localhost", port: 7337 })
    
    // Should not throw
    assert.doesNotThrow(() => {
      yoink("this should not throw")
    })
    
    // Wait for promise to settle
    await new Promise(r => setTimeout(r, 20))
  })
})

