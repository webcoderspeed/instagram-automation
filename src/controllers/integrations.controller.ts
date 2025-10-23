/**
 * Integrations Controller
 * Handles platform connections and integrations
 */

import { Request, Response } from "express";
import { PlatformAccountModel } from "../models/platform-account.model";
import { AutomationModel } from "../models/automation.model";
import { PostModel } from "../models/post.model";
import { OAuthService } from "../services/oauth/oauth-service";
import {
  INSTAGRAM_SCOPES,
  InstagramScopeValue,
} from "../services/oauth/types/scopes";
import logger from "../utils/logger";
import { AppError } from "../utils/app-error";
import asyncHandler from "express-async-handler";
import { sendSuccess, sendError, createMeta } from "../utils/response-builder";

export class IntegrationsController {
  private oauthService: OAuthService;

  constructor() {
    // Initialize OAuth service with Instagram configuration
    const scopes: InstagramScopeValue[] = [
      INSTAGRAM_SCOPES.BUSINESS_BASIC,
      INSTAGRAM_SCOPES.CONTENT_PUBLISH,
      INSTAGRAM_SCOPES.MANAGE_MESSAGES,
    ];

    this.oauthService = new OAuthService({
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || "",
      scopes,
    });
  }

  /**
   * Get all connected platforms for the user
   */
  getConnectedPlatforms = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const connectedPlatforms = await PlatformAccountModel.find({
      userId,
      isActive: true,
    }).select("platform username id isActive lastSyncAt");

