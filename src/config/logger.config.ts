/**
 * Logger Configuration
 * Winston logger configuration for structured logging
 */

import env from './env.config';

export interface LoggerConfig {
  level: string;
  format: {
    timestamp: boolean;
    colorize: boolean;
    json: boolean;
  };
  transports: {
    console: {
      enabled: boolean;
      level: string;
    };
    file: {
      enabled: boolean;
      level: string;
      filename: string;
      maxsize: number;
      maxFiles: number;
    };
    error: {
      enabled: boolean;
      level: string;
      filename: string;
      maxsize: number;
      maxFiles: number;
    };
  };
}

const loggerConfig: LoggerConfig = {
  level: env.LOG_LEVEL,
  format: {
    timestamp: true,
    colorize: env.NODE_ENV === 'development',
    json: env.NODE_ENV === 'production',
  },
  transports: {
    console: {
      enabled: true,
      level: env.LOG_LEVEL,
    },
    file: {
      enabled: env.NODE_ENV === 'production',
      level: 'info',
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    },
    error: {
      enabled: true,
      level: 'error',
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    },
  },
};

export default loggerConfig;