import logger from '../utils/logger';

export interface PrivateReplyRequest {
  commentId: string;
  message: string;
  accessToken: string;
  instagramUserId: string;
}

export interface DirectMessageRequest {
  recipientId: string;
  message: string;
  accessToken: string;
  instagramUserId: string;
}

export interface MessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface MessageContent {
  text?: string;
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'file';
    payload: {
      url: string;
    };
  };
}

export class InstagramMessagingService {
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.baseUrl = process.env.INSTAGRAM_GRAPH_API_BASE_URL || 'https://graph.instagram.com';
    this.apiVersion = process.env.INSTAGRAM_API_VERSION || 'v21.0';
    
    logger.info('Instagram Messaging Service initialized');
  }

  /**
   * Send a private reply to a comment on Instagram post, reel, story, or Live
   * Based on: https://developers.facebook.com/docs/instagram-platform/private-replies
   */
  async sendPrivateReply(request: PrivateReplyRequest): Promise<MessageResponse | null> {
    try {
      logger.info('Sending private reply to comment', {
        commentId: request.commentId,
        instagramUserId: request.instagramUserId,
        messageLength: request.message.length
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${request.instagramUserId}/messages`;
      
      const payload = {
        recipient: {
          comment_id: request.commentId
        },
        message: {
          text: request.message
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to send private reply', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          commentId: request.commentId
        });
        return null;
      }

      const result = await response.json() as MessageResponse;
      
      logger.info('Private reply sent successfully', {
        commentId: request.commentId,
        recipientId: result.recipient_id,
        messageId: result.message_id
      });

      return result;

    } catch (error) {
      logger.error('Error sending private reply', {
        error: error instanceof Error ? error.message : String(error),
        commentId: request.commentId
      });
      return null;
    }
  }

  /**
   * Send a direct message to an Instagram user
   * Based on: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
   * Note: Can only send messages to users who have previously messaged the Instagram professional account
   */
  async sendDirectMessage(request: DirectMessageRequest): Promise<MessageResponse | null> {
    try {
      logger.info('Sending direct message', {
        recipientId: request.recipientId,
        instagramUserId: request.instagramUserId,
        messageLength: request.message.length
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${request.instagramUserId}/messages`;
      
      const payload = {
        recipient: {
          id: request.recipientId
        },
        message: {
          text: request.message
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to send direct message', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          recipientId: request.recipientId
        });
        return null;
      }

      const result = await response.json() as MessageResponse;
      
      logger.info('Direct message sent successfully', {
        recipientId: request.recipientId,
        messageId: result.message_id
      });

      return result;

    } catch (error) {
      logger.error('Error sending direct message', {
        error: error instanceof Error ? error.message : String(error),
        recipientId: request.recipientId
      });
      return null;
    }
  }

  /**
   * Send a message with media attachment
   */
  async sendMessageWithMedia(
    instagramUserId: string,
    recipientId: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio',
    accessToken: string,
    text?: string
  ): Promise<MessageResponse | null> {
    try {
      logger.info('Sending message with media', {
        recipientId,
        mediaType,
        mediaUrl,
        hasText: !!text
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramUserId}/messages`;
      
      const message: MessageContent = {
        attachment: {
          type: mediaType,
          payload: {
            url: mediaUrl
          }
        }
      };

      if (text) {
        message.text = text;
      }

      const payload = {
        recipient: {
          id: recipientId
        },
        message
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to send message with media', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          recipientId
        });
        return null;
      }

      const result = await response.json() as MessageResponse;
      
      logger.info('Message with media sent successfully', {
        recipientId,
        messageId: result.message_id,
        mediaType
      });

      return result;

    } catch (error) {
      logger.error('Error sending message with media', {
        error: error instanceof Error ? error.message : String(error),
        recipientId
      });
      return null;
    }
  }

  /**
   * Get conversation history with a user
   */
  async getConversation(
    instagramUserId: string,
    userId: string,
    accessToken: string,
    limit: number = 25
  ): Promise<any | null> {
    try {
      logger.info('Getting conversation history', {
        instagramUserId,
        userId,
        limit
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramUserId}/conversations`;
      const params = new URLSearchParams({
        user_id: userId,
        limit: limit.toString(),
        access_token: accessToken
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to get conversation', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          userId
        });
        return null;
      }

   const result = await response.json() as any;
      
      logger.info('Conversation history retrieved successfully', {
        instagramUserId,
        userId,
        messagesCount: result.data?.length || 0
      });

      return result;

    } catch (error) {
      logger.error('Error getting conversation', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return null;
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(
    instagramUserId: string,
    userId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      logger.info('Marking conversation as read', {
        instagramUserId,
        userId
      });

      const url = `${this.baseUrl}/${this.apiVersion}/${instagramUserId}/conversations`;
      
      const payload = {
        user_id: userId,
        read: true
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Failed to mark conversation as read', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          userId
        });
        return false;
      }

      logger.info('Conversation marked as read successfully', { userId });
      return true;

    } catch (error) {
      logger.error('Error marking conversation as read', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return false;
    }
  }
}

export const messagingService = new InstagramMessagingService();