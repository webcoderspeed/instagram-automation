/**
 * Webhook Controllers
 * Exports all webhook controllers for different platforms
 */

import { InstagramWebhookController } from './instagram.controller';

export { InstagramWebhookController } from './instagram.controller';

// Create controller instances
export const instagramWebhookController = new InstagramWebhookController();