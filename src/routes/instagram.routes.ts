import { Router } from 'express';
import { InstagramController } from '../controllers/instagram.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/guards/protected-routes.middleware';
import { validate } from '../validators/common.validator';
import { publishPostSchema } from '../validators/instagram.validator';

const router = Router();
const instagramController = new InstagramController();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

// Routes
router.get('/profile', 
  createProtectedRoute('VERIFIED_USER'),
  instagramController.getProfile
);

router.get('/media', 
  createProtectedRoute('VERIFIED_USER'),
  instagramController.getMedia
);

router.get('/media/:id', 
  createProtectedRoute('VERIFIED_USER'),
  instagramController.getMediaById
);

router.post('/publish', 
  createProtectedRoute('CREATE_POST'),
  validate(publishPostSchema),
  instagramController.publishPost
);

router.get('/media/:id/insights', 
  createProtectedRoute('ANALYTICS_ACCESS'),
  instagramController.getMediaInsights
);

router.get('/insights', 
  createProtectedRoute('ANALYTICS_ACCESS'),
  instagramController.getAccountInsights
);

router.get('/hashtag/:hashtag', 
  createProtectedRoute('VERIFIED_USER'),
  instagramController.getHashtagInfo
);

router.get('/rate-limit', 
  createProtectedRoute('VERIFIED_USER'),
  instagramController.getRateLimit
);

export default router;