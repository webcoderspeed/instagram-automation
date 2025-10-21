/**
 * Instagram-specific webhook interfaces
 * Based on: https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook
 */

export interface InstagramWebhookEvent {
  object: 'instagram';
  entry: InstagramWebhookEntry[];
}

export interface InstagramWebhookEntry {
  id: string; // Instagram Professional account ID
  time: number;
  messaging: InstagramMessaging[];
}

export interface InstagramMessaging {
  sender: {
    id: string; // Instagram-scoped ID for the customer
  };
  recipient: {
    id: string; // Instagram Professional account ID
  };
  timestamp: number;
  message?: InstagramMessage;
  read?: InstagramRead;
  postback?: InstagramPostback;
  referral?: InstagramReferral;
  reaction?: InstagramReaction;
}

export interface InstagramMessage {
  mid: string;
  text?: string;
  attachments?: InstagramAttachment[];
  is_deleted?: boolean;
  is_echo?: boolean;
  is_unsupported?: boolean;
  quick_reply?: {
    payload: string;
  };
  referral?: InstagramReferral;
  reply_to?: InstagramReplyTo;
}

export interface InstagramAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'share' | 'story_mention' | 'ig_reel' | 'reel';
  payload: {
    url: string;
  };
}

export interface InstagramReplyTo {
  mid?: string;
  story?: {
    url: string;
    id: string;
  };
}

export interface InstagramRead {
  mid: string;
}

export interface InstagramPostback {
  title: string;
  payload: string;
  mid?: string;
}

export interface InstagramReferral {
  ref?: string;
  ad_id?: string;
  source: 'ADS';
  type: 'OPEN_THREAD';
  ads_context_data?: {
    ad_title: string;
    photo_url: string;
    video_url: string;
  };
  product?: {
    id: string;
  };
}

export interface InstagramReaction {
  mid: string;
  action: 'react' | 'unreact';
  reaction?: string;
  emoji?: string;
}

// Instagram-specific change events
export interface InstagramChangeEvent {
  field: 'comments' | 'live_comments' | 'story_insights' | 'mentions';
  value: InstagramChangeValue;
}

export interface InstagramChangeValue {
  from?: {
    id: string;
    username?: string;
  };
  media?: {
    id: string;
    media_product_type: 'FEED' | 'LIVE' | 'STORY' | 'REELS';
    media_type?: string;
    media_url?: string;
  };
  id?: string;
  parent_id?: string;
  text?: string;
  [key: string]: any;
}

export interface InstagramComment {
  from: {
    id: string;
    username?: string;
  };
  media: {
    id: string;
    media_product_type: 'FEED' | 'LIVE' | 'STORY' | 'REELS';
    media_type?: string;
    media_url?: string;
  };
  id: string;
  parent_id?: string;
  text: string;
}

export interface InstagramLiveComment {
  from: {
    id: string;
    username?: string;
  };
  media: {
    id: string;
    media_product_type: 'LIVE';
  };
  id: string;
  text: string;
}

export interface InstagramMention {
  from: {
    id: string;
    username?: string;
  };
  media: {
    id: string;
    media_product_type: 'STORY';
  };
  id: string;
  text?: string;
}