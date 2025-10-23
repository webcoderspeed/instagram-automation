/**
 * User Types
 * Types and interfaces for user management
 */

import { BaseEntity, SocialPlatform, PaginationParams } from './common.types';
import { PlatformAccount } from './platform.types';

export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone: string;
  language: string;
  role: UserRole;
  subscription: UserSubscription;
  preferences: UserPreferences;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  connectedAccounts: PlatformAccount[];
}

export type UserRole = 'admin' | 'user' | 'moderator' | 'viewer';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  cancelledAt?: Date;
  features: string[];
  limits: SubscriptionLimits;
}

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';

export interface SubscriptionLimits {
  connectedAccounts: number;
  scheduledPosts: number;
  monthlyPosts: number;
  automationRules: number;
  teamMembers: number;
  apiCalls: number;
  storage: number; // in MB
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  automation: AutomationPreferences;
  display: DisplayPreferences;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
  };
}

export type NotificationType = 
  | 'post_published'
  | 'comment_received'
  | 'message_received'
  | 'mention_received'
  | 'automation_triggered'
  | 'account_connected'
  | 'account_disconnected'
  | 'subscription_updated'
  | 'security_alert';

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showLocation: boolean;
  allowAnalytics: boolean;
  allowMarketing: boolean;
}

export interface AutomationPreferences {
  autoReply: {
    enabled: boolean;
    platforms: SocialPlatform[];
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: DaySchedule[];
    };
  };
  autoModeration: {
    enabled: boolean;
    platforms: SocialPlatform[];
    rules: ModerationRule[];
  };
  autoPosting: {
    enabled: boolean;
    platforms: SocialPlatform[];
    defaultSchedule: PostingSchedule;
  };
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface ModerationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: ModerationCondition[];
  actions: ModerationAction[];
}

export interface ModerationCondition {
  type: 'keyword' | 'sentiment' | 'language' | 'user' | 'engagement';
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface ModerationAction {
  type: 'hide' | 'delete' | 'reply' | 'flag' | 'block_user' | 'notify_admin';
  value?: string;
}

export interface PostingSchedule {
  timezone: string;
  schedule: DaySchedule[];
  optimalTimes: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  compactMode: boolean;
}

export interface UserActivity extends BaseEntity {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  platform?: SocialPlatform;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export interface UserInvitation extends BaseEntity {
  email: string;
  invitedBy: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface UserSearchParams extends PaginationParams {
  query?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
  subscription?: SubscriptionPlan;
  platform?: SocialPlatform;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  reason?: string;
}

/**
 * Extended user interface for authenticated requests
 */
export interface AuthenticatedUser {
  id: string;
  _id: string; // MongoDB ObjectId as string
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  connectedAccounts: {
    [K in SocialPlatform]?: PlatformAccount;
  };
  subscription?: {
    tier: string;
    limits: any;
  };
}
