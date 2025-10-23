/**
 * Instagram Authentication Types
 * Types specific to Instagram OAuth and authentication flow
 */

export interface AuthState {
  userId: string;
  timestamp: number;
  scopes?: string[];
}

export interface AuthUrlRequest {
  userId: string;
  scopes?: string[];
  redirectUri?: string;
}

export interface AuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface AuthCallbackRequest {
  code: string;
  state: string;
  userId: string;
}

export interface AuthCallbackResponse {
  success: boolean;
  accessToken?: string;
  longLivedToken?: string;
  userProfile?: any;
  error?: string;
}

export interface TokenValidationRequest {
  accessToken: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  userId?: string;
  scopes?: string[];
  expiresAt?: number;
  error?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  newToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
  username?: string;
  tokenExpiresAt?: number;
  scopes?: string[];
  lastRefresh?: Date;
}

export interface OAuthError {
  error: string;
  error_description?: string;
  error_reason?: string;
  error_user_title?: string;
  error_user_msg?: string;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  graphUrl: string;
  defaultScopes: string[];
  tokenExpiryBuffer: number; // seconds before expiry to refresh
}