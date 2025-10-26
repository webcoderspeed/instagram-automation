/**
 * Platform Account Mapper
 * 
 * Utility functions to map between PlatformAccount interface and Mongoose schema format
 */

import { PlatformAccount } from '../types/platform.types';

/**
 * Maps PlatformAccount interface to Mongoose schema format
 */
export function mapToPlatformAccountDocument(platformAccount: PlatformAccount) {
  return {
    userId: platformAccount.userId,
    platform: platformAccount.platform,
    id: platformAccount.platformUserId, // Map platformUserId to id
    username: platformAccount.username, // Direct mapping
    displayName: platformAccount.displayName,
    profilePicture: platformAccount.profilePicture,
    accessToken: platformAccount.credentials.accessToken, // Flatten credentials
    refreshToken: platformAccount.credentials.refreshToken,
    tokenExpiresAt: platformAccount.credentials.expiresAt,
    scopes: platformAccount.credentials.scope || [],
    isActive: platformAccount.isActive,
    lastSyncAt: platformAccount.lastSyncAt,
    createdAt: platformAccount.createdAt,
    updatedAt: platformAccount.updatedAt,
    // Set default values for required schema fields
    status: 'active' as const,
    permissions: [],
    capabilities: [],
    stats: {
      totalPosts: 0,
      totalFollowers: 0,
      totalFollowing: 0
    },
    settings: {
      autoPost: false,
      autoReply: false,
      notifications: true,
      timezone: 'UTC'
    },
    platformData: {},
    metadata: platformAccount.metadata || {}
  };
}