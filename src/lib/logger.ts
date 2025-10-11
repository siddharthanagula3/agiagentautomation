/**
 * Production-Safe Logger
 * Reduces console noise in production while maintaining debugging capabilities
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Special method for auth-related logs (always show in development)
  auth(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.info(`[AUTH] ${message}`, ...args);
    }
  }

  // Special method for app initialization (always show)
  app(message: string, ...args: unknown[]): void {
    console.info(`[APP] ${message}`, ...args);
  }
}

export const logger = new Logger();
export default logger;
