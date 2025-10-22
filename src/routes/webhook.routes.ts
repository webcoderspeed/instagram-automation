import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

// Webhook routes
router.get('/instagram', webhookController.verifyWebhook);
router.post('/instagram', webhookController.handleWebhook);
router.post('/subscribe', webhookController.subscribeWebhook);
router.get('/subscriptions', webhookController.getSubscriptions);

export default router;