/**
 * Dashboard Routes
 * API routes for dashboard analytics and data
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { createProtectedRoute } from '../middleware/role.middleware';
import { Permissions } from '../middleware/role.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication to all dashboard routes
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/dashboard/overview
 * @desc Get dashboard overview with key metrics
 * @access Private
 */
router.get('/overview', 
  createProtectedRoute('ANALYTICS_ACCESS'),
  dashboardController.getOverview
);

/**
 * @route GET /api/dashboard/analytics
 * @desc Get detailed analytics data
 * @access Private
 */
router.get('/analytics',
  createProtectedRoute('ANALYTICS_ACCESS'),
  dashboardController.getAnalytics
);

/**
 * @route GET /api/dashboard/content-calendar
 * @desc Get content calendar for specified month/year
 * @access Private
 */
router.get('/content-calendar',
  createProtectedRoute('CONTENT_MANAGER'),
  dashboardController.getContentCalendar
);

/**
 * @route GET /api/dashboard/recent-activity
 * @desc Get recent activity feed
 * @access Private
 */
router.get('/recent-activity',
  createProtectedRoute('VERIFIED_USER'),
  dashboardController.getRecentActivity
);

/**
 * @route GET /api/dashboard/insights
 * @desc Get insights and recommendations
 * @access Private
 */
router.get('/insights',
  createProtectedRoute('ANALYTICS_ACCESS'),
  dashboardController.getInsights
);

/**
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics using dashboard service
 * @access Private
 */
router.get('/stats',
  createProtectedRoute('ANALYTICS_ACCESS'),
  dashboardController.getComprehensiveStats
);

/**
 * @route GET /api/dashboard/analytics/detailed
 * @desc Get detailed analytics using dashboard service
 * @access Private
 */
router.get('/analytics/detailed',
  createProtectedRoute('ANALYTICS_ACCESS'),
  dashboardController.getDetailedAnalytics
);

/**
 * @route GET /api/dashboard/calendar/service
 * @desc Get content calendar using dashboard service
 * @access Private
 */
router.get('/calendar/service',
  createProtectedRoute('CONTENT_MANAGER'),
  dashboardController.getContentCalendarService
);

export default router;