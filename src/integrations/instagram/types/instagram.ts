/**
 * Instagram Integration Types
 * Common types used across Instagram services
 */

export interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthorizationRequest {
  userId: string;
  scopes?: string[];
  state?: string;
}

export interface TokenExchangeRequest {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  grantType: 'authorization_code';
}

export interface ShortLivedTokenResponse {
  access_token: string;
  user_id: string;
}

export interface LongLivedTokenRequest {
  grantType: 'ig_exchange_token';
  clientSecret: string;
  accessToken: string;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface InstagramTokenData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenValidationResponse {
  data: {
    app_id: string;
    type: string;
    application: string;
    data_access_expires_at: number;
    expires_at: number;
    is_valid: boolean;
    scopes: string[];
    user_id: string;
  };
}

export interface TokenRefreshRequest {
  grantType: 'ig_refresh_token';
  accessToken: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RevokeTokenRequest {
  accessToken: string;
}

export interface RevokeTokenResponse {
  success: boolean;
}

export interface InstagramApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface InstagramApiResponse<T = any> {
  data?: T;
  error?: InstagramApiError['error'];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}