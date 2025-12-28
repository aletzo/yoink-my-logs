#!/usr/bin/env node

/**
 * Node.js Demo for yoink-my-logs
 * 
 * This demonstrates various logging scenarios you might encounter
 * in a real Node.js application.
 */

import yoink from "../index.js"

console.log("🚀 Starting yoink-my-logs Node.js demo...\n")

// Simulate an application startup
yoink.info({ port: 3000, env: "development" }, "Server starting")
yoink.info({ version: "1.0.0", nodeVersion: process.version }, "Application initialized")

// Simulate user actions
setTimeout(() => {
  yoink({ userId: 123, action: "login", ip: "192.168.1.1" }, "User logged in")
  yoink.success({ userId: 123, sessionId: "abc-123" }, "Session created")
}, 500)

// Simulate API requests
setTimeout(() => {
  yoink({ method: "GET", path: "/api/users", status: 200, duration: 45 }, "API request completed")
  yoink.debug({ query: { page: 1, limit: 10 }, cacheHit: true }, "Database query executed")
}, 1000)

// Simulate business logic
setTimeout(() => {
  yoink({ orderId: "ORD-001", items: 3, total: 99.99, currency: "USD" }, "Order processed")
  yoink.success({ orderId: "ORD-001", paymentId: "pay_123" }, "Payment successful")
}, 1500)

// Simulate warnings
setTimeout(() => {
  yoink.warn({ current: 85, limit: 100 }, "Rate limit approaching")
  yoink.warn({ endpoint: "/api/v1/users", suggestion: "Use /api/v2/users" }, "Deprecated endpoint used")
}, 2000)

// Simulate errors
setTimeout(() => {
  yoink.error({ code: "ETIMEDOUT", host: "api.example.com", retries: 3 }, "Connection timeout")
  yoink.error({ field: "email", value: "invalid-email", message: "Invalid email format" }, "Validation failed")
}, 2500)

// Complex nested data
setTimeout(() => {
  yoink.info({
    user: {
      id: 456,
      name: "Alice",
      email: "alice@example.com",
      preferences: {
        theme: "dark",
        notifications: true
      }
    },
    request: {
      method: "POST",
      path: "/api/orders",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer ***"
      },
      body: {
        items: [
          { sku: "PROD-001", quantity: 2, price: 29.99 },
          { sku: "PROD-002", quantity: 1, price: 19.99 }
        ]
      }
    },
    metadata: {
      source: "web",
      campaign: "summer-sale",
      timestamp: new Date().toISOString()
    }
  }, "Complex order creation")
}, 3000)

// Array data
setTimeout(() => {
  yoink.debug({ 
    cacheKeys: ["user:123", "user:456", "user:789"],
    evicted: ["user:123"],
    ttl: 3600
  }, "Cache operations")
}, 3500)

// Special values
setTimeout(() => {
  yoink.debug({ value: null, exists: false }, "Null value test")
  yoink.debug({ enabled: true, disabled: false }, "Boolean values")
  yoink.debug({ emptyString: "", emptyArray: [], emptyObject: {} }, "Empty structures")
}, 4000)

// Performance metrics
setTimeout(() => {
  yoink.info({
    operation: "database_query",
    duration: 123.45,
    rows: 150,
    memoryUsage: process.memoryUsage()
  }, "Performance metrics")
}, 4500)

// Final message
setTimeout(() => {
  console.log("\n✅ Demo complete! Check http://localhost:7337 to view the logs.\n")
  process.exit(0)
}, 5000)

