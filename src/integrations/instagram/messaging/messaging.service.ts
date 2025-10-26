import axios from 'axios';
import logger from '../../../utils/logger';
import {
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  SetPersistentMenuRequest,
  SetPersistentMenuResponse,
  SetGetStartedRequest,
  SetGetStartedResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  MessageTemplate
} from './messaging.types';

/**
 * Instagram Messaging Service
 * Handles all messaging-related operations including DMs, templates, and bot features
 */
export class InstagramMessagingService {
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';

  /**
   * Send a message to a user
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const payload: any = {
        recipient: request.recipient,
        access_token: request.access_token
      };

      if (request.message) {
        payload.message = request.message;
      }

      if (request.sender_action) {
        payload.sender_action = request.sender_action;
      }

      logger.info('Sending Instagram message', {
        recipientId: request.recipient.id,
        hasText: !!request.message?.text,
        hasAttachment: !!request.message?.attachment,
        senderAction: request.sender_action
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/messages`, payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to send Instagram message', {
        recipientId: request.recipient.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(recipientId: string, accessToken: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      sender_action: 'typing_on',
      access_token: accessToken
    });
  }

  /**
   * Mark message as seen
   */
  async markMessageSeen(recipientId: string, accessToken: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      sender_action: 'mark_seen',
      access_token: accessToken
    });
  }

  /**
   * Send text message
   */
  async sendTextMessage(
    recipientId: string, 
    text: string, 
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: { text },
      access_token: accessToken
    });
  }

  /**
   * Send quick reply message
   */
  async sendQuickReplyMessage(
    recipientId: string,
    text: string,
    quickReplies: any[],
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        text,
        quick_replies: quickReplies
      },
      access_token: accessToken
    });
  }

  /**
   * Send generic template
   */
  async sendGenericTemplate(
    recipientId: string,
    elements: any[],
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements
          }
        }
      },
      access_token: accessToken
    });
  }

  /**
   * Send button template
   */
  async sendButtonTemplate(
    recipientId: string,
    text: string,
    buttons: any[],
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons
          }
        }
      },
      access_token: accessToken
    });
  }

  /**
   * Get incoming messages
   */
  async getMessages(request: GetMessagesRequest): Promise<GetMessagesResponse> {
    try {
      let url = `${this.graphUrl}/me/conversations?fields=messages{id,created_time,from,to,message,attachments}&access_token=${request.access_token}`;

      if (request.limit) {
        url += `&limit=${request.limit}`;
      }
      if (request.after) {
        url += `&after=${request.after}`;
      }
      if (request.before) {
        url += `&before=${request.before}`;
      }

      logger.info('Fetching Instagram messages', {
        limit: request.limit,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<any>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram messages', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      };
    }
  }

  /**
   * Set persistent menu
   */
  async setPersistentMenu(request: SetPersistentMenuRequest): Promise<SetPersistentMenuResponse> {
    try {
      const payload = {
        ...request.menu,
        access_token: request.access_token
      };

      logger.info('Setting Instagram persistent menu', {
        menuItems: request.menu.persistent_menu.length
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/messenger_profile`, payload);

      return {
        success: true,
        message: 'Persistent menu set successfully'
      };
    } catch (error) {
      logger.error('Failed to set Instagram persistent menu', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set persistent menu'
      };
    }
  }

  /**
   * Set get started button
   */
  async setGetStartedButton(request: SetGetStartedRequest): Promise<SetGetStartedResponse> {
    try {
      const payload = {
        ...request.get_started,
        access_token: request.access_token
      };

      logger.info('Setting Instagram get started button', {
        payload: request.get_started.get_started.payload
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/messenger_profile`, payload);

      return {
        success: true,
        message: 'Get started button set successfully'
      };
    } catch (error) {
      logger.error('Failed to set Instagram get started button', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set get started button'
      };
    }
  }

  /**
   * Create message template (local storage)
   */
  async createTemplate(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    try {
      const template: MessageTemplate = {
        id: Date.now().toString(),
        name: request.name,
        template_type: request.template_type,
        content: request.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logger.info('Creating message template', {
        name: request.name,
        type: request.template_type
      });

      // In a real implementation, you would save this to a database
      // For now, we'll just return the created template

      return {
        success: true,
        data: template
      };
    } catch (error) {
      logger.error('Failed to create message template', {
        name: request.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      };
    }
  }

  /**
   * Send image message
   */
  async sendImageMessage(
    recipientId: string,
    imageUrl: string,
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'image',
          url: imageUrl
        }
      },
      access_token: accessToken
    });
  }

  /**
   * Send video message
   */
  async sendVideoMessage(
    recipientId: string,
    videoUrl: string,
    accessToken: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'video',
          url: videoUrl
        }
      },
      access_token: accessToken
    });
  }
}

export const instagramMessagingService = new InstagramMessagingService();