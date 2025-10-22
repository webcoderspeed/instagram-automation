/**
 * Integrations Routes
 * API routes for platform connections and integrations
 */

import { Router } from 'express';
import { IntegrationsController } from '../controllers/integrations.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/guards/protected-routes.middleware';
import { validate } from '../validators/common.validator';
import { 
  connectPlatformSchema, 
  refreshTokensSchema, 
  testConnectionSchema, 
  disconnectPlatformSchema 
} from '../validators/integrations.validator';

const router = Router();
const integrationsController = new IntegrationsController();

// Apply authentication to all integration routes
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/integrations/platforms
 * @desc Get available platforms and connection status
 * @access Private
 */
router.get('/platforms',
  createProtectedRoute('VERIFIED_USER'),
  integrationsController.getAvailablePlatforms
);

/**
 * @route GET /api/integrations/connected
 * @desc Get all connected platforms for user
 * @access Private
 */
router.get('/connected',
  createProtectedRoute('INTEGRATION_MANAGER'),
  integrationsController.getConnectedPlatforms
);

/**
 * @route GET /api/integrations/:id
 * @desc Get platform connection by ID
 * @access Private
 */
router.get('/:id',
  createProtectedRoute('INTEGRATION_MANAGER'),
  integrationsController.getPlatformConnection
);

/**
 * @route POST /api/integrations/:platform/connect
 * @desc Initiate OAuth connection for platform
 * @access Private
 */
router.post('/:platform/connect',
  createProtectedRoute('CONNECT_ACCOUNT'),
  validate(connectPlatformSchema),
  integrationsController.initiateConnection
);

/**
 * @route GET /api/integrations/:platform/callback
 * @desc Handle OAuth callback and complete connection
 * @access Private
 */
router.get('/:platform/callback',
  createProtectedRoute('VERIFIED_USER'),
  integrationsController.handleCallback
);

/**
 * @route DELETE /api/integrations/:id/disconnect
 * @desc Disconnect platform account
 * @access Private
 */
router.delete('/:id/disconnect',
  createProtectedRoute('INTEGRATION_MANAGER'),
  validate(disconnectPlatformSchema),
  integrationsController.disconnectPlatform
);

/**
 * @route POST /api/integrations/:id/refresh
 * @desc Refresh platform tokens
 * @access Private
 */
router.post('/:id/refresh',
  createProtectedRoute('INTEGRATION_MANAGER'),
  validate(refreshTokensSchema),
  integrationsController.refreshTokens
);

/**
 * @route POST /api/integrations/:id/test
 * @desc Test platform connection
 * @access Private
 */
router.post('/:id/test',
  createProtectedRoute('INTEGRATION_MANAGER'),
  validate(testConnectionSchema),
  integrationsController.testConnection
);

/**
 * @route GET /api/integrations/:id/insights
 * @desc Get platform analytics/insights
 * @access Private
 */
router.get('/:id/insights',
  createProtectedRoute('ANALYTICS_ACCESS'),
  integrationsController.getPlatformInsights
);

export default router;