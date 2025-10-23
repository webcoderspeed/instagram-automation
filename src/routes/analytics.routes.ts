/**
 * Analytics Routes
 * Routes for user login statistics and activity insights
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { generalRateLimit } from '../middleware/rate-limit.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// Apply rate limiting to analytics routes
router.use(generalRateLimit.middleware());

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route   GET /api/analytics/login-stats
 * @desc    Get user login statistics
 * @access  Private (ANALYTICS_READ permission required)
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/login-stats', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.getUserLoginStats
);

/**
 * @route   GET /api/analytics/login-activity
 * @desc    Get login activity by date range
 * @access  Private (ANALYTICS_READ permission required)
 * @query   startDate - Start date (ISO string)
 * @query   endDate - End date (ISO string)
 */
router.get('/login-activity', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.getLoginActivity
);

/**
 * @route   GET /api/analytics/device-analytics
 * @desc    Get device and browser analytics
 * @access  Private (ANALYTICS_READ permission required)
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/device-analytics', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.getDeviceAnalytics
);

/**
 * @route   GET /api/analytics/security-insights
 * @desc    Get security insights and suspicious login attempts
 * @access  Private (ANALYTICS_READ permission required)
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/security-insights', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.getSecurityInsights
);

export default router;