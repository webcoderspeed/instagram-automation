/**
 * Subscription-based Access Control Middleware
 * Middleware for checking subscription plans, features, and usage limits
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { AuthenticatedUser } from '../types/user.types';
import { SubscriptionModel } from '../models/subscription.model';
import { UserModel } from '../models/user.model';

export interface SubscriptionRequirement {
  plan?: string | string[];
  feature?: string;
  usageLimit?: {
    feature: string;
    limit: number;
  };
  requireActive?: boolean;
}

/**
 * Require specific subscription plan(s)
 */
export function requirePlan(plans: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = req.session?.user as AuthenticatedUser;
      const subscription = await SubscriptionModel.findOne({ 
        userId: user._id,
        status: 'active'
      });

      if (!subscription) {
        throw new ApiError(403, 'Active subscription required');
      }

      const allowedPlans = Array.isArray(plans) ? plans : [plans];
      if (!allowedPlans.includes(subscription.plan)) {
        throw new ApiError(403, `Subscription plan ${allowedPlans.join(' or ')} required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require specific feature access
 */
export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = req.session?.user;
      const subscription = await SubscriptionModel.findOne({ 
        userId: user._id,
        status: 'active'
      });

      if (!subscription) {
        throw new ApiError(403, 'Active subscription required');
      }

      // Check if feature is available in current plan
       const planFeatures = subscription.features ?? {};
       if (!planFeatures || !planFeatures[feature as keyof typeof planFeatures]) {
         throw new ApiError(403, `Feature '${feature}' not available in current plan`);
       }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check usage limits for a feature
 */
export function checkUsageLimit(feature: string, limit: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const user = req.session?.user;
      const subscription = await SubscriptionModel.findOne({ 
        userId: user._id,
        status: 'active'
      });

      if (!subscription) {
        throw ApiError.forbidden('Active subscription required');
      }

      // Get current usage for the feature
      const currentUsage = subscription.usage?.[feature as keyof typeof subscription.usage] || 0;
      
      if (currentUsage >= limit) {
        throw ApiError.forbidden(`Usage limit exceeded for ${feature}. Upgrade your plan for more access.`);
      }

      // Increment usage count
      await SubscriptionModel.updateOne(
        { _id: subscription._id },
        { $inc: { [`usage.${feature}`]: 1 } }
      );

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require active subscription
 */
export function requireActiveSubscription() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const user = req.session?.user;
      const subscription = await SubscriptionModel.findOne({ 
        userId: user._id,
        status: 'active'
      });

      if (!subscription) {
        throw ApiError.forbidden('Active subscription required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create subscription-protected route with multiple requirements
 */
export function createSubscriptionProtectedRoute(requirements: SubscriptionRequirement) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const user = req.session?.user;
      
      // Get user's subscription
      const subscription = await SubscriptionModel.findOne({ 
        userId: user._id,
        status: requirements.requireActive !== false ? 'active' : { $in: ['active', 'trialing'] }
      });

      if (!subscription) {
        throw ApiError.forbidden('Valid subscription required');
      }

      // Check plan requirement
      if (requirements.plan) {
        const allowedPlans = Array.isArray(requirements.plan) ? requirements.plan : [requirements.plan];
        if (!allowedPlans.includes(subscription.plan)) {
          throw ApiError.forbidden(`Subscription plan ${allowedPlans.join(' or ')} required`);
        }
      }

      // Check feature requirement
       if (requirements.feature) {
         const planFeatures = subscription.features ?? {};
         if (!planFeatures || !planFeatures[requirements.feature as keyof typeof planFeatures]) {
           throw new ApiError(403, `Feature '${requirements.feature}' not available in current plan`);
         }
       }

      // Check usage limit
      if (requirements.usageLimit) {
        const { feature, limit } = requirements.usageLimit;
        const currentUsage = (subscription.usage ?? {})[feature as keyof typeof subscription.usage] ?? 0;
        
        if (currentUsage >= limit) {
          throw ApiError.forbidden(`Usage limit exceeded for ${feature}. Upgrade your plan for more access.`);
        }

        // Increment usage count
        await SubscriptionModel.updateOne(
          { _id: subscription._id },
          { $inc: { [`usage.${feature}`]: 1 } }
        );
      }

      // Attach subscription info to request for use in controllers
      req.subscription = subscription;

      next();
    } catch (error) {
      next(error);
    }
  };
}