import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { validate } from '../validators/common.validator';
import { PERMISSIONS } from '../constants/permissions';
import { 
  verifyWebhookSchema, 
  instagramWebhookSchema, 
  subscribeWebhookSchema 
} from '../validators/webhook.validator';
import { createOAuthConfig, createOAuthController } from '../services/oauth';
import { env } from '../config';

const router = Router();
const webhookController = new WebhookController();


const oauthConfig = createOAuthConfig(
  env.INSTAGRAM_APP_ID || "",
  env.INSTAGRAM_APP_SECRET || "",
  env.INSTAGRAM_REDIRECT_URI || "https://cd5a6d958e90.ngrok-free.app/api/instagram/callback"
);

const oauthController = createOAuthController(oauthConfig);


router.get("/instagram", oauthController.initiateAuth);

router.get("/instagram/callback", oauthController.handleCallback);

router.post("/instagram/refresh", oauthController.refreshToken);

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

// Protected routes require authentication and permissions
router.post('/subscribe', 
  roleMiddleware.requirePermission(PERMISSIONS.WEBHOOK_CREATE),
  validate(subscribeWebhookSchema),
  webhookController.subscribeWebhook
);

router.get('/subscriptions', 
  roleMiddleware.requirePermission(PERMISSIONS.WEBHOOK_LIST),
  webhookController.getSubscriptions
);

export default router;