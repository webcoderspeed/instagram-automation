import { Router } from 'express';
import { InstagramController } from '../controllers/instagram.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/role.middleware';
  import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../validators/common.validator';
import { publishPostSchema } from '../validators/instagram.validator';

const router = Router();
const instagramController = new InstagramController();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

// Routes
router.get('/profile', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getProfile
);

router.get('/media', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getMedia
);

router.get('/media/:id', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getMediaById
);

router.post('/publish', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_PUBLISH),
  validate(publishPostSchema),
  instagramController.publishPost
);

router.get('/media/:id/insights', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  instagramController.getMediaInsights
);

router.get('/insights', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.ANALYTICS_READ),
  instagramController.getAccountInsights
);

router.get('/hashtag/:hashtag', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getHashtagInfo
);

router.get('/rate-limit', 
  createProtectedRoute('VERIFIED_USER'),
  roleMiddleware.requirePermission(PERMISSIONS.POST_READ),
  instagramController.getRateLimit
);

export default router;