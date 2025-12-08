#!/usr/bin/env node

import yoink from "../index.js"

console.log("Adding demo logs...\n")

// Basic logs
yoink("User signed in", { userId: 123 })
yoink("Payment processed", { amount: 49.99, currency: "USD" })
yoink("Something happened")

// Tagged logs
yoink.info("Server started", { port: 3000, env: "development" })
yoink.info("Database connected", { host: "localhost", db: "myapp" })

yoink.success("Deployment complete", { version: "1.2.3" })
yoink.success("All tests passed", { total: 42, duration: "3.2s" })

yoink.warn("Rate limit approaching", { current: 95, max: 100 })
yoink.warn("Deprecated API used", { endpoint: "/v1/users", suggestion: "/v2/users" })

yoink.error("Connection failed", { code: "ETIMEDOUT", host: "api.example.com" })
yoink.error("Validation error", { field: "email", message: "Invalid format" })

yoink.debug("Request payload", { method: "POST", path: "/api/data", body: { foo: "bar" } })
yoink.debug("Cache miss", { key: "user:123", ttl: 3600 })

// Emoji support
yoink("🚀 Deploy started", { status: "✅", env: "🔥 production" })
yoink.success("🎉 Feature launched!")
yoink.error("💥 Something broke", { stack: "Error at line 42" })

// Nested data
yoink.info("Complex payload", {
  user: { id: 1, name: "Alice" },
  items: [{ sku: "A1", qty: 2 }, { sku: "B2", qty: 1 }],
  metadata: { source: "web", campaign: "summer-sale" }
})

// Numbers and special values
yoink(42)
yoink.debug("Null value test", { value: null })
yoink.debug("Boolean test", { enabled: true, disabled: false })

const port = process.env.YOINK_PORT || 7337
console.log(`✓ Added demo logs! Open http://localhost:${port} to view them.`)

