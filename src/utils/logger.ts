import chalk from "chalk";

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

export const logger = {
  debug: (message: string) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  },
  info: (message: string) => {
    if (currentLevel <= LogLevel.INFO) {
      console.log(chalk.cyan(`ℹ ${message}`));
    }
  },
  warn: (message: string) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(chalk.yellow(`⚠ ${message}`));
    }
  },
  error: (message: string) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(chalk.red(`✕ ${message}`));
    }
  },
  success: (message: string) => {
    console.log(chalk.green(`✓ ${message}`));
  },
  title: (message: string) => {
    const line = "═".repeat(50);
    console.log(chalk.cyan(`\n${line}\n${message}\n${line}\n`));
  },
  table: (data: unknown[]) => {
    console.table(data);
  },
  divider: (char: string = ".oOo.") => {
    const padding = Math.floor((process.stdout.columns || 80) / char.length);
    console.log(chalk.magenta(char.repeat(padding)));
  },
};
