/**
 * Server Configuration
 * Express server and middleware configuration
 */

import env from './env.config';

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  bodyParser: {
    json: {
      limit: string;
    };
    urlencoded: {
      limit: string;
      extended: boolean;
    };
  };
  security: {
    helmet: boolean;
    compression: boolean;
  };
}

const serverConfig: ServerConfig = {
  port: env.PORT,
  host: '0.0.0.0',
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  bodyParser: {
    json: {
      limit: '10mb',
    },
    urlencoded: {
      limit: '10mb',
      extended: true,
    },
  },
  security: {
    helmet: true,
    compression: true,
  },
};

export default serverConfig;