/**
 * AIX Studio Unified Logger
 * Provides structured logging with levels and environment-based toggling.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
  }

  private format(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    return [`[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`, ...args];
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(...this.format('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(...this.format('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(...this.format('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(...this.format('error', message, ...args));
    }
  }
}

export const createLogger = (name: string) => new Logger(name);
export const logger = createLogger('AIX');
