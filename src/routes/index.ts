import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import automationRoutes from './automation.routes';
import dashboardRoutes from './dashboard.routes';
import instagramRoutes from './instagram.routes';
import integrationsRoutes from './integrations.routes';
import settingsRoutes from './settings.routes';
import subscriptionRoutes from './subscription.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

// Mount route modules
router.use('/api/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/api/automation', automationRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/instagram', instagramRoutes);
router.use('/api/integrations', integrationsRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/subscriptions', subscriptionRoutes);
router.use('/api/webhook', webhookRoutes);
router.use('/webhook', webhookRoutes);

export default router;