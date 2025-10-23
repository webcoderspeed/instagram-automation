import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/role.middleware';
import { validate } from '../validators/common.validator';
import { 
  verifyWebhookSchema, 
  instagramWebhookSchema, 
  subscribeWebhookSchema 
} from '../validators/webhook.validator';

const router = Router();
const webhookController = new WebhookController();

// Webhook routes (verification doesn't need auth)
router.get('/instagram', 
  validate(verifyWebhookSchema),
  webhookController.verifyWebhook
);

// Instagram webhook handler (no auth needed for external webhooks)
router.post('/instagram', 
  validate(instagramWebhookSchema),
  webhookController.handleWebhook
);

// Protected routes require authentication
router.post('/subscribe', 
  authMiddleware.authenticate,
  createProtectedRoute('INTEGRATION_MANAGER'),
  validate(subscribeWebhookSchema),
  webhookController.subscribeWebhook
);

router.get('/subscriptions', 
  authMiddleware.authenticate,
  createProtectedRoute('INTEGRATION_MANAGER'),
  webhookController.getSubscriptions
);

export default router;