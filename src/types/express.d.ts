/**
 * Express module augmentation
 * Extends the built-in Express Request interface
 */

import { AuthenticatedUser } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
      validatedData?: any;
      subscription?: {
        tier: string;
        limits: any;
      };
    }
  }
}