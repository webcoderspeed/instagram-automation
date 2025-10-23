/**
 * Automation Routes
 * API routes for automation management
 */

import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/role.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validate } from '../validators/common.validator';
import { createAutomationSchema, updateAutomationSchema } from '../validators/automation.validator';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const automationController = new AutomationController();

// Apply authentication to all automation routes
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/automations
 * @desc Get all automations for user
 * @access Private (AUTOMATION_LIST permission required)
 */
router.get('/',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_LIST),
  automationController.getAutomations
);

/**
 * @route GET /api/automations/templates
 * @desc Get automation templates
 * @access Private (AUTOMATION_READ permission required)
 */
router.get('/templates',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_READ),
  automationController.getAutomationTemplates
);

/**
 * @route GET /api/automations/:id
 * @desc Get automation by ID
 * @access Private (AUTOMATION_READ permission required)
 */
router.get('/:id',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_READ),
  automationController.getAutomation
);

/**
 * @route POST /api/automations
 * @desc Create new automation
 * @access Private (AUTOMATION_CREATE permission required)
 */
router.post('/',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_CREATE),
  validate(createAutomationSchema),
  automationController.createAutomation
);

/**
 * @route PUT /api/automations/:id
 * @desc Update automation
 * @access Private (AUTOMATION_UPDATE permission required)
 */
router.put('/:id',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_UPDATE),
  validate(updateAutomationSchema),
  automationController.updateAutomation
);

/**
 * @route DELETE /api/automations/:id
 * @desc Delete automation
 * @access Private (AUTOMATION_DELETE permission required)
 */
router.delete('/:id',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_DELETE),
  automationController.deleteAutomation
);

/**
 * @route POST /api/automations/:id/start
 * @desc Start automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/start',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.startAutomation
);

/**
 * @route POST /api/automations/:id/pause
 * @desc Pause automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/pause',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.pauseAutomation
);

/**
 * @route POST /api/automations/:id/stop
 * @desc Stop automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/stop',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.stopAutomation
);

/**
 * @route POST /api/automations/:id/execute
 * @desc Execute automation manually
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/execute',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.executeAutomation
);

/**
 * @route GET /api/automations/:id/analytics
 * @desc Get automation analytics
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/:id/analytics',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  automationController.getAutomationAnalytics
);

/**
 * @route GET /api/automations/stats/overview
 * @desc Get automation statistics overview
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/stats/overview',
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  automationController.getAutomationStats
);

export default router;