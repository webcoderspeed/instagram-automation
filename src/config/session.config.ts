import session from 'express-session';
import MongoStore from 'connect-mongo';

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-super-secret-session-key';
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/instagram-automation';
const NODE_ENV = process.env.NODE_ENV || 'development';

export const sessionConfig: session.SessionOptions = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: DATABASE_URL,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 24 hours in seconds
    autoRemove: 'native',
  }),
  cookie: {
    secure: NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    sameSite: 'lax', // CSRF protection
  },
  name: 'instagram-automation.sid', // Custom session name
};

// Extend Express Session interface to include user
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
      permissions: string[];
    };
    isAuthenticated?: boolean;
  }
}