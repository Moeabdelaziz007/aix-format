import chalk from 'chalk';

/**
 * Structured logger for AIX Detective.
 * All audit-related logs are directed to stdout (console.log) to ensure consistent CLI behavior.
 * Errors that cause process termination are directed to stderr (console.error).
 */
export const logger = {
  // Logging methods (to stdout)
  info: (msg) => console.log(msg),
  success: (msg) => console.log(chalk.green(msg)),
  warn: (msg) => console.log(chalk.yellow(msg)),
  error: (msg) => console.log(chalk.red(msg)),
  header: (msg) => console.log(chalk.bold(msg)),
  cyan: (msg) => console.log(chalk.cyan(msg)),

  // Terminal errors (to stderr)
  fatal: (msg) => console.error(chalk.red(msg)),
};

/**
 * Style helpers that return chalk-formatted strings.
 * Useful for building complex log messages or banners.
 */
export const style = {
  green: (msg) => chalk.green(msg),
  red: (msg) => chalk.red(msg),
  yellow: (msg) => chalk.yellow(msg),
  bold: (msg) => chalk.bold(msg),
  cyan: (msg) => chalk.cyan(msg),
};

export default logger;
