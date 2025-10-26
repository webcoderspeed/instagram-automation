import session from 'express-session';
import MongoStore from 'connect-mongo';
import env from './env.config';

export const sessionConfig: session.SessionOptions = {
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: env.DATABASE_URL,
    touchAfter: 24 * 3600, // lazy session update
  }),
  cookie: {
    secure: env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

// Simple session user interface
export interface SessionUser {
  id: string;
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

// Extend Express Session interface to include user
declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    isAuthenticated?: boolean;
  }
}