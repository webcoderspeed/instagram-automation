/**
 * Automation Routes
 * API routes for automation management
 */

import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { validate } from '../validators/common.validator';
import { createAutomationSchema, updateAutomationSchema } from '../validators/automation.validator';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const automationController = new AutomationController();

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route GET /api/automations
 * @desc Get all automations for user
 * @access Private (AUTOMATION_LIST permission required)
 */
router.get('/',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_LIST),
  automationController.getAutomations
);

/**
 * @route GET /api/automations/templates
 * @desc Get automation templates
 * @access Private (AUTOMATION_READ permission required)
 */
router.get('/templates',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_READ),
  automationController.getAutomationTemplates
);

/**
 * @route GET /api/automations/stats
 * @desc Get automation statistics overview
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/stats',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  automationController.getAutomationStats
);

/**
 * @route GET /api/automations/:id
 * @desc Get automation by ID
 * @access Private (AUTOMATION_READ permission required)
 */
router.get('/:id',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_READ),
  automationController.getAutomation
);

/**
 * @route POST /api/automations
 * @desc Create new automation
 * @access Private (AUTOMATION_CREATE permission required)
 */
router.post('/',
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
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_DELETE),
  automationController.deleteAutomation
);

/**
 * @route POST /api/automations/:id/start
 * @desc Start automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/start',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.startAutomation
);

/**
 * @route POST /api/automations/:id/stop
 * @desc Stop automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/stop',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.stopAutomation
);

/**
 * @route POST /api/automations/:id/pause
 * @desc Pause automation
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/pause',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.pauseAutomation
);

/**
 * @route POST /api/automations/:id/execute
 * @desc Execute automation manually
 * @access Private (AUTOMATION_EXECUTE permission required)
 */
router.post('/:id/execute',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_EXECUTE),
  automationController.executeAutomation
);

/**
 * @route GET /api/automations/:id/analytics
 * @desc Get automation analytics
 * @access Private (ANALYTICS_READ permission required)
 */
router.get('/:id/analytics',
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  automationController.getAutomationAnalytics
);

export default router;