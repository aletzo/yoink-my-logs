type YoinkData = unknown

// Single string: treated as message
// Single non-string: treated as data
// Two args: first is data, second is message
declare function yoink(message: string): void
declare function yoink(data: YoinkData): void
declare function yoink(data: YoinkData, message: string): void

declare namespace yoink {
  function info(message: string): void
  function info(data: YoinkData): void
  function info(data: YoinkData, message: string): void

  function warn(message: string): void
  function warn(data: YoinkData): void
  function warn(data: YoinkData, message: string): void

  function error(message: string): void
  function error(data: YoinkData): void
  function error(data: YoinkData, message: string): void

  function debug(message: string): void
  function debug(data: YoinkData): void
  function debug(data: YoinkData, message: string): void

  function success(message: string): void
  function success(data: YoinkData): void
  function success(data: YoinkData, message: string): void
}

export default yoink
