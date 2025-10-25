import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { instagramWebhookController } from '../controllers/webhook';
import { roleMiddleware } from '../middleware/role.middleware';
import { webhookMiddleware } from '../middleware/webhook.middleware';
import { validate } from '../validators/common.validator';
import { PERMISSIONS } from '../constants/permissions';
import { 
  subscribeWebhookSchema 
} from '../validators/webhook.validator';

const router = Router();
const webhookController = new WebhookController();

// Instagram webhook routes (verification doesn't need auth)
router.get('/instagram', 
  instagramWebhookController.verifyWebhook
);

// Instagram webhook handler (no auth needed for external webhooks)
router.post('/instagram', 
  instagramWebhookController.handleWebhook
);

// Instagram webhook status
router.get('/instagram/status',
  instagramWebhookController.getStatus
);

// Protected routes require authentication and permissions
router.post('/subscribe', 
  roleMiddleware.requirePermission(PERMISSIONS.WEBHOOK_CREATE),
  validate(subscribeWebhookSchema),
  webhookController.subscribeWebhook.bind(webhookController)
);

router.get('/subscriptions', 
  roleMiddleware.requirePermission(PERMISSIONS.WEBHOOK_LIST),
  webhookController.getSubscriptions.bind(webhookController)
);

export default router;