#!/usr/bin/env node

/**
 * Continuous Demo for yoink-my-logs
 * 
 * This script continuously generates logs every few seconds,
 * useful for testing the live streaming feature.
 * 
 * Press Ctrl+C to stop.
 */

import yoink from "../index.js"

console.log("🔄 Starting continuous logging demo...")
console.log("Press Ctrl+C to stop\n")

let counter = 0
let logTypes = ['info', 'success', 'warn', 'error', 'debug']

function generateLog() {
  counter++
  const type = logTypes[counter % logTypes.length]
  const timestamp = new Date().toISOString()
  
  const logData = {
    counter,
    timestamp,
    random: Math.random(),
    memory: process.memoryUsage().heapUsed,
    uptime: process.uptime()
  }

  switch (type) {
    case 'info':
      yoink.info(logData, `Info log #${counter}`)
      break
    case 'success':
      yoink.success(logData, `Success log #${counter}`)
      break
    case 'warn':
      yoink.warn(logData, `Warning log #${counter}`)
      break
    case 'error':
      yoink.error(logData, `Error log #${counter}`)
      break
    case 'debug':
      yoink.debug(logData, `Debug log #${counter}`)
      break
  }

  // Occasionally log complex nested data
  if (counter % 5 === 0) {
    yoink.info({
      batch: {
        number: counter,
        logs: Array.from({ length: 5 }, (_, i) => ({
          id: counter - 5 + i,
          type: logTypes[i],
          timestamp: new Date(Date.now() - (5 - i) * 1000).toISOString()
        }))
      },
      summary: {
        total: counter,
        byType: {
          info: Math.floor(counter / 5),
          success: Math.floor(counter / 5),
          warn: Math.floor(counter / 5),
          error: Math.floor(counter / 5),
          debug: Math.floor(counter / 5)
        }
      }
    }, `Batch summary #${Math.floor(counter / 5)}`)
  }
}

// Generate a log every 2 seconds
const interval = setInterval(generateLog, 2000)

// Generate initial log immediately
generateLog()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping continuous demo...')
  clearInterval(interval)
  yoink.info({ stopped: true, totalLogs: counter }, 'Continuous demo stopped')
  setTimeout(() => {
    console.log(`✅ Generated ${counter} logs total`)
    console.log('Check http://localhost:7337 to view them\n')
    process.exit(0)
  }, 500)
})

