interface YoinkOptions {
  host?: string
  port?: number
}

interface Yoink {
  (message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
  success(message: string, data?: unknown): void
  init(options?: YoinkOptions): void
}

declare const yoink: Yoink

export default yoink
