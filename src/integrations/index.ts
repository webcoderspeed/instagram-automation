/**
 * Integrations Module
 * Exports all integration services
 */

// Instagram Integration - Main service and specialized services
export { 
  instagramIntegrationService,
  InstagramIntegrationService,
  instagramAuthService,
  instagramProfileService,
  instagramMediaService,
  instagramMessagingService,
  instagramInsightsService,
  instagramContentPublishingService
} from './instagram';

// Instagram Integration Types
export type {
  InstagramAuthUrl,
  InstagramCallbackResult,
  InstagramConnectionStatus
} from './instagram/instagram-integration.service';

// Re-export commonly used Instagram types
export type {
  AuthConfig as InstagramOAuthConfig,
  InstagramUserProfile,
  InstagramMedia,
  InsightsAccountInsights as InstagramAccountInsights
} from './instagram';