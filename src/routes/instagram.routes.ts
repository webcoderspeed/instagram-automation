import { Router } from 'express';
import { InstagramController } from '../controllers/instagram.controller';

const router = Router();
const instagramController = new InstagramController();

// Routes
router.get('/profile', instagramController.getProfile);
router.get('/media', instagramController.getMedia);
router.get('/media/:id', instagramController.getMediaById);
router.post('/publish', instagramController.publishPost);
router.get('/media/:id/insights', instagramController.getMediaInsights);
router.get('/insights', instagramController.getAccountInsights);
router.get('/hashtag/:hashtag', instagramController.getHashtagInfo);
router.get('/rate-limit', instagramController.getRateLimit);

export default router;