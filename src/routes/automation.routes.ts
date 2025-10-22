/**
 * Automation Routes
 * API routes for automation management
 */

import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/guards/protected-routes.middleware';
import { validate } from '../validators/common.validator';
import { createAutomationSchema, updateAutomationSchema } from '../validators/automation.validator';

const router = Router();
const automationController = new AutomationController();

// Apply authentication to all automation routes
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/automations
 * @desc Get all automations for user
 * @access Private
 */
router.get('/',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.getAutomations
);

/**
 * @route GET /api/automations/templates
 * @desc Get automation templates
 * @access Private
 */
router.get('/templates',
  createProtectedRoute('VERIFIED_USER'),
  automationController.getAutomationTemplates
);

/**
 * @route GET /api/automations/:id
 * @desc Get automation by ID
 * @access Private
 */
router.get('/:id',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.getAutomation
);

/**
 * @route POST /api/automations
 * @desc Create new automation
 * @access Private
 */
router.post('/',
  createProtectedRoute('CREATE_AUTOMATION'),
  validate(createAutomationSchema),
  automationController.createAutomation
);

/**
 * @route PUT /api/automations/:id
 * @desc Update automation
 * @access Private
 */
router.put('/:id',
  createProtectedRoute('AUTOMATION_MANAGER'),
  validate(updateAutomationSchema),
  automationController.updateAutomation
);

/**
 * @route DELETE /api/automations/:id
 * @desc Delete automation
 * @access Private
 */
router.delete('/:id',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.deleteAutomation
);

/**
 * @route POST /api/automations/:id/start
 * @desc Start/Resume automation
 * @access Private
 */
router.post('/:id/start',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.startAutomation
);

/**
 * @route POST /api/automations/:id/pause
 * @desc Pause automation
 * @access Private
 */
router.post('/:id/pause',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.pauseAutomation
);

/**
 * @route POST /api/automations/:id/stop
 * @desc Stop automation
 * @access Private
 */
router.post('/:id/stop',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.stopAutomation
);

/**
 * @route POST /api/automations/:id/execute
 * @desc Execute automation manually
 * @access Private
 */
router.post('/:id/execute',
  createProtectedRoute('AUTOMATION_MANAGER'),
  automationController.executeAutomation
);

/**
 * @route GET /api/automations/:id/analytics
 * @desc Get automation analytics
 * @access Private
 */
router.get('/:id/analytics',
  createProtectedRoute('ANALYTICS_ACCESS'),
  automationController.getAutomationAnalytics
);

/**
 * @route GET /api/automations/stats/overview
 * @desc Get automation statistics overview
 * @access Private
 */
router.get('/stats/overview',
  createProtectedRoute('ANALYTICS_ACCESS'),
  automationController.getAutomationStats
);

export default router;