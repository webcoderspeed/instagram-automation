import { z } from 'zod';

/**
 * Settings Validation Schemas
 * 
 * Zod schemas for validating settings-related requests
 * ensuring type safety and data integrity across the application.
 */

// Common validation patterns
const timezoneSchema = z.string().min(1, 'Timezone is required');
const languageSchema = z.string().min(2, 'Language code must be at least 2 characters').max(5, 'Language code must be at most 5 characters');
const urlSchema = z.string().url('Invalid URL format').optional();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional();

// Profile Settings Schema
export const updateProfileSettingsSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .optional(),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name must be less than 100 characters')
      .optional(),
    bio: z
      .string()
      .max(500, 'Bio must be less than 500 characters')
      .optional(),
    website: urlSchema,
    location: z
      .string()
      .max(100, 'Location must be less than 100 characters')
      .optional(),
    timezone: timezoneSchema.optional(),
    language: languageSchema.optional(),
    avatar: urlSchema,
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  }),
});

// Notification Settings Schema
export const updateNotificationSettingsSchema = z.object({
  body: z.object({
    email: z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
      types: z.array(z.enum([
        'post_published',
        'comment_received',
        'message_received',
        'mention_received',
        'automation_triggered',
        'account_connected',
        'account_disconnected',
        'subscription_updated',
        'security_alert'
      ])).optional(),
    }).optional(),
    push: z.object({
      enabled: z.boolean().optional(),
      types: z.array(z.enum([
        'post_published',
        'comment_received',
        'message_received',
        'mention_received',
        'automation_triggered',
        'account_connected',
        'account_disconnected',
        'subscription_updated',
        'security_alert'
      ])).optional(),
    }).optional(),
    sms: z.object({
      enabled: z.boolean().optional(),
      phoneNumber: phoneSchema,
      types: z.array(z.enum([
        'post_published',
        'comment_received',
        'message_received',
        'mention_received',
        'automation_triggered',
        'account_connected',
        'account_disconnected',
        'subscription_updated',
        'security_alert'
      ])).optional(),
    }).optional(),
    inApp: z.object({
      enabled: z.boolean().optional(),
      types: z.array(z.enum([
        'post_published',
        'comment_received',
        'message_received',
        'mention_received',
        'automation_triggered',
        'account_connected',
        'account_disconnected',
        'subscription_updated',
        'security_alert'
      ])).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one notification setting must be provided'
  }),
});

