/**
 * Instagram OAuth Interfaces
 * Based on Instagram Business Login API
 */

export interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: InstagramScope[];
}

export interface InstagramScope {
  name: string;
  description: string;
}

export interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: 'code';
  scope: string;
  state?: string;
  forceReauth?: boolean;
}

export interface AuthorizationResponse {
  code: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}

export interface TokenExchangeRequest {
  clientId: string;
  clientSecret: string;
  grantType: 'authorization_code';
  redirectUri: string;
  code: string;
}

export interface ShortLivedTokenResponse {
  accessToken: string;
  userId: string;
}

export interface LongLivedTokenRequest {
  grantType: 'ig_exchange_token';
  clientSecret: string;
  accessToken: string;
}

export interface LongLivedTokenResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

export interface TokenRefreshRequest {
  grantType: 'ig_refresh_token';
  accessToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

export interface InstagramUserInfo {
  id: string;
  username: string;
  accountType: 'BUSINESS' | 'CREATOR';
  mediaCount: number;
}

export interface OAuthError {
  errorType: string;
  code: number;
  errorMessage: string;
  errorUserTitle?: string;
  errorUserMsg?: string;
  fbtraceid?: string;
}