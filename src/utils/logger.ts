export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function format(level: string, message: string): string {
  return `[${level}] ${message}`;
}

export const logger = {
  debug: (message: string) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(format("DEBUG", message));
    }
  },
  info: (message: string) => {
    if (currentLevel <= LogLevel.INFO) {
      console.log(format("INFO", message));
    }
  },
  warn: (message: string) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(format("WARN", message));
    }
  },
  error: (message: string) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(format("ERROR", message));
    }
  },
  success: (message: string) => {
    console.log(`✓ ${message}`);
  },
  title: (message: string) => {
    console.log(`\n${"=".repeat(50)}`);
    console.log(message);
    console.log(`${"=".repeat(50)}\n`);
  },
  table: (data: unknown[]) => {
    console.table(data);
  },
};
