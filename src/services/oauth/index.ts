/**
 * OAuth Module Exports
 * Instagram Business Login OAuth implementation
 */

// Services
export { OAuthService } from './oauth-service';
export { OAuthController, createOAuthController } from './oauth-controller';

// Interfaces
export * from './interfaces/base';
export * from './interfaces/instagram';

// Types
export * from './types/scopes';
export * from './types/endpoints';

// Default configuration helper
import { InstagramOAuthConfig } from './interfaces/instagram';
import { DEFAULT_SCOPES } from './types/scopes';

export function createOAuthConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  scopes = DEFAULT_SCOPES
): InstagramOAuthConfig {
  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes
  };
}