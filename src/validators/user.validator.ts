/**
 * User Validation Schemas
 * Validation schemas for user-related operations
 */

import { z } from 'zod';
import { ROLES } from '../constants/permissions';

/**
 * Schema for role upgrade request
 */
export const upgradeRoleSchema = z.object({
  body: z.object({
    targetRole: z.enum([ROLES.USER, ROLES.MANAGER, ROLES.ADMIN, ROLES.VIEWER, ROLES.API_CLIENT] as const, {
      message: 'Invalid role. Allowed roles are: user, manager, admin, viewer, api_client'
    })
  })
});

/**
 * Schema for user profile update
 */
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .optional(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .optional(),
    timezone: z.string()
      .min(1, 'Timezone is required')
      .optional(),
    language: z.string()
      .min(2, 'Language must be at least 2 characters')
      .max(10, 'Language must be less than 10 characters')
      .optional()
  }).refine((data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  }, {
    message: 'At least one field must be provided for update'
  })
});

export type UpgradeRoleRequest = z.infer<typeof upgradeRoleSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;