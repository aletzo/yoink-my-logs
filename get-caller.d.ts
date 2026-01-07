export interface CallerInfo {
  file: string;
  line: number;
  fullPath: string;
}

export function getCallerInfo(): CallerInfo | null;
