/**
 * Settings Types
 * Types and interfaces for user settings management
 */

import { BaseEntity } from './common.types';

// Profile Settings
export interface ProfileSettings {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone: string;
  language: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language?: string;
}

// Notification Settings
export interface NotificationSettings {
  email: EmailNotificationSettings;
  push: PushNotificationSettings;
  sms: SmsNotificationSettings;
  inApp: InAppNotificationSettings;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  types: EmailNotificationType[];
}

export interface PushNotificationSettings {
  enabled: boolean;
  types: PushNotificationType[];
}

export interface SmsNotificationSettings {
  enabled: boolean;
  types: SmsNotificationType[];
}

export interface InAppNotificationSettings {
  enabled: boolean;
  types: InAppNotificationType[];
}

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'never';

export type EmailNotificationType = 
  | 'post_published'
  | 'comment_received'
  | 'mention_received'
  | 'automation_triggered'
  | 'account_connected'
  | 'account_disconnected'
  | 'subscription_updated'
  | 'security_alert'
  | 'weekly_summary'
  | 'monthly_report';

export type PushNotificationType = 
  | 'post_published'
  | 'comment_received'
  | 'mention_received'
  | 'automation_triggered'
  | 'security_alert';

export type SmsNotificationType = 
  | 'security_alert'
  | 'subscription_updated';

export type InAppNotificationType = 
  | 'post_published'
  | 'comment_received'
  | 'mention_received'
  | 'automation_triggered'
  | 'account_connected'
  | 'account_disconnected'
  | 'subscription_updated'
  | 'security_alert'
  | 'system_announcement';

export interface UpdateNotificationSettingsRequest {
  email?: Partial<EmailNotificationSettings>;
  push?: Partial<PushNotificationSettings>;
  sms?: Partial<SmsNotificationSettings>;
  inApp?: Partial<InAppNotificationSettings>;
}

// Privacy Settings
export interface PrivacySettings {
  profileVisible: boolean;
  analyticsSharing: boolean;
  dataExport: boolean;
  marketingEmails: boolean;
  thirdPartySharing: boolean;
}

export interface UpdatePrivacySettingsRequest {
  profileVisible?: boolean;
  analyticsSharing?: boolean;
  dataExport?: boolean;
  marketingEmails?: boolean;
  thirdPartySharing?: boolean;
}

// Automation Settings
export interface AutomationSettings {
  autoPost: boolean;
  autoReply: boolean;
  autoModeration: boolean;
  smartScheduling: boolean;
  contentSuggestions: boolean;
}

export interface UpdateAutomationSettingsRequest {
  autoPost?: boolean;
  autoReply?: boolean;
  autoModeration?: boolean;
  smartScheduling?: boolean;
  contentSuggestions?: boolean;
}

// Billing Settings
export interface BillingSettings {
  defaultPaymentMethod?: PaymentMethod;
  billingAddress?: BillingAddress;
  invoiceEmail?: string;
  autoRenewal: boolean;
  usageAlerts: UsageAlerts;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UsageAlerts {
  enabled: boolean;
  thresholds: {
    posts: number; // Percentage of monthly limit
    automations: number;
    storage: number;
  };
}

export interface UpdateBillingSettingsRequest {
  defaultPaymentMethodId?: string;
  billingAddress?: BillingAddress;
  invoiceEmail?: string;
  autoRenewal?: boolean;
  usageAlerts?: Partial<UsageAlerts>;
}

// Security Settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number; // in minutes
  allowedIPs?: string[];
  apiKeyAccess: boolean;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  loginNotifications?: boolean;
  sessionTimeout?: number;
  allowedIPs?: string[];
  apiKeyAccess?: boolean;
}

// Complete Settings Response
export interface UserSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  automation: AutomationSettings;
  billing: BillingSettings;
  security: SecuritySettings;
}

// Settings Update Requests
export interface UpdateSettingsRequest {
  profile?: UpdateProfileRequest;
  notifications?: UpdateNotificationSettingsRequest;
  privacy?: UpdatePrivacySettingsRequest;
  automation?: UpdateAutomationSettingsRequest;
  billing?: UpdateBillingSettingsRequest;
  security?: UpdateSecuritySettingsRequest;
}

// API Response Types
export interface SettingsResponse {
  success: boolean;
  data: UserSettings;
  message?: string;
}

export interface UpdateSettingsResponse {
  success: boolean;
  data: Partial<UserSettings>;
  message: string;
}

// Settings Categories
export type SettingsCategory = 
  | 'profile'
  | 'notifications'
  | 'privacy'
  | 'automation'
  | 'billing'
  | 'security';

// Settings Export/Import
export interface SettingsExport {
  version: string;
  exportedAt: Date;
  userId: string;
  settings: UserSettings;
}

export interface SettingsImportRequest {
  settings: Partial<UserSettings>;
  overwrite?: boolean;
}