import { Router } from 'express';
import { PlatformAccountController } from '../controllers/platform-account.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();
const platformAccountController = new PlatformAccountController();

// Validation schemas
const updateAccountSchema = z.object({
  settings: z.object({
    autoReply: z.boolean().optional(),
    notifications: z.boolean().optional(),
    privacy: z.object({
      showProfile: z.boolean().optional(),
      allowMessages: z.boolean().optional()
    }).optional()
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate.bind(authMiddleware));

/**
 * @route GET /api/platform-accounts
 * @desc Get all connected platform accounts for the authenticated user
 * @access Private
 */
router.get('/', platformAccountController.getAccounts.bind(platformAccountController));

/**
 * @route GET /api/platform-accounts/:accountId
 * @desc Get specific platform account details
 * @access Private
 */
router.get('/:accountId', platformAccountController.getAccount.bind(platformAccountController));

/**
 * @route POST /api/platform-accounts/:accountId/refresh
 * @desc Refresh platform account data (fetch latest profile info)
 * @access Private
 */
router.post('/:accountId/refresh', platformAccountController.refreshAccount.bind(platformAccountController));

/**
 * @route PUT /api/platform-accounts/:accountId
 * @desc Update platform account settings
 * @access Private
 */
router.put(
  '/:accountId',
  validateRequest({ body: updateAccountSchema }),
  platformAccountController.updateAccount.bind(platformAccountController)
);

/**
 * @route DELETE /api/platform-accounts/:accountId
 * @desc Soft delete (disconnect) platform account
 * @access Private
 */
router.delete('/:accountId', platformAccountController.deleteAccount.bind(platformAccountController));

/**
 * @route GET /api/platform-accounts/:accountId/stats
 * @desc Get platform account statistics
 * @access Private
 */
router.get('/:accountId/stats', platformAccountController.getAccountStats.bind(platformAccountController));

export default router;