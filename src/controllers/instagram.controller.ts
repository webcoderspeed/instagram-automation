import { Request, Response } from "express";
import { instagramIntegrationService } from "../integrations";
import { instagramService } from "../services/instagram";
import { asyncHandler } from "../middleware/error.middleware";
import logger from "../utils/logger";
import { sendSuccess, sendError, createMeta } from "../utils/response-builder";
import { AppError } from "../utils/app-error";
import { UserModel } from "../models/user.model";
import { PlatformAccount } from "../types/platform.types";
import { AuthenticatedUser } from "../types/user.types";
import { PlatformAccountModel } from "../models/platform-account.model";
import { mapToPlatformAccountDocument } from "../utils/platform-account.mapper";
import { PlatformAccountEncryption } from "../utils/platform-account-encryption";

export class InstagramController {
  /**
   * Initiate Instagram OAuth connection
   */
  connect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.session.user) {
      sendError(
        res,
        "Authentication required",
        401,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
      return;
    }

    try {
      const userId = req.session.user.id;
      const { authUrl, state } = instagramIntegrationService.getAuthUrl(userId);

      logger.info("Generated Instagram OAuth URL", { userId, state });

      sendSuccess(
        res,
        {
          authUrl,
          state,
          message: "Instagram authorization URL generated successfully",
        },
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    } catch (error) {
      logger.error("Error generating Instagram OAuth URL:", error);
      sendError(
        res,
        error instanceof Error
          ? error.message
          : "Failed to generate authorization URL",
        500,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  });

  /**
   * Handle Instagram OAuth callback
   */
  callback = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { code, state, error: oauthError } = req.query;

        console.log("Received Instagram callback:", {
          code,
          state,
          oauthError,
        });

        // Check for OAuth errors
        if (oauthError) {
          logger.error("Instagram OAuth error:", { error: oauthError });
          sendError(
            res,
            `Instagram OAuth error: ${oauthError}`,
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          sendError(
            res,
            "Missing required OAuth parameters",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Since this is a non-protected route, we need to get the userId from the state
        // The state is stored in the auth service's Map, so we need to validate it first
        const userId = instagramIntegrationService.auth.getUserIdFromState(
          state as string
        );
        if (!userId) {
          sendError(
            res,
            "Invalid or expired OAuth state",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Get user by ID
        const user = await this.getUserById(userId);
        if (!user) {
          sendError(
            res,
            "User not found",
            404,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        logger.info("Processing Instagram OAuth callback", {
          code: typeof code === "string" ? code.substring(0, 10) : "invalid",
          state,
          userId,
        });

        // Convert UserDocument to AuthenticatedUser format
        const authenticatedUser: AuthenticatedUser = {
          id: String(user._id),
          _id: String(user._id),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          connectedAccounts: {}, // Will be populated by the integration service if needed
        };

        // Handle the OAuth callback
        const result = await instagramIntegrationService.handleCallback(
          code as string,
          state as string,
          authenticatedUser
        );

        if (!result.success || !result.platformAccount) {
          sendError(
            res,
            result.error || "Failed to connect Instagram account",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Save platform account to database
        const platformAccount = await this.savePlatformAccount(userId, result.platformAccount);

        // save to user (only if not already connected)
        await UserModel.findByIdAndUpdate(user._id, {
          $addToSet: { platformAccounts: platformAccount._id },
        });

        logger.info("Platform account saved successfully", {
          userId,
          platform: platformAccount.platform,
        });

        // Return success response with account info
        sendSuccess(
          res,
          {
            platform: "instagram",
            platformId: result.platformAccount.platformUserId,
            username: result.platformAccount.username,
            displayName: result.platformAccount.displayName,
            profilePicture: result.platformAccount.profilePicture,
            isActive: result.platformAccount.isActive,
            message: "Instagram account connected successfully",
          },
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error handling Instagram OAuth callback:", error);

        if (error instanceof AppError) {
          sendError(
            res,
            error.message,
            error.statusCode,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
        } else {
          sendError(
            res,
            "Failed to process Instagram OAuth callback",
            500,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
        }
      }
    }
  );

  /**
   * Disconnect Instagram account
   */
  disconnect = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const userId = req.session.user.id;

        // Find and deactivate the Instagram platform account
        const { PlatformAccountModel } = await import(
          "../models/platform-account.model"
        );
        const platformAccount = await PlatformAccountModel.findOne({
          userId,
          platform: "instagram",
          isActive: true,
        });

        // Decrypt tokens after retrieval
        PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

        if (!platformAccount) {
          sendError(
            res,
            "No active Instagram connection found",
            404,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Soft delete the platform account
        await platformAccount.softDelete();

        logger.info("Instagram account disconnected", {
          userId,
          platformId: platformAccount.id,
        });

        sendSuccess(
          res,
          {
            message: "Instagram account disconnected successfully",
          },
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error disconnecting Instagram account:", error);
        sendError(
          res,
          error instanceof Error
            ? error.message
            : "Failed to disconnect Instagram account",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Get connected Instagram account status
   */
  getConnectionStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        // Check and refresh token if needed
        await instagramIntegrationService.checkAndRefreshTokenFromDB(
          req.session.user.id
        );

        // Get connection status
        const status =
          await instagramIntegrationService.getConnectionStatusFromDB(
            req.session.user.id
          );

        if (!status.isConnected) {
          sendSuccess(
            res,
            {
              connected: false,
              message: "No Instagram account connected",
            },
            200,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        // Test connection
        const connectionTest =
          await instagramIntegrationService.testConnectionFromDB(
            req.session.user.id
          );

        sendSuccess(
          res,
          {
            connected: status.isConnected,
            platform: "instagram",
            accountInfo: status.accountInfo,
            tokenStatus: status.tokenStatus,
            connectionTest,
            message: "Instagram connection status retrieved successfully",
          },
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error getting Instagram connection status:", error);
        sendError(
          res,
          error instanceof Error
            ? error.message
            : "Failed to get connection status",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const accessToken = await this.getAccessTokenForUser(req.session.user.id);
      if (!accessToken) {
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token and get profile
      instagramService.setConfig({ accessToken });
      const profile = await instagramService.getUserProfile();
      sendSuccess(
        res,
        profile,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getMedia = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const accessToken = await this.getAccessTokenForUser(req.session.user.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;

      if (!accessToken) {
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token and get media
      instagramService.setConfig({ accessToken });
      const media = await instagramService.getUserMedia(limit);
      sendSuccess(
        res,
        media,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getMediaById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const accessToken = req.query.access_token as string;

      if (!accessToken) {
        sendError(
          res,
          "Access token is required",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      if (!id) {
        sendError(
          res,
          "Media ID is required",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token and get media details
      instagramService.setConfig({ accessToken });
      const media = await instagramService.getMediaDetails(id);
      sendSuccess(
        res,
        media,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  publishPost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const { image_url, caption } = req.body;
      const accessToken = await this.getAccessTokenForUser(req.session.user.id);

      if (!accessToken) {
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      if (!image_url) {
        sendError(
          res,
          "Image URL is required",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token
      instagramService.setConfig({ accessToken });

      // First, create the media container
      const containerResponse = await instagramService.createMediaContainer(
        image_url,
        caption || ""
      );

      if (!containerResponse?.id) {
        sendError(
          res,
          "Failed to create media container",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Then publish the media
      const publishResponse = await instagramService.publishMedia(
        containerResponse.id
      );

      sendSuccess(
        res,
        {
          success: true,
          container_id: containerResponse.id,
          media_id: publishResponse?.id,
          message: "Post published successfully",
        },
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getMediaInsights = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const { id } = req.params;
      const accessToken = await this.getAccessTokenForUser(req.session.user.id);

      if (!accessToken) {
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      if (!id) {
        sendError(
          res,
          "Media ID is required",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token and get insights
      instagramService.setConfig({ accessToken });
      const insights = await instagramService.getMediaInsights(id);
      sendSuccess(
        res,
        insights,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getAccountInsights = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const accessToken = await this.getAccessTokenForUser(req.session.user.id);
      const period = (req.query.period as "day" | "week" | "days_28") || "day";

      logger.info("Instagram insights request", {
        userId: req.session.user.id,
        period,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
      });

      if (!accessToken) {
        logger.error("Instagram access token not found for user", {
          userId: req.session.user.id,
        });
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Use integration service for insights
      logger.info("Calling integration service for insights", { period });
      const insights = await instagramIntegrationService.getAccountInsights(
        accessToken,
        period
      );

      logger.info("Insights response received", {
        success: insights.success,
        hasData: !!insights.data,
        error: insights.error,
      });

      sendSuccess(
        res,
        insights,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getHashtagInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      const { hashtag } = req.params;
      const accessToken = await this.getAccessTokenForUser(req.session.user.id);

      if (!accessToken) {
        sendError(
          res,
          "Instagram credentials not found",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      if (!hashtag) {
        sendError(
          res,
          "Hashtag is required",
          400,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      // Set access token and get hashtag info
      instagramService.setConfig({ accessToken });
      const hashtagInfo = await instagramService.getHashtagInfo(hashtag);
      sendSuccess(
        res,
        hashtagInfo,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  getRateLimit = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const rateLimitInfo = instagramService.getRateLimitStatus();
      sendSuccess(
        res,
        rateLimitInfo,
        200,
        createMeta({ requestId: req.headers["x-request-id"] as string })
      );
    }
  );

  /**
   * Send a text message to a user
   */
  sendMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId, text } = req.body;
        const userId = req.session.user.id;

        if (!recipientId || !text) {
          sendError(
            res,
            "Recipient ID and text are required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendTextMessage(
          recipientId,
          text,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send message",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending message:", error);
        sendError(
          res,
          "Failed to send message",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Send an image message to a user
   */
  sendImageMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId, imageUrl } = req.body;
        const userId = req.session.user.id;

        if (!recipientId || !imageUrl) {
          sendError(
            res,
            "Recipient ID and image URL are required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendImageMessage(
          recipientId,
          imageUrl,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send image message",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending image message:", error);
        sendError(
          res,
          "Failed to send image message",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Send a video message to a user
   */
  sendVideoMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId, videoUrl } = req.body;
        const userId = req.session.user.id;

        if (!recipientId || !videoUrl) {
          sendError(
            res,
            "Recipient ID and video URL are required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendVideoMessage(
          recipientId,
          videoUrl,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send video message",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending video message:", error);
        sendError(
          res,
          "Failed to send video message",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Get messages/conversations
   */
  getMessages = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const userId = req.session.user.id;
        const { limit, after, before } = req.query;

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.getMessages({
          access_token: accessToken,
          limit: limit ? parseInt(limit as string) : undefined,
          after: after as string,
          before: before as string
        });

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to get messages",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error getting messages:", error);
        sendError(
          res,
          "Failed to get messages",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Send typing indicator
   */
  sendTypingIndicator = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId } = req.body;
        const userId = req.session.user.id;

        if (!recipientId) {
          sendError(
            res,
            "Recipient ID is required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendTypingIndicator(
          recipientId,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send typing indicator",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending typing indicator:", error);
        sendError(
          res,
          "Failed to send typing indicator",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Mark message as seen
   */
  markMessageSeen = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId } = req.body;
        const userId = req.session.user.id;

        if (!recipientId) {
          sendError(
            res,
            "Recipient ID is required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.markMessageSeen(
          recipientId,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to mark message as seen",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error marking message as seen:", error);
        sendError(
          res,
          "Failed to mark message as seen",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Send quick reply message
   */
  sendQuickReplyMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId, text, quickReplies } = req.body;
        const userId = req.session.user.id;

        if (!recipientId || !text || !quickReplies) {
          sendError(
            res,
            "Recipient ID, text, and quick replies are required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendQuickReplyMessage(
          recipientId,
          text,
          quickReplies,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send quick reply message",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending quick reply message:", error);
        sendError(
          res,
          "Failed to send quick reply message",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Send button template message
   */
  sendButtonTemplate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.session.user) {
        sendError(
          res,
          "Authentication required",
          401,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
        return;
      }

      try {
        const { recipientId, text, buttons } = req.body;
        const userId = req.session.user.id;

        if (!recipientId || !text || !buttons) {
          sendError(
            res,
            "Recipient ID, text, and buttons are required",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const accessToken = await this.getAccessTokenForUser(userId);
        if (!accessToken) {
          sendError(
            res,
            "Instagram account not connected",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        const result = await instagramIntegrationService.messaging.sendButtonTemplate(
          recipientId,
          text,
          buttons,
          accessToken
        );

        if (!result.success) {
          sendError(
            res,
            result.error || "Failed to send button template",
            400,
            createMeta({ requestId: req.headers["x-request-id"] as string })
          );
          return;
        }

        sendSuccess(
          res,
          result.data,
          200,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      } catch (error) {
        logger.error("Error sending button template:", error);
        sendError(
          res,
          "Failed to send button template",
          500,
          createMeta({ requestId: req.headers["x-request-id"] as string })
        );
      }
    }
  );

  /**
   * Helper method to get access token for user from platform account
   */
  private async getAccessTokenForUser(userId: string): Promise<string | null> {
    try {
      const platformAccount = await PlatformAccountModel.findOne({
        userId,
        platform: "instagram",
        isActive: true,
        deletedAt: null,
      }).select("+accessToken");

      console.log("platformAccount", platformAccount);

      if (!platformAccount) {
        logger.warn("No Instagram platform account found", { userId });
        return null;
      }

      // Decrypt tokens after retrieval
      // PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

      // Check if account has an error status (e.g., decryption failed)
      if (platformAccount.status === "error") {
        logger.warn("Instagram platform account has error status", {
          userId,
          error: platformAccount.lastError,
          errorAt: platformAccount.lastErrorAt,
        });
        return null;
      }

      if (!platformAccount.accessToken) {
        logger.warn(
          "No access token available for Instagram platform account",
          { userId }
        );
        return null;
      }

      // Check if token is expired
      if (platformAccount.isTokenExpired()) {
        logger.warn("Instagram access token is expired", { userId });
        return null;
      }

      return platformAccount.accessToken;
    } catch (error) {
      logger.error("Error fetching access token for user:", { userId, error });
      return null;
    }
  }

  /**
   * Helper method to get user by ID
   */
  private async getUserById(userId: string) {
    try {
      const user = await UserModel.findById(userId).select("-passwordHash");
      return user;
    } catch (error) {
      logger.error("Error fetching user by ID:", { userId, error });
      return null;
    }
  }

  /**
   * Helper method to save platform account to database
   */
  private async savePlatformAccount(
    userId: string,
    platformAccount: PlatformAccount
  ) {
    try {
      // Map PlatformAccount interface to Mongoose schema format
      const mappedAccount = mapToPlatformAccountDocument(platformAccount);

      // Check if platform account already exists
      const existingAccount = await PlatformAccountModel.findOne({
        userId,
        platform: platformAccount.platform,
        id: platformAccount.platformUserId, // Use platformUserId to match id in schema
      });

      if (existingAccount) {
        // Update existing account
        const encryptedData =
          PlatformAccountEncryption.encryptTokensBeforeSave(mappedAccount);
        console.log("encryptedData", {
          platformAccount,
          encryptedData,
        });
        Object.assign(existingAccount, encryptedData);
        await existingAccount.save();

        logger.info("Platform account saved successfully", {
          userId,
          platform: platformAccount.platform,
          platformUserId: platformAccount.platformUserId,
        });

        return existingAccount;
      } else {
        // Create new account
        const encryptedData =
          PlatformAccountEncryption.encryptTokensBeforeSave(mappedAccount);
        console.log("encryptedData", {
          platformAccount,
          encryptedData,
        });

        logger.info("Platform account saved successfully", {
          userId,
          platform: platformAccount.platform,
          platformUserId: platformAccount.platformUserId,
        });
        const newAccount = await PlatformAccountModel.create(encryptedData);

        return newAccount;
      }
    } catch (error) {
      logger.error("Failed to save platform account:", error);
      throw new AppError("Failed to save platform account", 500);
    }
  }
}
