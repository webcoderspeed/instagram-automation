/**
 * Subscription Controller
 * Handles subscription and billing management
 */

import { Request, Response } from "express";
import { SubscriptionModel } from "../models/subscription.model";
import { UserModel } from "../models/user.model";
import { PostModel } from "../models/post.model";
import { AutomationModel } from "../models/automation.model";
import { PlatformAccountModel } from "../models/platform-account.model";
import { PaymentHistoryModel } from "../models/payment-history.model";
import { StripeService } from "../services/stripe.service";
import logger from "../utils/logger";
import { AppError } from "../utils/app-error";
import asyncHandler from "express-async-handler";
import { sendSuccess, createMeta } from "../utils/response-builder";

export class SubscriptionController {
  private stripeService: StripeService | null;

  /**
   * Helper method to get authenticated user
   */
  private getAuthenticatedUser(req: Request) {
    if (!req.session.user) {
      throw new AppError('User not authenticated', 401);
    }
    return req.session.user;
  }

  constructor() {
    // Initialize Stripe service
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const publicKey = process.env.STRIPE_PUBLIC_KEY;
  
    if (!secretKey || !webhookSecret) {
      logger.warn('Stripe keys missing; disabling subscription billing endpoints');
      this.stripeService = null;
    } else {
      this.stripeService = new StripeService({
        secretKey,
        webhookSecret,
        publicKey: publicKey || '',
      });
    }
  }

