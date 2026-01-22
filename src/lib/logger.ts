type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

export const logger: Logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, context));
    }
  },
  info: (message: string, context?: LogContext) => {
    console.info(formatMessage('info', message, context));
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(formatMessage('warn', message, context));
  },
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorMsg = error ? safeErrorMessage(error) : '';
    const fullContext = error ? { ...context, errorMessage: errorMsg } : context;
    console.error(formatMessage('error', message, fullContext));
  },
};

export function createRequestLogger(requestId: string, userId?: string): Logger {
  const baseContext: LogContext = { requestId, userId };
  
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: unknown, context?: LogContext) => 
      logger.error(message, error, { ...baseContext, ...context }),
  };
}
