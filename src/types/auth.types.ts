/**
 * Authentication Types
 * Types and interfaces for authentication and authorization
 */

import { BaseEntity, SocialPlatform } from './common.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  tokenType: string;
  scope?: string[];
}

export interface OAuthState {
  state: string;
  platform: SocialPlatform;
  userId?: string;
  redirectUrl?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface OAuthAuthorizationRequest {
  platform: SocialPlatform;
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  responseType: 'code';
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
}

export interface OAuthTokenRequest {
  platform: SocialPlatform;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  grantType: 'authorization_code';
  codeVerifier?: string;
}

export interface OAuthRefreshRequest {
  platform: SocialPlatform;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  grantType: 'refresh_token';
}

export interface OAuthTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
  scope?: string;
  userId?: string;
  username?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthSession extends BaseEntity {
  userId: string;
  sessionToken: string;
  deviceId?: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    platform: string;
    browser: string;
  };
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface AuthUser extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  passwordHash: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupRequest {
  password: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
  backupCode?: string;
}