    sendSuccess(
      res,
      connectedPlatforms,
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });

  /**
   * Get specific platform connection details
   */
  getPlatformConnection = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;

    const connection = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (!connection) {
      throw AppError.notFound(`${platform} connection`);
    }

    const connectionData = {
      platform: connection.platform,
      username: connection.username,
      userId: connection.id,
      isActive: connection.isActive,
      lastSync: connection.lastSyncAt,
      permissions: connection.permissions,
    };

    sendSuccess(
      res,
      connectionData,
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });

  /**
   * Initiate platform connection (OAuth flow)
   */
  initiateConnection = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;
    const { redirectUrl } = req.body;

    // Validate platform
    const supportedPlatforms = [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
    ];
    if (!supportedPlatforms.includes(platform)) {
      throw AppError.validation("Unsupported platform");
    }

    // Check if user already has this platform connected
    const existingConnection = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (existingConnection) {
      throw AppError.conflict(`${platform} account is already connected`);
    }

    // Generate proper OAuth URL using OAuth service
    const { url: authUrl, state } =
      this.oauthService.generateAuthorizationUrl();

    // Store state for verification (in production, store this in Redis or database)
    logger.info("OAuth flow initiated", { userId, platform, state });

    const authData = {
      authUrl,
      state,
      platform,
    };

    sendSuccess(
      res,
      authData,
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });

  /**
   * Handle OAuth callback and complete connection
   */
  handleCallback = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;
    const { code, state } = req.body;

    if (!code) {
      throw AppError.validation("Authorization code is required");
    }

    try {
      // Exchange authorization code for access token
      const shortLivedToken = await this.oauthService.exchangeCodeForToken(
        code,
        state
      );

      // Exchange short-lived token for long-lived token
      const longLivedToken = await this.oauthService.getLongLivedToken(
        shortLivedToken.accessToken
      );

      // Get user info from Instagram
      const userInfo = await this.oauthService.getUserInfo(
        longLivedToken.accessToken
      );

      const platformData = {
        userId: userInfo.id,
        username: userInfo.username,
        accessToken: longLivedToken.accessToken,
        refreshToken: null, // Instagram doesn't provide refresh tokens for long-lived tokens
        expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
        permissions: [
          "instagram_business_basic",
          "instagram_business_content_publish",
          "instagram_business_manage_messages",
        ],
      };

      // Create or update platform account
      const platformAccount = await PlatformAccountModel.findOneAndUpdate(
        { userId, platform },
        {
          userId,
          platform,
          id: platformData.userId,
          username: platformData.username,
          accessToken: platformData.accessToken,
          refreshToken: platformData.refreshToken,
          tokenExpiresAt: platformData.expiresAt,
          permissions: platformData.permissions || [],
          isActive: true,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );

      logger.info("Platform connected successfully", {
        userId,
        platform,
        id: platformData.userId,
      });

      const responseData = {
        platform: platformAccount.platform,
        username: platformAccount.username,
        userId: platformAccount.id,
        message: `${platform} account connected successfully`,
      };

      sendSuccess(
        res,
        responseData,
        200,
        createMeta({
          requestId: req.headers["x-request-id"] as string,
        })
      );
    } catch (error) {
      logger.error("OAuth callback error", { userId, platform, error });
      throw AppError.externalService(
        platform,
        error as Record<string, unknown>
      );
    }
  });

  /**
   * Disconnect platform account
   */
  disconnectPlatform = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;

    const platformAccount = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (!platformAccount) {
      throw AppError.notFound(`${platform} connection`);
    }

    // Deactivate the account instead of deleting
    platformAccount.isActive = false;
    platformAccount.deletedAt = new Date();
    await platformAccount.save();

    // Optionally, pause related automations
    await AutomationModel.updateMany(
      {
        userId,
        "platforms.platform": platform,
        status: "active",
      },
      { status: "paused" }
    );

    logger.info("Platform disconnected", { userId, platform });

    sendSuccess(
      res,
      { message: `${platform} account disconnected successfully` },
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });

  /**
   * Refresh platform tokens
   */
  refreshTokens = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;

    const platformAccount = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (!platformAccount) {
      throw AppError.notFound(`${platform} connection`);
    }

    // For Instagram, long-lived tokens don't have refresh tokens
    // Instead, we refresh the existing long-lived token
    try {
      // Refresh the long-lived token using OAuth service
      const refreshedToken = await this.oauthService.refreshToken(
        platformAccount.accessToken
      );

      // Update tokens
      platformAccount.accessToken = refreshedToken.accessToken;
      platformAccount.tokenExpiresAt = new Date(
        Date.now() + refreshedToken.expiresIn * 1000
      );
      await platformAccount.save();

      logger.info("Tokens refreshed successfully", { userId, platform });

      sendSuccess(
        res,
        { message: "Tokens refreshed successfully" },
        200,
        createMeta({
          requestId: req.headers["x-request-id"] as string,
        })
      );
    } catch (error) {
      logger.error("Token refresh error", { userId, platform, error });
      throw AppError.externalService(
        platform,
        error as Record<string, unknown>
      );
    }
  });

  /**
   * Test platform connection
   */
  testConnection = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;

    const platformAccount = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (!platformAccount) {
      throw AppError.notFound(`${platform} connection`);
    }

    try {
      // Test connection by validating token and getting user info
      const tokenValidation = await this.oauthService.validateToken(
        platformAccount.accessToken
      );

      if (!tokenValidation.isValid) {
        throw new Error("Token is invalid or expired");
      }

      // Get fresh user info to verify connection
      const userInfo = await this.oauthService.getUserInfo(
        platformAccount.accessToken
      );

      const testResult = {
        success: true,
        message: "Connection test successful",
        userInfo: {
          id: userInfo.id,
          username: userInfo.username,
          accountType: userInfo.accountType,
          mediaCount: userInfo.mediaCount,
          verified: true,
        },
      };

      // Update last sync time
      platformAccount.lastSyncAt = new Date();
      await platformAccount.save();

      const responseData = {
        platform,
        status: "connected",
        lastTested: new Date(),
        details: testResult,
        message: "Connection test successful",
      };

      sendSuccess(
        res,
        responseData,
        200,
        createMeta({
          requestId: req.headers["x-request-id"] as string,
        })
      );
    } catch (error) {
      logger.error("Connection test failed", { userId, platform, error });

      // Mark connection as potentially invalid
      platformAccount.lastSyncAt = new Date();
      await platformAccount.save();

      const errorData = {
        platform,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };

      sendError(
        res,
        {
          message: "Connection test failed",
          code: "CONNECTION_TEST_FAILED",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
          details: errorData,
        },
        400
      );
    }
  });

  /**
   * Get platform insights and analytics
   */
  getPlatformInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { platform } = req.params;
    const { timeframe = "30d" } = req.query;

    const platformAccount = await PlatformAccountModel.findOne({
      userId,
      platform,
      isActive: true,
    });

    if (!platformAccount) {
      throw AppError.notFound(`${platform} connection`);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get posts analytics for this platform
    const posts = await PostModel.find({
      userId,
      platform: platform,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Calculate insights
    const insights = {
      totalPosts: posts.length,
      totalEngagement: posts.reduce((sum, post) => {
        return (
          sum +
          (post.analytics?.likes || 0) +
          (post.analytics?.comments || 0) +
          (post.analytics?.shares || 0)
        );
      }, 0),
      averageEngagement: 0,
      topPerformingPost: null as any,
      engagementTrend: [] as any[],
    };

    if (insights.totalPosts > 0) {
      insights.averageEngagement =
        insights.totalEngagement / insights.totalPosts;

      // Find top performing post
      const topPost = posts.reduce((best, current) => {
        const currentEngagement =
          (current.analytics?.likes || 0) +
          (current.analytics?.comments || 0) +
          (current.analytics?.shares || 0);
        const bestEngagement = best
          ? (best.analytics?.likes || 0) +
            (best.analytics?.comments || 0) +
            (best.analytics?.shares || 0)
          : 0;

        return currentEngagement > bestEngagement ? current : best;
      });

      if (topPost) {
        insights.topPerformingPost = {
          id: topPost._id,
          content: topPost.content.text
            ? topPost.content.text.substring(0, 100) + "..."
            : "No text content",
          engagement:
            (topPost.analytics?.likes || 0) +
            (topPost.analytics?.comments || 0) +
            (topPost.analytics?.shares || 0),
          publishedAt: topPost.publishedAt,
        };
      }
    }

    const responseData = {
      platform,
      timeframe,
      insights,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    sendSuccess(
      res,
      responseData,
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });

  /**
   * Get available platforms for connection
   */
  getAvailablePlatforms = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Get currently connected platforms
    const connectedPlatforms = await PlatformAccountModel.find({
      userId,
      isActive: true,
    }).select("platform");

    const connectedPlatformNames = connectedPlatforms.map((cp) => cp.platform);

    const availablePlatforms = [
      {
        platform: "instagram",
        name: "Instagram",
        description:
          "Connect your Instagram account to schedule posts and stories",
        icon: "instagram",
        isConnected: connectedPlatformNames.includes("instagram"),
        features: [
          "Post scheduling",
          "Story scheduling",
          "Analytics",
          "Auto-posting",
        ],
        accounts: [] as any[],
      },
      {
        platform: "facebook",
        name: "Facebook",
        description: "Manage your Facebook pages and schedule posts",
        icon: "facebook",
        isConnected: connectedPlatformNames.includes("facebook"),
        features: [
          "Page management",
          "Post scheduling",
          "Analytics",
          "Auto-posting",
        ],
        accounts: [] as any[],
      },
      {
        platform: "twitter",
        name: "Twitter",
        description: "Schedule tweets and manage your Twitter presence",
        icon: "twitter",
        isConnected: connectedPlatformNames.includes("twitter"),
        features: [
          "Tweet scheduling",
          "Thread posting",
          "Analytics",
          "Auto-posting",
        ],
        accounts: [] as any[],
      },
      {
        platform: "linkedin",
        name: "LinkedIn",
        description: "Share professional content on LinkedIn",
        icon: "linkedin",
        isConnected: connectedPlatformNames.includes("linkedin"),
        features: ["Post scheduling", "Company page management", "Analytics"],
        accounts: [] as any[],
      },
      {
        platform: "tiktok",
        name: "TikTok",
        description: "Schedule and manage your TikTok content",
        icon: "tiktok",
        isConnected: connectedPlatformNames.includes("tiktok"),
        features: ["Video scheduling", "Analytics", "Content management"],
        accounts: [] as any[],
      },
    ];

    // Add connected account details
    for (const platform of availablePlatforms) {
      if (platform.isConnected) {
        const accounts = await PlatformAccountModel.find({
          userId,
          platform: platform.platform,
          isActive: true,
        }).select("username id lastSyncAt");

        platform.accounts = accounts.map((account) => ({
          username: account.username,
          userId: account.id,
          lastSync: account.lastSyncAt,
        }));
      }
    }

    sendSuccess(
      res,
      availablePlatforms,
      200,
      createMeta({
        requestId: req.headers["x-request-id"] as string,
      })
    );
  });
}
