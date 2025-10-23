/**
 * Message Types
 * Types and interfaces for messaging and conversations
 */

import { BaseEntity, SocialPlatform, MediaFile, PaginationParams } from './common.types';
import { DaySchedule } from './user.types';

export interface Conversation extends BaseEntity {
  accountId: string;
  platform: SocialPlatform;
  platformConversationId: string;
  participantId: string;
  participantUsername: string;
  participantDisplayName: string;
  participantProfilePicture?: string;
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  tags: string[];
  assignedTo?: string;
  status: ConversationStatus;
  metadata?: Record<string, any>;
}

export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'spam' | 'archived';

export interface Message extends BaseEntity {
  conversationId: string;
  platform: SocialPlatform;
  platformMessageId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  recipientId: string;
  content: string;
  media?: MediaFile[];
  messageType: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  readAt?: Date;
  deliveredAt?: Date;
  isAutomated: boolean;
  automationRuleId?: string;
  replyToMessageId?: string;
  reactions?: MessageReaction[];
  metadata?: Record<string, any>;
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'gif'
  | 'quick_reply'
  | 'template'
  | 'carousel'
  | 'button'
  | 'list';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageReaction {
  userId: string;
  username: string;
  emoji: string;
  createdAt: Date;
}

export interface MessageTemplate extends BaseEntity {
  name: string;
  description?: string;
  platform: SocialPlatform;
  category: TemplateCategory;
  language: string;
  content: string;
  media?: MediaFile[];
  variables: TemplateVariable[];
  buttons?: TemplateButton[];
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export type TemplateCategory = 
  | 'greeting'
  | 'goodbye'
  | 'faq'
  | 'support'
  | 'marketing'
  | 'notification'
  | 'confirmation'
  | 'reminder'
  | 'custom';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email' | 'phone';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface TemplateButton {
  type: 'url' | 'postback' | 'phone' | 'quick_reply';
  title: string;
  value: string;
  payload?: string;
}

export interface AutoReplyRule extends BaseEntity {
  name: string;
  description?: string;
  accountId: string;
  platform: SocialPlatform;
  isActive: boolean;
  priority: number;
  conditions: AutoReplyCondition[];
  actions: AutoReplyAction[];
  schedule?: AutoReplySchedule;
  usageCount: number;
  lastTriggeredAt?: Date;
}

export interface AutoReplyCondition {
  type: 'keyword' | 'sentiment' | 'language' | 'time' | 'user_type' | 'message_type';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'not_contains';
  value: string | string[];
  caseSensitive?: boolean;
}

export interface AutoReplyAction {
  type: 'send_message' | 'send_template' | 'tag_conversation' | 'assign_to' | 'mark_as_read';
  value: string;
  delay?: number; // in seconds
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface AutoReplySchedule {
  timezone: string;
  businessHours: {
    enabled: boolean;
    schedule: DaySchedule[];
  };
  holidays: Date[];
  blackoutDates: DateRange[];
}



export interface DateRange {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface QuickReply extends BaseEntity {
  accountId: string;
  title: string;
  content: string;
  category: string;
  platform?: SocialPlatform;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface MessageSearchParams extends PaginationParams {
  conversationId?: string;
  platform?: SocialPlatform;
  messageType?: MessageType;
  direction?: MessageDirection;
  status?: MessageStatus;
  isAutomated?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  query?: string;
}

export interface ConversationSearchParams extends PaginationParams {
  platform?: SocialPlatform;
  status?: ConversationStatus;
  assignedTo?: string;
  isArchived?: boolean;
  isMuted?: boolean;
  hasUnread?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  query?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  media?: MediaFile[];
  replyToMessageId?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  platform: SocialPlatform;
  category: TemplateCategory;
  language: string;
  content: string;
  media?: MediaFile[];
  variables?: TemplateVariable[];
  buttons?: TemplateButton[];
}

export interface UpdateConversationRequest {
  status?: ConversationStatus;
  assignedTo?: string;
  isArchived?: boolean;
  isMuted?: boolean;
  tags?: string[];
}