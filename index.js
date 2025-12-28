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

export default function yoink(first, second) {
  createLog(first, second, undefined)
}

yoink.info = (first, second) => createLog(first, second, "info")
yoink.warn = (first, second) => createLog(first, second, "warn")
yoink.error = (first, second) => createLog(first, second, "error")
yoink.debug = (first, second) => createLog(first, second, "debug")
yoink.success = (first, second) => createLog(first, second, "success")
