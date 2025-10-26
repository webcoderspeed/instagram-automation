/**
 * Base OAuth Interfaces
 */

export interface OAuthProvider {
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
}

export interface OAuthState {
  state: string;
  redirectUri: string;
  scopes: string[];
  timestamp: number;
  userId?: string;
}

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface OAuthSession {
  sessionId: string;
  userId?: string;
  state: string;
  provider: string;
  createdAt: number;
  expiresAt: number;
}

export interface OAuthCallback {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  errorUri?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  expiresIn?: number;
  needsRefresh: boolean;
  error?: string;
}