// Privacy Settings Schema
export const updatePrivacySettingsSchema = z.object({
  body: z.object({
    profileVisibility: z.enum(['public', 'private']).optional(),
    showEmail: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    allowAnalytics: z.boolean().optional(),
    allowMarketing: z.boolean().optional(),
    dataRetention: z.number().min(30).max(365).optional(),
    cookiePreferences: z.object({
      necessary: z.boolean().optional(),
      analytics: z.boolean().optional(),
      marketing: z.boolean().optional(),
      functional: z.boolean().optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one privacy setting must be provided'
  }),
});

// Automation Settings Schema
export const updateAutomationSettingsSchema = z.object({
  body: z.object({
    autoReply: z.object({
      enabled: z.boolean().optional(),
      platforms: z.array(z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'])).optional(),
      businessHours: z.object({
        enabled: z.boolean().optional(),
        timezone: timezoneSchema.optional(),
        schedule: z.array(z.object({
          day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
          enabled: z.boolean(),
          startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),  
          endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
        })).optional(),
      }).optional(),
      templates: z.array(z.object({
        id: z.string(),
        name: z.string(),
        message: z.string(),
        triggers: z.array(z.string()),
      })).optional(),
    }).optional(),
    autoModeration: z.object({
      enabled: z.boolean().optional(),
      platforms: z.array(z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'])).optional(),
      rules: z.array(z.object({
        id: z.string(),
        name: z.string(),
        enabled: z.boolean(),
        conditions: z.array(z.object({
          type: z.enum(['keyword', 'sentiment', 'language', 'user', 'engagement']),
          operator: z.enum(['contains', 'equals', 'greater_than', 'less_than', 'in', 'not_in']),
          value: z.union([z.string(), z.number(), z.array(z.string())]),
        })),
        actions: z.array(z.object({
          type: z.enum(['hide', 'delete', 'reply', 'flag', 'block_user', 'notify_admin']),
          value: z.string().optional(),
        })),
      })).optional(),
    }).optional(),
    autoPosting: z.object({
      enabled: z.boolean().optional(),
      platforms: z.array(z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'])).optional(),
      defaultSchedule: z.object({
        timezone: timezoneSchema.optional(),
        schedule: z.array(z.object({
          day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
          enabled: z.boolean(),
          startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
          endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
        })).optional(),
        optimalTimes: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one automation setting must be provided'
  }),
});

// Billing Settings Schema
export const updateBillingSettingsSchema = z.object({
  body: z.object({
    paymentMethods: z.array(z.object({
      id: z.string(),
      type: z.enum(['card', 'bank_account', 'paypal']),
      isDefault: z.boolean(),
      last4: z.string().optional(),
      brand: z.string().optional(),
      expiryMonth: z.number().min(1).max(12).optional(),
      expiryYear: z.number().min(new Date().getFullYear()).optional(),
    })).optional(),
    billingAddress: z.object({
      line1: z.string().min(1, 'Address line 1 is required'),
      line2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().length(2, 'Country must be a 2-letter code'),
    }).optional(),
    taxId: z.string().optional(),
    companyName: z.string().optional(),
    usageAlerts: z.object({
      enabled: z.boolean().optional(),
      thresholds: z.array(z.object({
        type: z.enum(['posts', 'api_calls', 'storage']),
        percentage: z.number().min(1).max(100),
        enabled: z.boolean(),
      })).optional(),
    }).optional(),
    invoicePreferences: z.object({
      emailDelivery: z.boolean().optional(),
      autoDownload: z.boolean().optional(),
      format: z.enum(['pdf', 'csv']).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one billing setting must be provided'
  }),
});

// Security Settings Schema
export const updateSecuritySettingsSchema = z.object({
  body: z.object({
    twoFactorAuth: z.object({
      enabled: z.boolean().optional(),
      method: z.enum(['sms', 'email', 'authenticator']).optional(),
      backupCodes: z.array(z.string()).optional(),
    }).optional(),
    loginNotifications: z.object({
      enabled: z.boolean().optional(),
      channels: z.array(z.enum(['email', 'sms', 'push'])).optional(),
    }).optional(),
    sessionTimeout: z.number().min(15).max(1440).optional(), // 15 minutes to 24 hours
    passwordRequirements: z.object({
      minLength: z.number().min(8).max(128).optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      requireNumbers: z.boolean().optional(),
      requireSpecialChars: z.boolean().optional(),
      passwordExpiry: z.number().min(30).max(365).optional(), // days
    }).optional(),
    apiAccess: z.object({
      enabled: z.boolean().optional(),
      allowedIps: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address format')).optional(),
      rateLimit: z.number().min(100).max(10000).optional(),
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one security setting must be provided'
  }),
});

// General Settings Update Schema (for updating multiple categories at once)
export const updateSettingsSchema = z.object({
  body: z.object({
    profile: updateProfileSettingsSchema.shape.body.optional(),
    notifications: updateNotificationSettingsSchema.shape.body.optional(),
    privacy: updatePrivacySettingsSchema.shape.body.optional(),
    automation: updateAutomationSettingsSchema.shape.body.optional(),
    billing: updateBillingSettingsSchema.shape.body.optional(),
    security: updateSecuritySettingsSchema.shape.body.optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one settings category must be provided'
  }),
});

// Reset Settings Schema
export const resetSettingsSchema = z.object({
  body: z.object({
    categories: z.array(z.enum([
      'profile',
      'notifications',
      'privacy',
      'automation',
      'billing',
      'security'
    ])).min(1, 'At least one category must be specified').optional(),
  }),
});

// Export type definitions
export type UpdateProfileSettingsInput = z.infer<typeof updateProfileSettingsSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;
export type UpdateAutomationSettingsInput = z.infer<typeof updateAutomationSettingsSchema>;
export type UpdateBillingSettingsInput = z.infer<typeof updateBillingSettingsSchema>;
export type UpdateSecuritySettingsInput = z.infer<typeof updateSecuritySettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ResetSettingsInput = z.infer<typeof resetSettingsSchema>;