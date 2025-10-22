/**
 * Subscription Routes
 * API endpoints for subscription and billing management
 */

import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/guards/protected-routes.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current subscription details
 * @access  Private (Verified User)
 */
router.get(
  '/current',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.getCurrentSubscription
);

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Private (Verified User)
 */
router.get(
  '/plans',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.getPlans
);

/**
 * @route   POST /api/subscriptions/checkout
 * @desc    Create checkout session for subscription
 * @access  Private (Verified User)
 */
router.post(
  '/checkout',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.createCheckoutSession
);

/**
 * @route   POST /api/subscriptions/activate
 * @desc    Activate subscription after successful payment
 * @access  Private (Verified User)
 */
router.post(
  '/activate',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.activateSubscription
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private (Verified User)
 */
router.post(
  '/cancel',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.cancelSubscription
);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reactivate canceled subscription
 * @access  Private (Verified User)
 */
router.post(
  '/reactivate',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.reactivateSubscription
);

/**
 * @route   PUT /api/subscriptions/payment-method
 * @desc    Update payment method
 * @access  Private (Verified User)
 */
router.put(
  '/payment-method',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.updatePaymentMethod
);

/**
 * @route   GET /api/subscriptions/billing-history
 * @desc    Get billing history
 * @access  Private (Verified User)
 */
router.get(
  '/billing-history',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.getBillingHistory
);

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get usage statistics
 * @access  Private (Verified User)
 */
router.get(
  '/usage',
  createProtectedRoute('VERIFIED_USER'),
  subscriptionController.getUsageStats
);

export default router;