  /**
   * Get current subscription details
   */
  getCurrentSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      // Get subscription from database
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: ["active", "trialing", "past_due"] },
      }).populate("userId", "email firstName lastName");

      if (!subscription) {
        // Return free plan if no active subscription
        sendSuccess(res, {
          id: null,
          userId,
          plan: "free",
          status: "active",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          features: {
            maxPosts: 10,
            maxAutomations: 1,
            maxConnectedAccounts: 2,
            analytics: false,
            prioritySupport: false,
          },
          usage: {
            postsUsed: 0,
            automationsUsed: 0,
            connectedAccountsUsed: 0,
          },
          billing: {
            amount: 0,
            currency: "USD",
            interval: "month",
          },
        }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

        return;
      }

      // Use only local database data - no Stripe API calls needed
      const responseData = {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.startDate,
        currentPeriodEnd: subscription.endDate,
        cancelAtPeriodEnd: !!subscription.cancelledAt,
        features: subscription.features,
        usage: subscription.usage,
        billing: {
          amount: subscription.price,
          currency: subscription.currency,
          interval: subscription.billingCycle,
        },
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };

      logger.info("Current subscription fetched", {
        userId,
        plan: subscription.plan,
        status: responseData.status,
      });

      sendSuccess(res, responseData, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error("Failed to fetch current subscription", { userId, error });
      throw AppError.internal("Failed to fetch subscription details");
    }
  });

  /**
   * Get subscription plans
   */
  getPlans = asyncHandler(async (req: Request, res: Response) => {
    const plans = [
      {
        id: "free",
        name: "Free",
        description: "Perfect for getting started",
        price: 0,
        currency: "USD",
        interval: "month",
        features: {
          maxPosts: 10,
          maxAutomations: 1,
          maxConnectedAccounts: 2,
          analytics: false,
          prioritySupport: false,
          customBranding: false,
        },
        limits: {
          postsPerMonth: 10,
          automationsActive: 1,
          connectedAccounts: 2,
        },
      },
      {
        id: "starter",
        name: "Starter",
        description: "Great for small businesses",
        price: 29,
        currency: "USD",
        interval: "month",
        features: {
          maxPosts: 100,
          maxAutomations: 5,
          maxConnectedAccounts: 5,
          analytics: true,
          prioritySupport: false,
          customBranding: false,
        },
        limits: {
          postsPerMonth: 100,
          automationsActive: 5,
          connectedAccounts: 5,
        },
      },
      {
        id: "professional",
        name: "Professional",
        description: "Perfect for growing businesses",
        price: 79,
        currency: "USD",
        interval: "month",
        features: {
          maxPosts: 500,
          maxAutomations: 20,
          maxConnectedAccounts: 15,
          analytics: true,
          prioritySupport: true,
          customBranding: true,
        },
        limits: {
          postsPerMonth: 500,
          automationsActive: 20,
          connectedAccounts: 15,
        },
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        price: 199,
        currency: "USD",
        interval: "month",
        features: {
          maxPosts: -1, // Unlimited
          maxAutomations: -1, // Unlimited
          maxConnectedAccounts: -1, // Unlimited
          analytics: true,
          prioritySupport: true,
          customBranding: true,
        },
        limits: {
          postsPerMonth: -1,
          automationsActive: -1,
          connectedAccounts: -1,
        },
      },
    ];

    sendSuccess(res, plans, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Create subscription checkout session
   */
  createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { planId, interval = "month" } = req.body;

    if (!this.stripeService) {
      throw AppError.internal('Stripe is not configured');
    }

    if (!planId || planId === "free") {
      throw new AppError("Invalid plan selected", 400);
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionModel.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });

    if (existingSubscription) {
      throw new AppError("User already has an active subscription", 400);
    }

    try {
      // Get user details
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound("User");
      }

      // Map plan IDs to Stripe price IDs (these would be configured in environment variables)
      const stripePriceIds: Record<string, string> = {
        starter: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
        professional:
          process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional",
        enterprise:
          process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
      };

      const priceId = stripePriceIds[planId];
      if (!priceId) {
        throw AppError.validation("Invalid plan selected");
      }

      // Create checkout session with customer email (no customer management)
      const checkoutSession = await this.stripeService.createCheckoutSession({
        priceId,
        customerEmail: user.email,
        successUrl: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          userId: userId.toString(),
          planId,
        },
      });

      logger.info("Stripe checkout session created", {
        userId,
        planId,
        sessionId: checkoutSession.id,
        customerEmail: user.email,
      });

      sendSuccess(res, {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error("Failed to create checkout session", {
        userId,
        planId,
        error,
      });
      throw AppError.externalService("Stripe", error as Record<string, unknown>);
    }
  });

  /**
   * Handle successful payment and activate subscription
   */
  activateSubscription = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, planId, paymentIntentId } = req.body;
    const userId = req.user!.id;

    // In a real implementation, verify the payment with Stripe
    logger.info("Activating subscription", { userId, planId, sessionId });

    // Create subscription record
    const subscription = new SubscriptionModel({
      userId,
      plan: planId,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      price: planId === "starter" ? 29 : planId === "professional" ? 79 : 199,
      currency: "USD",
      billingCycle: "monthly",
      features: {
        maxPostsPerMonth:
          planId === "starter" ? 100 : planId === "professional" ? 500 : -1,
        maxAutomations:
          planId === "starter" ? 5 : planId === "professional" ? 20 : -1,
        maxPlatformAccounts:
          planId === "starter" ? 5 : planId === "professional" ? 15 : -1,
        maxStorageGB:
          planId === "starter" ? 5 : planId === "professional" ? 50 : -1,
        analyticsRetentionDays:
          planId === "starter" ? 30 : planId === "professional" ? 90 : 365,
        prioritySupport: planId !== "starter",
        customBranding: planId === "professional" || planId === "enterprise",
        apiAccess: planId === "professional" || planId === "enterprise",
        webhooks: planId === "professional" || planId === "enterprise",
        teamMembers:
          planId === "starter" ? 1 : planId === "professional" ? 5 : -1,
        advancedAnalytics: planId !== "starter",
        bulkOperations: planId === "professional" || planId === "enterprise",
      },
    });

    await subscription.save();

    // Update user subscription reference
    await UserModel.findByIdAndUpdate(userId, {
      subscriptionId: subscription._id,
    });

    sendSuccess(res, {
      subscriptionId: subscription._id,
      plan: subscription.plan,
      status: subscription.status,
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Cancel subscription
   */
  cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await SubscriptionModel.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });

    if (!subscription) {
      throw new AppError("No active subscription found", 404);
    }

    if (cancelAtPeriodEnd) {
      // Mark for cancellation at period end
      subscription.cancelledAt = new Date();
    } else {
      subscription.status = "cancelled";
      subscription.cancelledAt = new Date();
    }

    await subscription.save();

    logger.info("Subscription canceled", {
      userId,
      subscriptionId: subscription._id,
      cancelAtPeriodEnd,
    });

    sendSuccess(res, {
      status: subscription.status,
      cancelAtPeriodEnd: !!subscription.cancelledAt,
      currentPeriodEnd: subscription.endDate,
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Reactivate canceled subscription
   */
  reactivateSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const subscription = await SubscriptionModel.findOne({
      userId,
      cancelledAt: { $exists: true },
      status: "active",
    });

    if (!subscription) {
      throw new AppError("No subscription found to reactivate", 404);
    }

    subscription.cancelledAt = undefined;
    await subscription.save();

    logger.info("Subscription reactivated", {
      userId,
      subscriptionId: subscription._id,
    });

    sendSuccess(res, {
      status: subscription.status,
      cancelAtPeriodEnd: !!subscription.cancelledAt,
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Update payment method
   */
  updatePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { paymentMethodId } = req.body;

    const subscription = await SubscriptionModel.findOne({
      userId,
      status: { $in: ["active", "trialing", "past_due"] },
    });

    if (!subscription) {
      throw new AppError("No active subscription found", 404);
    }

    // In a real implementation, update payment method with Stripe
    logger.info("Updating payment method", { userId, paymentMethodId });

    subscription.paymentMethodId = paymentMethodId;
    await subscription.save();

    sendSuccess(res, { message: "Payment method updated successfully" }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get billing history
   */
  getBillingHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    try {
      // Get subscription for plan info
      const subscription = await SubscriptionModel.findOne({ userId });
      
      // Build query options with filters
      const queryOptions: any = {
        page: Number(page),
        limit: Number(limit)
      };
      
      if (status) {
        queryOptions.status = status;
      }
      
      if (startDate) {
        queryOptions.startDate = new Date(startDate as string);
      }
      
      if (endDate) {
        queryOptions.endDate = new Date(endDate as string);
      }
      
      // Use PaymentHistoryModel for efficient querying with pagination and filters
      const paymentHistory = await PaymentHistoryModel.findByUser(userId, queryOptions);

      // Get total count for pagination with same filters
      const countQuery: any = { userId };
      if (status) countQuery.status = status;
      if (startDate || endDate) {
        countQuery.paymentDate = {};
        if (startDate) countQuery.paymentDate.$gte = new Date(startDate as string);
        if (endDate) countQuery.paymentDate.$lte = new Date(endDate as string);
      }
      
      const totalPayments = await PaymentHistoryModel.countDocuments(countQuery);

      // Transform to response format
      const billingHistory = paymentHistory.map((payment: any) => ({
        id: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        date: payment.paymentDate,
        description: payment.description || (subscription ? `${subscription.plan} subscription` : 'Subscription payment'),
        paymentMethod: payment.paymentMethod
      }));

      logger.info('Billing history fetched from PaymentHistory model', {
        userId,
        historyCount: billingHistory.length,
        totalPayments,
        page: Number(page),
        limit: Number(limit)
      });

      sendSuccess(res, {
        billingHistory,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalPayments,
          totalPages: Math.ceil(totalPayments / Number(limit))
        }
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Failed to get billing history', { error, userId });
      throw AppError.internal('Failed to fetch billing history');
    }
  });

  /**
   * Get usage statistics
   */
  getUsageStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      // Get user's current subscription to determine limits
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: ["active", "trialing"] },
      });

      // Define plan limits (these could be moved to a configuration file)
      const planLimits = {
        free: { posts: 10, automations: 1, connectedAccounts: 1 },
        starter: { posts: 100, automations: 5, connectedAccounts: 3 },
        professional: { posts: 500, automations: 20, connectedAccounts: 10 },
        enterprise: { posts: -1, automations: -1, connectedAccounts: -1 }, // unlimited
      };

      const currentPlan = subscription?.plan || "free";
      const limits =
        planLimits[currentPlan as keyof typeof planLimits] || planLimits.free;

      // Get current month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Aggregate real usage data
      const [postsCount, automationsCount, connectedAccountsCount] =
        await Promise.all([
          // Count posts created this month
          PostModel.countDocuments({
            userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          }),

          // Count active automations
          AutomationModel.countDocuments({
            userId,
            status: "active",
          }),

          // Count connected platform accounts
          PlatformAccountModel.countDocuments({
            userId,
            status: "connected",
          }),
        ]);

      // Calculate usage statistics
      const usageStats = {
        posts: {
          current: postsCount,
          limit: limits.posts,
          percentage:
            limits.posts === -1
              ? 0
              : Math.round((postsCount / limits.posts) * 100),
        },
        automations: {
          current: automationsCount,
          limit: limits.automations,
          percentage:
            limits.automations === -1
              ? 0
              : Math.round((automationsCount / limits.automations) * 100),
        },
        connectedAccounts: {
          current: connectedAccountsCount,
          limit: limits.connectedAccounts,
          percentage:
            limits.connectedAccounts === -1
              ? 0
              : Math.round(
                  (connectedAccountsCount / limits.connectedAccounts) * 100
                ),
        },
        plan: currentPlan,
        billingPeriod: {
          start: startOfMonth,
          end: endOfMonth,
        },
      };

      logger.info("Usage statistics calculated", {
        userId,
        plan: currentPlan,
        posts: postsCount,
        automations: automationsCount,
        accounts: connectedAccountsCount,
      });

      sendSuccess(res, usageStats, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error("Failed to fetch usage statistics", { userId, error });
      throw AppError.internal("Failed to calculate usage statistics");
    }
  });

  /**
   * Handle Stripe webhook events
   */
  handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!this.stripeService) {
      throw AppError.internal('Stripe is not configured');
    }

    try {
      const event = this.stripeService.verifyWebhookSignature(req.body, signature);

      logger.info("Stripe webhook received", {
        type: event.type,
        id: event.id,
      });

      switch (event.type) {
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info("Unhandled webhook event type", { type: event.type });
      }

      sendSuccess(res, { received: true }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error("Webhook signature verification failed", { error });
      throw AppError.validation("Invalid webhook signature");
    }
  });

  private async handleCheckoutSessionCompleted(session: any) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      logger.error("Missing metadata in checkout session", {
        sessionId: session.id,
      });
      return;
    }

    // Create subscription record
    await SubscriptionModel.create({
      userId,
      plan: planId,
      status: "active",
      stripeSubscriptionId: session.subscription,
      amount: session.amount_total / 100,
      currency: session.currency,
      interval: "month", // This should be determined from the price
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    logger.info("Subscription created from checkout session", {
      userId,
      planId,
      sessionId: session.id,
    });
  }

  private async handleSubscriptionUpdated(subscription: any) {
    // Update subscription in database using Stripe subscription ID
    const updatedSubscription = await SubscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: subscription.status,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        cancelledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
      { new: true }
    );

    if (!updatedSubscription) {
      logger.error("Subscription not found for update", { subscriptionId: subscription.id });
      return;
    }

    logger.info("Subscription updated", {
      userId: updatedSubscription.userId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  private async handleSubscriptionDeleted(subscription: any) {
    // Update subscription status to cancelled using Stripe subscription ID
    const cancelledSubscription = await SubscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
      { new: true }
    );

    if (!cancelledSubscription) {
      logger.error("Subscription not found for cancellation", { subscriptionId: subscription.id });
      return;
    }

    logger.info("Subscription cancelled", {
      userId: cancelledSubscription.userId,
      subscriptionId: subscription.id,
    });
  }

  private async handlePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.subscription;

    // Find subscription by Stripe subscription ID
    const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
    if (!subscription) {
      logger.error("Subscription not found for payment", { subscriptionId });
      return;
    }

    // Update subscription status if it was past_due
    if (subscription.status === "past_due") {
      subscription.status = "active";
      await subscription.save();
    }

    // Create payment history record
    await PaymentHistoryModel.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      transactionId: `stripe_${invoice.id}`,
      stripePaymentIntentId: invoice.payment_intent,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: 'completed',
      description: `Payment for ${subscription.plan} plan`,
      paymentDate: new Date(invoice.created * 1000),
      metadata: {
        stripeInvoiceId: invoice.id,
        stripePeriodStart: invoice.period_start,
        stripePeriodEnd: invoice.period_end
      }
    });

    logger.info("Payment succeeded", {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100
    });
  }

  private async handlePaymentFailed(invoice: any) {
    const subscriptionId = invoice.subscription;

    // Find subscription by Stripe subscription ID
    const subscription = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
    if (!subscription) {
      logger.error("Subscription not found for failed payment", { subscriptionId });
      return;
    }

    // Update subscription status to past_due
    if (subscription.status === "active") {
      subscription.status = "past_due";
      await subscription.save();
    }

    // Create payment history record for failed payment
    await PaymentHistoryModel.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      transactionId: `stripe_failed_${invoice.id}`,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      description: `Failed payment for ${subscription.plan} plan`,
      paymentDate: new Date(invoice.created * 1000),
      failureReason: invoice.last_finalization_error?.message || 'Payment failed',
      metadata: {
        stripeInvoiceId: invoice.id,
        stripePeriodStart: invoice.period_start,
        stripePeriodEnd: invoice.period_end
      }
    });

    logger.info("Payment failed", {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100
    });
  }
}
