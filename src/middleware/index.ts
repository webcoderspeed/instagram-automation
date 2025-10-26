/**
 * Middleware Exports
 * Centralized exports for all middleware functions
 */

// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from "./error.middleware";

// CORS middleware
export { getCorsOptions } from "./cors.middleware";

// Rate limiting middleware
export {
  generalRateLimit,
  authRateLimit,
  webhookRateLimit,
} from "./rate-limit.middleware";

// Authentication guards
export * from "./guards";

// Subscription middleware
export {
  requirePlan,
  requireFeature,
  checkUsageLimit,
  requireActiveSubscription,
  createSubscriptionProtectedRoute,
} from "./subscription.middleware";
