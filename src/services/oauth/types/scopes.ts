/**
 * Instagram OAuth Scopes
 * Updated for new Instagram Business Login API
 */

export const INSTAGRAM_SCOPES = {
  // New scope values (effective January 27, 2025)
  BUSINESS_BASIC: 'instagram_business_basic',
  CONTENT_PUBLISH: 'instagram_business_content_publish',
  MANAGE_MESSAGES: 'instagram_business_manage_messages',
  MANAGE_COMMENTS: 'instagram_business_manage_comments',
  
  // Legacy scope values (deprecated January 27, 2025)
  LEGACY_BUSINESS_BASIC: 'business_basic',
  LEGACY_CONTENT_PUBLISH: 'business_content_publish',
  LEGACY_MANAGE_MESSAGES: 'business_manage_messages',
  LEGACY_MANAGE_COMMENTS: 'business_manage_comments'
} as const;

export type InstagramScopeValue = typeof INSTAGRAM_SCOPES[keyof typeof INSTAGRAM_SCOPES];

export interface ScopeDefinition {
  value: InstagramScopeValue;
  name: string;
  description: string;
  required: boolean;
}

export const SCOPE_DEFINITIONS: Record<string, ScopeDefinition> = {
  [INSTAGRAM_SCOPES.BUSINESS_BASIC]: {
    value: INSTAGRAM_SCOPES.BUSINESS_BASIC,
    name: 'Basic Business Access',
    description: 'Read basic business account information',
    required: true
  },
  [INSTAGRAM_SCOPES.CONTENT_PUBLISH]: {
    value: INSTAGRAM_SCOPES.CONTENT_PUBLISH,
    name: 'Content Publishing',
    description: 'Publish content to Instagram',
    required: false
  },
  [INSTAGRAM_SCOPES.MANAGE_MESSAGES]: {
    value: INSTAGRAM_SCOPES.MANAGE_MESSAGES,
    name: 'Message Management',
    description: 'Send and receive Instagram messages',
    required: true
  },
  [INSTAGRAM_SCOPES.MANAGE_COMMENTS]: {
    value: INSTAGRAM_SCOPES.MANAGE_COMMENTS,
    name: 'Comment Management',
    description: 'Manage comments on Instagram posts',
    required: false
  }
};

export const DEFAULT_SCOPES: InstagramScopeValue[] = [
  INSTAGRAM_SCOPES.BUSINESS_BASIC,
  INSTAGRAM_SCOPES.MANAGE_MESSAGES
];

export const ALL_SCOPES: InstagramScopeValue[] = [
  INSTAGRAM_SCOPES.BUSINESS_BASIC,
  INSTAGRAM_SCOPES.CONTENT_PUBLISH,
  INSTAGRAM_SCOPES.MANAGE_MESSAGES,
  INSTAGRAM_SCOPES.MANAGE_COMMENTS
];