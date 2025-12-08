import { test, describe } from "node:test"
import assert from "node:assert"

describe("index exports", () => {
  test("default export is the yoink function", async () => {
    const mod = await import(`../../index.js?t=${Date.now() + 42}`)
    assert.strictEqual(typeof mod.default, "function")
  })
})

