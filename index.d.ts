interface YoinkData {
  [key: string]: any;
}

declare function yoink(message: string | number | boolean | null, data?: YoinkData): void;

declare namespace yoink {
  function info(message: string | number | boolean | null, data?: YoinkData): void;
  function warn(message: string | number | boolean | null, data?: YoinkData): void;
  function error(message: string | number | boolean | null, data?: YoinkData): void;
  function debug(message: string | number | boolean | null, data?: YoinkData): void;
  function success(message: string | number | boolean | null, data?: YoinkData): void;
}

export default yoink;

