import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import automationRoutes from './automation.routes';
import dashboardRoutes from './dashboard.routes';
import instagramRoutes from './instagram.routes';
import settingsRoutes from './settings.routes';
import subscriptionRoutes from './subscription.routes';
import userRoutes from './user.routes';
import webhookRoutes from './webhook.routes';

const router = Router();


// Mount route modules
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/automations', automationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/instagram', instagramRoutes);
router.use('/settings', settingsRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/users', userRoutes);
router.use('/webhook', webhookRoutes);





export default router;