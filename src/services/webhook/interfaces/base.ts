/**
 * Base interfaces for Facebook/Instagram Webhook Events
 * Based on official documentation: https://developers.facebook.com/docs/messenger-platform/reference/webhook-events
 */

export interface WebhookEvent {
  object: 'page' | 'instagram';
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  time: number;
  changes?: WebhookChange[];
  messaging?: WebhookMessaging[];
  standby?: WebhookMessaging[];
}

export interface WebhookChange {
  field: string;
  value: any;
}

export interface WebhookSender {
  id: string;
  username?: string;
}

export interface WebhookRecipient {
  id: string;
}

export interface WebhookMessaging {
  sender: WebhookSender;
  recipient: WebhookRecipient;
  timestamp: number;
  message?: MessageData;
  delivery?: DeliveryData;
  read?: ReadData;
  postback?: PostbackData;
  referral?: ReferralData;
  optin?: OptinData;
  account_linking?: AccountLinkingData;
  pass_thread_control?: PassThreadControlData;
  take_thread_control?: TakeThreadControlData;
  request_thread_control?: RequestThreadControlData;
  app_roles?: AppRolesData;
  reaction?: ReactionData;
  message_edit?: MessageEditData;
  game_play?: GamePlayData;
}

export interface MessageData {
  mid: string;
  text?: string;
  attachments?: AttachmentData[];
  quick_reply?: QuickReplyData;
  reply_to?: ReplyToData;
  referral?: ReferralData;
  is_echo?: boolean;
  is_deleted?: boolean;
  is_unsupported?: boolean;
  app_id?: string;
  metadata?: string;
}

export interface AttachmentData {
  type: 'image' | 'video' | 'audio' | 'file' | 'template' | 'fallback' | 'share' | 'story_mention' | 'ig_reel' | 'reel';
  payload: {
    url?: string;
    title?: string;
    template_type?: string;
    elements?: any[];
    product?: any;
    [key: string]: any;
  };
}

export interface QuickReplyData {
  payload: string;
}

export interface ReplyToData {
  mid: string;
  story?: {
    url: string;
    id: string;
  };
  is_self_reply?: boolean;
}

export interface DeliveryData {
  mids?: string[];
  watermark: number;
}

export interface ReadData {
  mid: string;
}

export interface PostbackData {
  title: string;
  payload: string;
  mid?: string;
}

export interface ReferralData {
  ref?: string;
  source: 'SHORTLINK' | 'ADS' | 'MESSENGER_CODE' | 'DISCOVER_TAB';
  type: 'OPEN_THREAD';
  ads_context_data?: {
    ad_title?: string;
    photo_url?: string;
    video_url?: string;
    [key: string]: any;
  };
  product?: {
    id: string;
  };
  ad_id?: string;
}

export interface OptinData {
  type: 'notification_messages' | 'one_time_notif_req';
  payload?: string;
  notification_messages_token?: string;
  notification_messages_frequency?: 'daily' | 'weekly' | 'monthly';
  token_expiry_timestamp?: number;
  user_token_status?: 'REFRESHED' | 'NOT_REFRESHED';
  notification_messages_timezone?: string;
  title?: string;
  one_time_notif_token?: string;
}

export interface AccountLinkingData {
  status: 'linked' | 'unlinked';
  authorization_code?: string;
}

export interface PassThreadControlData {
  new_owner_app_id: string;
  previous_owner_app_id?: string;
  metadata?: string;
}

export interface TakeThreadControlData {
  previous_owner_app_id?: string;
  new_owner_app_id: string;
  metadata?: string;
}

export interface RequestThreadControlData {
  requested_owner_app_id: string;
  metadata?: string;
}

export interface AppRolesData {
  [app_id: string]: string[];
}

export interface ReactionData {
  mid: string;
  action: 'react' | 'unreact';
  reaction?: string;
  emoji?: string;
}

export interface MessageEditData {
  mid: string;
  text: string;
  num_edit: number;
}

export interface GamePlayData {
  game_id: string;
  player_id: string;
  locale: string;
  context_type: 'SOLO' | 'GROUP' | 'THREAD';
  context_id?: string;
  score?: number;
  payload?: any;
}