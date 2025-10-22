/**
 * Middleware Exports
 * Centralized exports for all middleware functions
 */

// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler
} from './error.middleware';

// CORS middleware
export {
  corsMiddleware
} from './cors.middleware';

// Rate limiting middleware
export {
  generalRateLimit,
  authRateLimit,
  webhookRateLimit
} from './rate-limit.middleware';

// Authentication types and interfaces
export {
  AuthenticatedUser
} from '../types/user.types';

// Authentication guards
export * from './guards';