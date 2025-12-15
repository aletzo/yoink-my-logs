const DEFAULT_HOST = "localhost"
const DEFAULT_PORT = 7337

let host = DEFAULT_HOST
let port = DEFAULT_PORT

function getBaseUrl() {
  return `http://${host}:${port}`
}

function send(message, data, tag) {
  fetch(`${getBaseUrl()}/yoink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, data, tag })
  }).catch(() => {})
}

function yoink(message, data) {
  send(message, data, undefined)
}

yoink.info = (message, data) => send(message, data, "info")
yoink.warn = (message, data) => send(message, data, "warn")
yoink.error = (message, data) => send(message, data, "error")
yoink.debug = (message, data) => send(message, data, "debug")
yoink.success = (message, data) => send(message, data, "success")

yoink.init = (options = {}) => {
  if (options.host) host = options.host
  if (options.port) port = options.port
}

export default yoink
