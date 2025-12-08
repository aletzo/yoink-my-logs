import fs from "fs"
import path from "path"
import os from "os"

// Use temp directory for tests, configurable via env var
export const logDir = process.env.YOINK_LOG_DIR || path.join(os.tmpdir(), "yoink-test-logs")

export function setupTestDir() {
  // Set env var before any imports of server.js
  process.env.YOINK_LOG_DIR = logDir
  
  // Create the test directory
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

export function cleanupTestDir() {
  // Remove all files in the test directory
  try {
    const files = fs.readdirSync(logDir)
    for (const file of files) {
      fs.unlinkSync(path.join(logDir, file))
    }
  } catch {
    // Directory might not exist
  }
}

export function teardownTestDir() {
  // Remove the entire test directory
  try {
    fs.rmSync(logDir, { recursive: true, force: true })
  } catch {
    // Directory might not exist
  }
}

export function todayPrefix() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayFile() {
  return path.join(logDir, `${todayPrefix()}.log`)
}

export function getTodayFiles() {
  const prefix = todayPrefix()
  try {
    const files = fs.readdirSync(logDir)
    return files
      .filter(f => f.startsWith(prefix) && f.endsWith(".log"))
      .sort((a, b) => {
        const getNum = (name) => {
          const match = name.match(/_(\d+)\.log$/)
          return match ? parseInt(match[1], 10) : 1
        }
        return getNum(a) - getNum(b)
      })
  } catch {
    return []
  }
}

export function getLogLines() {
  // Read from all of today's log files (handles rotation)
  const files = getTodayFiles()
  let allLines = []
  
  for (const fileName of files) {
    try {
      const content = fs.readFileSync(path.join(logDir, fileName), "utf8")
      const lines = content.trim().split("\n").filter(Boolean)
      allLines = allLines.concat(lines)
    } catch {
      // File doesn't exist or can't be read
    }
  }
  
  return allLines
}

export function getLastLog() {
  const lines = getLogLines()
  return lines.length > 0 ? JSON.parse(lines[lines.length - 1]) : null
}

export function cleanupRotatedFiles() {
  // Clean up any rotated test files (keep the main log file)
  const prefix = todayPrefix()
  try {
    const files = fs.readdirSync(logDir)
    for (const file of files) {
      if (file.startsWith(prefix) && file.includes("_") && file.endsWith(".log")) {
        fs.unlinkSync(path.join(logDir, file))
      }
    }
  } catch {
    // Directory might not exist
  }
}

export const wait = (ms) => new Promise(r => setTimeout(r, ms))
