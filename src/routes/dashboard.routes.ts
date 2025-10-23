/**
 * Dashboard Routes
 * API routes for dashboard analytics and data
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const dashboardController = new DashboardController();

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route GET /api/dashboard/overview
 * @desc Get dashboard overview with key metrics
 * @access Private (ANALYTICS_DASHBOARD permission required)
 */
router.get('/overview', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_DASHBOARD),
  dashboardController.getOverview
);

/**
 * @route GET /api/dashboard/analytics
 * @desc Get detailed analytics data
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/analytics',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  dashboardController.getAnalytics
);

/**
 * @route GET /api/dashboard/content-calendar
 * @desc Get content calendar for specified month/year
 * @access Private (POST_LIST permission required)
 */
router.get('/content-calendar',
  roleMiddleware.requirePermission(PERMISSIONS.POST_LIST),
  dashboardController.getContentCalendar
);

/**
 * @route GET /api/dashboard/recent-activity
 * @desc Get recent activity feed
 * @access Private (USER_READ permission required)
 */
router.get('/recent-activity',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  dashboardController.getRecentActivity
);

/**
 * @route GET /api/dashboard/insights
 * @desc Get insights and recommendations
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/insights',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  dashboardController.getInsights
);

/**
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics using dashboard service
 * @access Private (ANALYTICS_DASHBOARD permission required)
 */
router.get('/stats',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_DASHBOARD),
  dashboardController.getComprehensiveStats
);

/**
 * @route GET /api/dashboard/analytics/detailed
 * @desc Get detailed analytics using dashboard service
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/analytics/detailed',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  dashboardController.getDetailedAnalytics
);

/**
 * @route GET /api/dashboard/calendar/service
 * @desc Get content calendar using dashboard service
 * @access Private (POST_LIST permission required)
 */
router.get('/calendar/service',
  roleMiddleware.requirePermission(PERMISSIONS.POST_LIST),
  dashboardController.getContentCalendarService
);

export default router;