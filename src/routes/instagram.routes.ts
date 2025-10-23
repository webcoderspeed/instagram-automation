import { Router } from 'express';
import { InstagramController } from '../controllers/instagram.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../validators/common.validator';
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
  validate(publishPostSchema),
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

export default router;