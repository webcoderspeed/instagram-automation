import { Router } from 'express';
import { InstagramController } from '../controllers/instagram.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { instagramGuard } from '../middleware/guards/platform-auth.guard';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  sendMessageSchema,
  sendImageMessageSchema,
  sendVideoMessageSchema,
  getMessagesSchema,
  sendTypingIndicatorSchema,
  markMessageSeenSchema,
  sendQuickReplyMessageSchema,
  sendButtonTemplateSchema,
} from '../validators/instagram.validator';
import { publishPostSchema } from '../validators/instagram.validator';

const router = Router();
const instagramController = new InstagramController();

// Note: Authentication and email verification are now handled by requirePermission middleware

// OAuth Routes
router.get('/connect', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_CONNECT),
  instagramController.connect
);

router.get('/callback', 
  instagramController.callback
);

router.delete('/disconnect', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_DISCONNECT),
  instagramController.disconnect
);

router.get('/status', 
  roleMiddleware.requirePermission(PERMISSIONS.ACCOUNT_READ),
  instagramController.getConnectionStatus
);

// API Routes
router.get('/profile', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getProfile
);

router.get('/media', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getMedia
);

router.get('/media/:id', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getMediaById
);

router.post('/publish', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_PUBLISH),
  validateBody(publishPostSchema),
  instagramController.publishPost
);

router.get('/media/:id/insights', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  instagramController.getMediaInsights
);

router.get('/insights', 
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  instagramController.getAccountInsights
);

router.get('/hashtag/:hashtag', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getHashtagInfo
);

router.get('/rate-limit', 
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getRateLimit
);

// Messaging routes
router.post('/message/send', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(sendMessageSchema),
  instagramController.sendMessage
);

router.post('/message/image', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(sendImageMessageSchema),
  instagramController.sendImageMessage
);

router.post('/message/video', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(sendVideoMessageSchema),
  instagramController.sendVideoMessage
);

router.get('/messages', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_READ),
  validateQuery(getMessagesSchema),
  instagramController.getMessages
);

router.post('/message/typing', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(sendTypingIndicatorSchema),
  instagramController.sendTypingIndicator
);

router.post('/message/seen', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(markMessageSeenSchema),
  instagramController.markMessageSeen
);

router.post('/message/quick-reply', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_SEND),
  validateBody(sendQuickReplyMessageSchema),
  instagramController.sendQuickReplyMessage
);

router.post('/message/button-template', 
  roleMiddleware.requirePermission(PERMISSIONS.MESSAGE_TEMPLATE),
  validateBody(sendButtonTemplateSchema),
  instagramController.sendButtonTemplate
);

export default router;