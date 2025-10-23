import { z } from 'zod';
import { ROLES } from '../constants/permissions';

/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication-related requests
 * ensuring type safety and data integrity across the application.
 */

// Define allowed roles for signup (excluding admin and superior roles)
const ALLOWED_SIGNUP_ROLES = [ROLES.USER, ROLES.MANAGER];

// User registration schema
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    firstName: z
      .string()
      .max(50, 'First name must be less than 50 characters')
      .optional(),
    lastName: z
      .string()
      .max(50, 'Last name must be less than 50 characters')
      .optional(),
    role: z
      .enum([ROLES.USER, ROLES.MANAGER])
      .optional()
      .default(ROLES.USER),
    timezone: z
      .string()
      .optional(),
    language: z
      .string()
      .optional(),
  }),
});

// User login schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

// Token refresh schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
  }),
});

// Password reset schema
export const passwordResetSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  }),
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  }),
});

// OAuth callback schema
export const oauthCallbackSchema = z.object({
  query: z.object({
    code: z
      .string()
      .min(1, 'Authorization code is required'),
    state: z
      .string()
      .optional(),
    error: z
      .string()
      .optional(),
    error_description: z
      .string()
      .optional(),
  }),
});

// Platform connection schema
export const platformConnectionSchema = z.object({
  body: z.object({
    platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']),
    accessToken: z
      .string()
      .min(1, 'Access token is required'),
    refreshToken: z
      .string()
      .optional(),
    expiresIn: z
      .number()
      .positive()
      .optional(),
    scope: z
      .array(z.string())
      .optional(),
  }),
});

// Export types for TypeScript inference
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type PlatformConnectionInput = z.infer<typeof platformConnectionSchema>;