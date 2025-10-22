/**
 * Analytics Routes
 * Routes for user login statistics and activity insights
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { generalRateLimit } from '../middleware/rate-limit.middleware';
import { canViewAnalytics } from '../middleware/guards/protected-routes.middleware';

const router = Router();

// Apply rate limiting to analytics routes
router.use(generalRateLimit.middleware());

/**
 * @route   GET /api/analytics/login-stats
 * @desc    Get user login statistics
 * @access  Private - Requires analytics permission
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/login-stats', canViewAnalytics, analyticsController.getUserLoginStats);

/**
 * @route   GET /api/analytics/login-activity
 * @desc    Get login activity by date range
 * @access  Private - Requires analytics permission
 * @query   startDate - Start date (ISO string)
 * @query   endDate - End date (ISO string)
 */
router.get('/login-activity', canViewAnalytics, analyticsController.getLoginActivity);

/**
 * @route   GET /api/analytics/device-analytics
 * @desc    Get device and browser analytics
 * @access  Private - Requires analytics permission
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/device-analytics', canViewAnalytics, analyticsController.getDeviceAnalytics);

/**
 * @route   GET /api/analytics/security-insights
 * @desc    Get security insights and suspicious login attempts
 * @access  Private - Requires analytics permission
 * @query   days - Number of days to analyze (default: 30)
 */
router.get('/security-insights', canViewAnalytics, analyticsController.getSecurityInsights);

export default router;