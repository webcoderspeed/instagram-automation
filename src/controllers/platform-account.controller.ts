import { Request, Response } from 'express';
import { Types } from 'mongoose';
import asyncHandler from 'express-async-handler';
import { ApiError } from '../utils/api-error';
import { PlatformAccountModel } from '../models/platform-account.model';
import { sendSuccess, createMeta } from '../utils/response-builder';
import { SessionUser } from '../config/session.config';
import InstagramService from '../services/instagram';

export class PlatformAccountController {
  /**
   * Get authenticated user from request
   */
  private getAuthenticatedUser(req: Request): SessionUser {
    if (!req.session.user) {
      throw ApiError.unauthorized("User not authenticated");
    }
    return req.session.user;
  }

  /**
   * Get all connected platform accounts for authenticated user
   */
  getAccounts = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    const { platform, isActive } = req.query;

    const query: any = {
      userId,
      deletedAt: null
    };

    if (platform) {
      query.platform = platform;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const accounts = await PlatformAccountModel.find(query)
      .select('-accessToken -refreshToken') // Don't expose sensitive tokens
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, { 
      accounts,
      total: accounts.length 
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get single platform account by ID
   */
  getAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid account ID');
    }

    const account = await PlatformAccountModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    })
    .select('-accessToken -refreshToken') // Don't expose sensitive tokens
    .lean();

    if (!account) {
      throw new ApiError(404, 'Platform account not found');
    }

    sendSuccess(res, { account }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Refresh platform account token and update account info
   */
  refreshAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid account ID');
    }

    const account = await PlatformAccountModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!account) {
      throw new ApiError(404, 'Platform account not found');
    }

    try {
      let updatedAccount;

      switch (account.platform) {
        case 'instagram':
          // Refresh Instagram account info
          const instagramService = new InstagramService({ accessToken: account.accessToken });
          const profile = await instagramService.getUserProfile();
          
          if (profile) {
            account.username = profile.username;
            account.displayName = profile.name ?? profile.username;
            account.profilePicture = profile.profile_picture_url;
            
            // Update stats
            account.stats.totalFollowers = profile.followers_count || 0;
            account.stats.totalFollowing = profile.follows_count || 0;
            account.stats.totalPosts = profile.media_count || 0;
            
            account.lastSyncAt = new Date();
            
            await account.save();
          }
          
          updatedAccount = account.toObject();
          break;

        default:
          throw new ApiError(400, `Refresh not supported for platform: ${account.platform}`);
      }

      // Remove sensitive data from response
      const { accessToken, refreshToken, ...safeAccount } = updatedAccount;
      updatedAccount = safeAccount;

      sendSuccess(res, { 
        account: updatedAccount,
        message: 'Account refreshed successfully'
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

    } catch (error) {
      console.error('Error refreshing account:', error);
      
      // Mark account as inactive if refresh fails
      account.isActive = false;
      account.lastErrorAt = new Date();
      account.lastError = error instanceof Error ? error.message : 'Unknown error';
      await account.save();

      throw new ApiError(400, 'Failed to refresh account. Please reconnect your account.');
    }
  });

  /**
   * Update platform account settings
   */
  updateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;
    const { displayName, isActive } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid account ID');
    }

    const account = await PlatformAccountModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!account) {
      throw new ApiError(404, 'Platform account not found');
    }

    // Update allowed fields
    if (displayName !== undefined) {
      account.displayName = displayName;
    }

    if (isActive !== undefined) {
      account.isActive = isActive;
    }

    await account.save();

    // Remove sensitive data from response
    const accountObj = account.toObject();
    const { accessToken, refreshToken, ...updatedAccount } = accountObj;

    sendSuccess(res, { 
      account: updatedAccount,
      message: 'Account updated successfully'
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Delete/disconnect platform account
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid account ID');
    }

    const account = await PlatformAccountModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!account) {
      throw new ApiError(404, 'Platform account not found');
    }

    // Soft delete the account
    account.deletedAt = new Date();
    account.isActive = false;
    await account.save();

    sendSuccess(res, { 
      message: 'Platform account disconnected successfully'
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get platform account statistics
   */
  getAccountStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;

    const stats = await PlatformAccountModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          deletedAt: null
        }
      },
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalStats = await PlatformAccountModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          activeAccounts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveAccounts: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    sendSuccess(res, {
      byPlatform: stats,
      overall: totalStats[0] || {
        totalAccounts: 0,
        activeAccounts: 0,
        inactiveAccounts: 0
      }
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });
}