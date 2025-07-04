export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.DEBUG;
  private context: string = '';

  constructor(context?: string) {
    this.context = context || '';
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const ctx = this.context ? `[${this.context}] ` : '';
    const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} ${level} ${ctx}${message}${dataStr}`;
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message));
      if (error) {
        console.error('Error details:', error);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      }
    }
  }
}

export const createLogger = (context?: string) => new Logger(context);
export const logger = new Logger('APP');