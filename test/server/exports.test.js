import { test, describe } from "node:test"
import assert from "node:assert"

describe("server exports", () => {
  test("exports pushLog function", async () => {
    const server = await import(`../../server.js?t=${Date.now() + 40}`)
    assert.strictEqual(typeof server.pushLog, "function")
  })

  test("exports startServer function", async () => {
    const server = await import(`../../server.js?t=${Date.now() + 41}`)
    assert.strictEqual(typeof server.startServer, "function")
  })
})

