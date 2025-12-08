import { pushLog } from "./server.js"

function createLog(message, data, tag) {
  const log = {
    message: String(message),
    data,
    tag,
    timestamp: new Date().toISOString()
  }
  pushLog(log)
}

export default function yoink(message, data) {
  createLog(message, data, undefined)
}

yoink.info = (message, data) => createLog(message, data, "info")
yoink.warn = (message, data) => createLog(message, data, "warn")
yoink.error = (message, data) => createLog(message, data, "error")
yoink.debug = (message, data) => createLog(message, data, "debug")
yoink.success = (message, data) => createLog(message, data, "success")

