import { pushLog } from "./server.js"
import { getCallerInfo } from "./get-caller.js"

function parseArgs(first, second) {
  // Two arguments: first is data, second is message
  if (second !== undefined) {
    return { message: String(second), data: first }
  }
  
  // Single string argument: treat as message
  if (typeof first === "string") {
    return { message: first, data: undefined }
  }
  
  // Single non-string argument: treat as data
  return { message: "", data: first }
}

function createLog(first, second, tag) {
  const { message, data } = parseArgs(first, second)
  const caller = getCallerInfo()
  const log = {
    message,
    data,
    tag,
    timestamp: new Date().toISOString()
  }
  
  if (caller) {
    log.location = {
      file: caller.file,
      line: caller.line
    }
  }
  
  pushLog(log)
}

// Helper to slice arrays - returns original data if not an array
function sliceArray(data, start, count) {
  if (!Array.isArray(data)) return data
  if (data.length === 0) return []
  return data.slice(start, start + count)
}

function sliceFromEnd(data, count) {
  if (!Array.isArray(data)) return data
  if (data.length === 0) return []
  return data.slice(-count)
}

function createSlicedLog(first, second, slicer) {
  const { message, data } = parseArgs(first, second)
  const slicedData = slicer(data)
  const caller = getCallerInfo()
  const log = {
    message,
    data: slicedData,
    tag: undefined,
    timestamp: new Date().toISOString()
  }
  
  if (caller) {
    log.location = {
      file: caller.file,
      line: caller.line
    }
  }
  
  pushLog(log)
}

export default function yoink(first, second) {
  createLog(first, second, undefined)
}

yoink.info = (first, second) => createLog(first, second, "info")
yoink.warn = (first, second) => createLog(first, second, "warn")
yoink.error = (first, second) => createLog(first, second, "error")
yoink.debug = (first, second) => createLog(first, second, "debug")
yoink.success = (first, second) => createLog(first, second, "success")

// Array slicing methods
yoink.first = (first, second) => createSlicedLog(first, second, data => {
  if (!Array.isArray(data)) return data
  if (data.length === 0) return undefined
  return data[0]
})
yoink.five = (first, second) => createSlicedLog(first, second, data => sliceArray(data, 0, 5))
yoink.ten = (first, second) => createSlicedLog(first, second, data => sliceArray(data, 0, 10))

// yoink.last is both a function and has .five() and .ten() methods
yoink.last = (first, second) => createSlicedLog(first, second, data => {
  if (!Array.isArray(data)) return data
  if (data.length === 0) return undefined
  return data[data.length - 1]
})
yoink.last.five = (first, second) => createSlicedLog(first, second, data => sliceFromEnd(data, 5))
yoink.last.ten = (first, second) => createSlicedLog(first, second, data => sliceFromEnd(data, 10))
