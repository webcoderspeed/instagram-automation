import { z } from 'zod';

// Plan type enum
const PlanType = z.enum(['basic', 'pro', 'enterprise']);

// Payment method schema
const PaymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account']),
  card: z.object({
    number: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(new Date().getFullYear()),
    cvc: z.string().regex(/^\d{3,4}$/, "Invalid CVC"),
  }).optional(),
  billingDetails: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    address: z.object({
      line1: z.string().min(1, "Address line 1 is required"),
      line2: z.string().optional(),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      postalCode: z.string().min(1, "Postal code is required"),
      country: z.string().length(2, "Country must be 2-letter code"),
    }),
  }),
});

// Create checkout session schema
export const createCheckoutSessionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  planType: PlanType,
  billingCycle: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url("Invalid success URL").optional(),
  cancelUrl: z.string().url("Invalid cancel URL").optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// Activate subscription schema
export const activateSubscriptionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

// Cancel subscription schema
export const cancelSubscriptionSchema = z.object({
  reason: z.enum([
    'too_expensive',
    'missing_features',
    'switched_service',
    'unused',
    'customer_service',
    'low_quality',
    'other'
  ]).optional(),
  feedback: z.string().max(500, "Feedback cannot exceed 500 characters").optional(),
  cancelAtPeriodEnd: z.boolean().default(true),
});

// Reactivate subscription schema
export const reactivateSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required").optional(),
  planType: PlanType.optional(),
});

// Update payment method schema
export const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method ID is required"),
  setAsDefault: z.boolean().default(true),
});

// Upgrade/downgrade plan schema
export const changePlanSchema = z.object({
  newPlanId: z.string().min(1, "New plan ID is required"),
  newPlanType: PlanType,
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  prorationBehavior: z.enum(['create_prorations', 'none', 'always_invoice']).default('create_prorations'),
});

// Apply coupon schema
export const applyCouponSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required").max(50, "Coupon code too long"),
});

// Usage tracking schema
export const trackUsageSchema = z.object({
  feature: z.enum([
    'posts_published',
    'stories_published', 
    'automations_executed',
    'api_calls',
    'storage_used',
    'team_members'
  ]),
  quantity: z.number().int().min(0),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// Billing address schema
export const updateBillingAddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().length(2, "Country must be 2-letter code"),
  }),
  taxId: z.string().optional(),
});

// Export types
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type ReactivateSubscriptionInput = z.infer<typeof reactivateSubscriptionSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type TrackUsageInput = z.infer<typeof trackUsageSchema>;
export type UpdateBillingAddressInput = z.infer<typeof updateBillingAddressSchema>;