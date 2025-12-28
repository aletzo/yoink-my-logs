interface YoinkOptions {
  host?: string
  port?: number
}

type YoinkData = unknown

interface YoinkLast {
  (data: YoinkData): void
  (data: YoinkData, message: string): void
  five(data: YoinkData): void
  five(data: YoinkData, message: string): void
  ten(data: YoinkData): void
  ten(data: YoinkData, message: string): void
}

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

  // Array slicing methods - log only first/last items from arrays
  first(data: YoinkData): void
  first(data: YoinkData, message: string): void

  five(data: YoinkData): void
  five(data: YoinkData, message: string): void

  ten(data: YoinkData): void
  ten(data: YoinkData, message: string): void

  // yoink.last() and yoink.last.five() / yoink.last.ten()
  last: YoinkLast

  init(options?: YoinkOptions): void
}

declare const yoink: Yoink

export default yoink
