/**
 * Subscription Routes
 * API endpoints for subscription and billing management
 */

import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../validators/common.validator';
import { 
  createCheckoutSessionSchema, 
  activateSubscriptionSchema, 
  cancelSubscriptionSchema, 
  reactivateSubscriptionSchema, 
  updatePaymentMethodSchema 
} from '../validators/subscription.validator';

const router = Router();
const subscriptionController = new SubscriptionController();

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current subscription details
 * @access  Private (SUBSCRIPTION_READ permission required)
 */
router.get(
  '/current',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_READ),
  subscriptionController.getCurrentSubscription
);

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Private (SUBSCRIPTION_READ permission required)
 */
router.get(
  '/plans',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_READ),
  subscriptionController.getPlans
);

/**
 * @route   POST /api/subscriptions/checkout
 * @desc    Create checkout session for subscription
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.post(
  '/checkout',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(createCheckoutSessionSchema),
  subscriptionController.createCheckoutSession
);

/**
 * @route   POST /api/subscriptions/activate
 * @desc    Activate subscription after successful payment
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.post(
  '/activate',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(activateSubscriptionSchema),
  subscriptionController.activateSubscription
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.post(
  '/cancel',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(cancelSubscriptionSchema),
  subscriptionController.cancelSubscription
);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reactivate canceled subscription
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.post(
  '/reactivate',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(reactivateSubscriptionSchema),
  subscriptionController.reactivateSubscription
);

/**
 * @route   PUT /api/subscriptions/payment-method
 * @desc    Update payment method
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.put(
  '/payment-method',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(updatePaymentMethodSchema),
  subscriptionController.updatePaymentMethod
);

/**
 * @route   GET /api/subscriptions/billing-history
 * @desc    Get billing history
 * @access  Private (SUBSCRIPTION_READ permission required)
 */
router.get(
  '/billing-history',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_READ),
  subscriptionController.getBillingHistory
);

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get usage statistics
 * @access  Private (SUBSCRIPTION_READ permission required)
 */
router.get(
  '/usage',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_READ),
  subscriptionController.getUsageStats
);

export default router;