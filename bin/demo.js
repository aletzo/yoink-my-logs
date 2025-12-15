#!/usr/bin/env node

import yoink from "../index.js"

console.log("Adding demo logs...\n")

// Data-only logs (single argument)
yoink({ userId: 123, action: "login", timestamp: Date.now() })
yoink({ cart: ["item1", "item2"], total: 99.99 })

// Data with message (data first, message second)
yoink({ userId: 123 }, "User signed in")
yoink({ amount: 49.99, currency: "USD" }, "Payment processed")

// Message-only (backward compatible)
yoink("Something happened")

// Tagged logs with data
yoink.info({ port: 3000, env: "development" }, "Server started")
yoink.info({ host: "localhost", db: "myapp" }, "Database connected")

yoink.success({ version: "1.2.3" }, "Deployment complete")
yoink.success({ total: 42, duration: "3.2s" }, "All tests passed")

yoink.warn({ current: 95, max: 100 }, "Rate limit approaching")
yoink.warn({ endpoint: "/v1/users", suggestion: "/v2/users" }, "Deprecated API used")

yoink.error({ code: "ETIMEDOUT", host: "api.example.com" }, "Connection failed")
yoink.error({ field: "email", message: "Invalid format" }, "Validation error")

yoink.debug({ method: "POST", path: "/api/data", body: { foo: "bar" } }, "Request payload")
yoink.debug({ key: "user:123", ttl: 3600 }, "Cache miss")

// Tagged logs data-only (no message)
yoink.info({ event: "startup", pid: process.pid })
yoink.debug({ memoryUsage: process.memoryUsage() })

// Emoji support
yoink({ status: "✅", env: "🔥 production" }, "🚀 Deploy started")
yoink.success("🎉 Feature launched!")
yoink.error({ stack: "Error at line 42" }, "💥 Something broke")

// Nested data
yoink.info({
  user: { id: 1, name: "Alice" },
  items: [{ sku: "A1", qty: 2 }, { sku: "B2", qty: 1 }],
  metadata: { source: "web", campaign: "summer-sale" }
}, "Complex payload")

// Data-only with arrays and objects
yoink([1, 2, 3, 4, 5])
yoink({ config: { debug: true, verbose: false, maxRetries: 3 } })

// Special values
yoink.debug({ value: null }, "Null value test")
yoink.debug({ enabled: true, disabled: false }, "Boolean test")

const port = process.env.YOINK_PORT || 7337
console.log(`✓ Added demo logs! Open http://localhost:${port} to view them.`)
