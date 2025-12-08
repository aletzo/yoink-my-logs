import { test, describe } from "node:test"
import assert from "node:assert"
import { setupTestDir } from "../helpers.js"

// Set up temp directory before any imports
setupTestDir()

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
