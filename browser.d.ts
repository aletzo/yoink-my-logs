interface YoinkOptions {
  host?: string
  port?: number
}

type YoinkData = unknown

interface Yoink {
  // Single string: treated as message
  // Single non-string: treated as data
  // Two args: first is data, second is message
  (message: string): void
  (data: YoinkData): void
  (data: YoinkData, message: string): void

  info(message: string): void
  info(data: YoinkData): void
  info(data: YoinkData, message: string): void

  warn(message: string): void
  warn(data: YoinkData): void
  warn(data: YoinkData, message: string): void

  error(message: string): void
  error(data: YoinkData): void
  error(data: YoinkData, message: string): void

  debug(message: string): void
  debug(data: YoinkData): void
  debug(data: YoinkData, message: string): void

  success(message: string): void
  success(data: YoinkData): void
  success(data: YoinkData, message: string): void

  init(options?: YoinkOptions): void
}

declare const yoink: Yoink

export default yoink
