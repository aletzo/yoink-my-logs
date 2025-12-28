import { test, describe, before, after } from "node:test"
import assert from "node:assert"
import { setupTestDir, cleanupTestDir, getLastLog, getLogLines, wait } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

// Import yoink after setting up the test directory
const { default: yoink } = await import("../../index.js")

describe("array slicing methods", () => {
  before(() => {
    cleanupTestDir()
    setupTestDir()
  })
  
  after(() => {
    cleanupTestDir()
  })
  
  describe("yoink.first()", () => {
    test("logs only the first item of an array", async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      yoink.first(items, "first item test")
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { id: 1 })
      assert.strictEqual(log.message, "first item test")
    })
    
    test("returns first item even from large array", async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }))
      yoink.first(items)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { id: 1 })
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.first(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("returns undefined for empty array", async () => {
      yoink.first([])
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data, undefined)
    })
  })
  
  describe("yoink.last()", () => {
    test("logs only the last item of an array", async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      yoink.last(items, "last item test")
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { id: 3 })
      assert.strictEqual(log.message, "last item test")
    })
    
    test("returns last item from large array", async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }))
      yoink.last(items)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { id: 100 })
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.last(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("returns undefined for empty array", async () => {
      yoink.last([])
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data, undefined)
    })
  })
  
  describe("yoink.five()", () => {
    test("logs first 5 items of an array", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      yoink.five(items, "first five")
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 5)
      assert.deepStrictEqual(log.data, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }])
    })
    
    test("logs all items if array has fewer than 5", async () => {
      const items = [{ id: 1 }, { id: 2 }]
      yoink.five(items)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 2)
      assert.deepStrictEqual(log.data, [{ id: 1 }, { id: 2 }])
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.five(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("logs empty array for empty input", async () => {
      yoink.five([])
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [])
    })
  })
  
  describe("yoink.last.five()", () => {
    test("logs last 5 items of an array", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      yoink.last.five(items, "last five")
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 5)
      assert.deepStrictEqual(log.data, [{ id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }])
    })
    
    test("logs all items if array has fewer than 5", async () => {
      const items = [{ id: 1 }, { id: 2 }]
      yoink.last.five(items)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 2)
      assert.deepStrictEqual(log.data, [{ id: 1 }, { id: 2 }])
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.last.five(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("logs empty array for empty input", async () => {
      yoink.last.five([])
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [])
    })
  })
  
  describe("yoink.ten()", () => {
    test("logs first 10 items of an array", async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }))
      yoink.ten(items, "first ten")
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 10)
      assert.strictEqual(log.data[0].id, 1)
      assert.strictEqual(log.data[9].id, 10)
    })
    
    test("logs all items if array has fewer than 10", async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      yoink.ten(items)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 3)
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.ten(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("logs empty array for empty input", async () => {
      yoink.ten([])
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [])
    })
  })
  
  describe("yoink.last.ten()", () => {
    test("logs last 10 items of an array", async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }))
      yoink.last.ten(items, "last ten")
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 10)
      assert.strictEqual(log.data[0].id, 11)
      assert.strictEqual(log.data[9].id, 20)
    })
    
    test("logs all items if array has fewer than 10", async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      yoink.last.ten(items)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data.length, 3)
    })
    
    test("logs non-array data as-is", async () => {
      const obj = { name: "test" }
      yoink.last.ten(obj)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, { name: "test" })
    })
    
    test("logs empty array for empty input", async () => {
      yoink.last.ten([])
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [])
    })
  })
  
  describe("edge cases", () => {
    test("works with string arrays", async () => {
      const items = ["a", "b", "c", "d", "e", "f"]
      yoink.first(items)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data, "a")
    })
    
    test("works with number arrays", async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      yoink.five(items)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [1, 2, 3, 4, 5])
    })
    
    test("works with mixed arrays", async () => {
      const items = [1, "two", { three: 3 }, [4], null]
      yoink.five(items)
      await wait(50)
      
      const log = getLastLog()
      assert.deepStrictEqual(log.data, [1, "two", { three: 3 }, [4], null])
    })
    
    test("handles string data (not an array)", async () => {
      yoink.first("hello")
      await wait(50)
      
      const log = getLastLog()
      // String is treated as message, not data
      assert.strictEqual(log.message, "hello")
    })
    
    test("handles null data", async () => {
      yoink.first(null)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data, null)
    })
    
    test("handles undefined data", async () => {
      yoink.first(undefined)
      await wait(50)
      
      const log = getLastLog()
      assert.strictEqual(log.data, undefined)
    })
  })
})

