import { config } from './config.js';

const levels = ['debug', 'info', 'warn', 'error', 'silent'] as const;
type LogLevel = (typeof levels)[number];

const configuredLevel = levels.includes(config.logLevel as LogLevel) ? (config.logLevel as LogLevel) : 'info';
const configuredPriority = levels.indexOf(configuredLevel);

function shouldLog(level: Exclude<LogLevel, 'silent'>) {
  return configuredPriority <= levels.indexOf(level);
}

function write(level: Exclude<LogLevel, 'silent'>, message: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ? { metadata } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => write('debug', message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => write('info', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => write('warn', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => write('error', message, metadata),
};

export function errorMetadata(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: config.nodeEnv === 'production' ? undefined : error.stack,
    };
  }

  return { error };
}
