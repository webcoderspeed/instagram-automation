/**
 * Instagram Integration Module
 * Exports all Instagram-related services, types, and utilities
 */

// Main integration service
export { InstagramIntegrationService, instagramIntegrationService } from './instagram-integration.service';

// Specialized services
export { InstagramAuthService, instagramAuthService } from './auth';
export { InstagramProfileService, instagramProfileService } from './profile';
export { InstagramMediaService, instagramMediaService } from './media';
export { InstagramMessagingService, instagramMessagingService } from './messaging';
export { InstagramInsightsService, instagramInsightsService } from './insights';
export { InstagramContentPublishingService, instagramContentPublishingService } from './content-publishing';

// Core types and utilities
export * from './types/instagram';
export { instagramTokenService } from './instagram-token.service';

// Re-export types from modules (avoiding conflicts)
export type {
  // Auth types
  AuthState,
  AuthUrlRequest,
  AuthUrlResponse,
  AuthCallbackRequest,
  AuthCallbackResponse,
  TokenValidationRequest,
  TokenValidationResult,
  TokenRefreshResult,
  AuthStatus,
  OAuthError,
  AuthConfig
} from './auth/auth.types';

export type {
  // Profile types
  InstagramUserProfile,
  ProfileRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  ProfileInsights,
  ProfileInsightsRequest,
  ProfileInsightsResponse
} from './profile/profile.types';

export type {
  // Media types
  InstagramMedia,
  MediaRequest,
  MediaResponse,
  SingleMediaRequest,
  SingleMediaResponse,
  CreateMediaRequest,
  CreateMediaResponse
} from './media/media.types';

export type {
  // Messaging types
  IncomingMessage,
  SendMessageRequest,
  SendMessageResponse,
  MessageTemplate,
  CreateTemplateRequest,
  CreateTemplateResponse
} from './messaging/messaging.types';

export type {
  // Insights types
  AccountInsights as InsightsAccountInsights,
  AccountInsightsRequest,
  AccountInsightsResponse
} from './insights/insights.types';

export type {
  // Content Publishing types
  MediaContainer,
  CreateMediaContainerRequest,
  PublishMediaRequest as ContentPublishMediaRequest,
  PublishMediaResponse as ContentPublishMediaResponse
} from './content-publishing/content-publishing.types';