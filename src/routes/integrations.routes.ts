/**
 * Integrations Routes
 * Routes for platform connections and integrations
 */

import { Router } from 'express';
import { IntegrationsController } from '../controllers/integrations.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { generalRateLimit } from '../middleware/rate-limit.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../validators/common.validator';
import { 
  connectPlatformSchema,
  disconnectPlatformSchema,
  refreshTokensSchema,
  testConnectionSchema 
} from '../validators/integrations.validator';

const router = Router();
const integrationsController = new IntegrationsController();

// Apply rate limiting to all routes
router.use(generalRateLimit.middleware());

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route   GET /api/integrations/platforms
 * @desc    Get available platforms
 * @access  Private (ACCOUNT_READ permission required)
 */
router.get('/platforms', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_READ),
  integrationsController.getAvailablePlatforms
);

/**
 * @route   GET /api/integrations/connected
 * @desc    Get all connected platforms for the user
 * @access  Private (ACCOUNT_LIST permission required)
 */
router.get('/connected', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_LIST),
  integrationsController.getConnectedPlatforms
);

/**
 * @route   GET /api/integrations/:id
 * @desc    Get specific platform connection details
 * @access  Private (ACCOUNT_READ permission required)
 */
router.get('/:id', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_READ),
  integrationsController.getPlatformConnection
);

/**
 * @route   POST /api/integrations/connect
 * @desc    Initiate platform connection (OAuth flow)
 * @access  Private (ACCOUNT_CONNECT permission required)
 */
router.post('/connect', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_CONNECT),
  validate(connectPlatformSchema),
  integrationsController.initiateConnection
);

/**
 * @route   GET /api/integrations/callback
 * @desc    Handle OAuth callback
 * @access  Private (ACCOUNT_CONNECT permission required)
 */
router.get('/callback', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_CONNECT),
  integrationsController.handleCallback
);

/**
 * @route   DELETE /api/integrations/:id/disconnect
 * @desc    Disconnect a platform
 * @access  Private (ACCOUNT_DISCONNECT permission required)
 */
router.delete('/:id/disconnect', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_DISCONNECT),
  validate(disconnectPlatformSchema),
  integrationsController.disconnectPlatform
);

/**
 * @route   POST /api/integrations/:id/refresh
 * @desc    Refresh platform tokens
 * @access  Private (ACCOUNT_REFRESH_TOKEN permission required)
 */
router.post('/:id/refresh', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_REFRESH_TOKEN),
  validate(refreshTokensSchema),
  integrationsController.refreshTokens
);

/**
 * @route   POST /api/integrations/:id/test
 * @desc    Test platform connection
 * @access  Private (ACCOUNT_READ permission required)
 */
router.post('/:id/test', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_READ),
  validate(testConnectionSchema),
  integrationsController.testConnection
);

/**
 * @route   GET /api/integrations/:id/insights
 * @desc    Get platform insights and analytics
 * @access  Private (ANALYTICS_READ permission required)
 */
router.get('/:id/insights', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  integrationsController.getPlatformInsights
);

export default router;