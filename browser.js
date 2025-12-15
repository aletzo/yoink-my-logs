const DEFAULT_HOST = "localhost"
const DEFAULT_PORT = 7337

let host = DEFAULT_HOST
let port = DEFAULT_PORT

function getBaseUrl() {
  return `http://${host}:${port}`
}

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

function send(first, second, tag) {
  const { message, data } = parseArgs(first, second)
  fetch(`${getBaseUrl()}/yoink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, data, tag })
  }).catch(() => {})
}

function yoink(first, second) {
  send(first, second, undefined)
}

yoink.info = (first, second) => send(first, second, "info")
yoink.warn = (first, second) => send(first, second, "warn")
yoink.error = (first, second) => send(first, second, "error")
yoink.debug = (first, second) => send(first, second, "debug")
yoink.success = (first, second) => send(first, second, "success")

yoink.init = (options = {}) => {
  if (options.host) host = options.host
  if (options.port) port = options.port
}

export default yoink
