/**
 * Event Constants
 * System-wide event types and configurations
 */

export const SYSTEM_EVENTS = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_PASSWORD_CHANGED: 'user.password_changed',
  USER_EMAIL_VERIFIED: 'user.email_verified',
  USER_SUBSCRIPTION_CHANGED: 'user.subscription_changed',
  
  // Platform Account Events
  ACCOUNT_CONNECTED: 'account.connected',
  ACCOUNT_DISCONNECTED: 'account.disconnected',
  ACCOUNT_UPDATED: 'account.updated',
  ACCOUNT_TOKEN_REFRESHED: 'account.token_refreshed',
  ACCOUNT_TOKEN_EXPIRED: 'account.token_expired',
  ACCOUNT_SUSPENDED: 'account.suspended',
  ACCOUNT_REACTIVATED: 'account.reactivated',
  
  // Post Events
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  POST_PUBLISHED: 'post.published',
  POST_SCHEDULED: 'post.scheduled',
  POST_FAILED: 'post.failed',
  POST_LIKED: 'post.liked',
  POST_COMMENTED: 'post.commented',
  POST_SHARED: 'post.shared',
  
  // Message Events
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_FAILED: 'message.failed',
  MESSAGE_READ: 'message.read',
  MESSAGE_REPLIED: 'message.replied',
  AUTO_REPLY_TRIGGERED: 'message.auto_reply_triggered',
  
  // Webhook Events
  WEBHOOK_RECEIVED: 'webhook.received',
  WEBHOOK_PROCESSED: 'webhook.processed',
  WEBHOOK_FAILED: 'webhook.failed',
  WEBHOOK_VERIFIED: 'webhook.verified',
  WEBHOOK_VERIFICATION_FAILED: 'webhook.verification_failed',
  
  // Analytics Events
  ANALYTICS_UPDATED: 'analytics.updated',
  ANALYTICS_REPORT_GENERATED: 'analytics.report_generated',
  ANALYTICS_EXPORT_COMPLETED: 'analytics.export_completed',
  
  // System Events
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_MAINTENANCE_START: 'system.maintenance_start',
  SYSTEM_MAINTENANCE_END: 'system.maintenance_end',
  
  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED: 'rate_limit.exceeded',
  RATE_LIMIT_RESET: 'rate_limit.reset',
  
  // File Events
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',
  FILE_PROCESSED: 'file.processed',
  FILE_PROCESSING_FAILED: 'file.processing_failed',
  
  // Template Events
  TEMPLATE_CREATED: 'template.created',
  TEMPLATE_UPDATED: 'template.updated',
  TEMPLATE_DELETED: 'template.deleted',
  TEMPLATE_USED: 'template.used',
  
  // Automation Events
  AUTOMATION_CREATED: 'automation.created',
  AUTOMATION_UPDATED: 'automation.updated',
  AUTOMATION_DELETED: 'automation.deleted',
  AUTOMATION_TRIGGERED: 'automation.triggered',
  AUTOMATION_COMPLETED: 'automation.completed',
  AUTOMATION_FAILED: 'automation.failed',
  
  // Campaign Events
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_STARTED: 'campaign.started',
  CAMPAIGN_PAUSED: 'campaign.paused',
  CAMPAIGN_RESUMED: 'campaign.resumed',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  CAMPAIGN_CANCELLED: 'campaign.cancelled',
} as const;

export const PLATFORM_EVENTS = {
  // Instagram Events
  INSTAGRAM: {
    STORY_CREATED: 'instagram.story.created',
    STORY_EXPIRED: 'instagram.story.expired',
    REEL_CREATED: 'instagram.reel.created',
    IGTV_CREATED: 'instagram.igtv.created',
    LIVE_STARTED: 'instagram.live.started',
    LIVE_ENDED: 'instagram.live.ended',
    FOLLOWER_GAINED: 'instagram.follower.gained',
    FOLLOWER_LOST: 'instagram.follower.lost',
    MENTION_RECEIVED: 'instagram.mention.received',
    HASHTAG_MENTIONED: 'instagram.hashtag.mentioned',
  },
  
  // Facebook Events
  FACEBOOK: {
    PAGE_POST_CREATED: 'facebook.page.post.created',
    PAGE_LIKED: 'facebook.page.liked',
    PAGE_UNLIKED: 'facebook.page.unliked',
    EVENT_CREATED: 'facebook.event.created',
    EVENT_UPDATED: 'facebook.event.updated',
    REVIEW_RECEIVED: 'facebook.review.received',
    MESSAGE_RECEIVED: 'facebook.message.received',
  },
  
  // Twitter Events
  TWITTER: {
    TWEET_CREATED: 'twitter.tweet.created',
    TWEET_RETWEETED: 'twitter.tweet.retweeted',
    TWEET_LIKED: 'twitter.tweet.liked',
    TWEET_REPLIED: 'twitter.tweet.replied',
    FOLLOWER_GAINED: 'twitter.follower.gained',
    FOLLOWER_LOST: 'twitter.follower.lost',
    MENTION_RECEIVED: 'twitter.mention.received',
    DM_RECEIVED: 'twitter.dm.received',
  },
  
  // LinkedIn Events
  LINKEDIN: {
    POST_CREATED: 'linkedin.post.created',
    ARTICLE_PUBLISHED: 'linkedin.article.published',
    CONNECTION_REQUEST: 'linkedin.connection.request',
    CONNECTION_ACCEPTED: 'linkedin.connection.accepted',
    COMPANY_FOLLOWED: 'linkedin.company.followed',
    SKILL_ENDORSED: 'linkedin.skill.endorsed',
  },
  
  // YouTube Events
  YOUTUBE: {
    VIDEO_UPLOADED: 'youtube.video.uploaded',
    VIDEO_PUBLISHED: 'youtube.video.published',
    VIDEO_LIKED: 'youtube.video.liked',
    VIDEO_COMMENTED: 'youtube.video.commented',
    SUBSCRIBER_GAINED: 'youtube.subscriber.gained',
    SUBSCRIBER_LOST: 'youtube.subscriber.lost',
    LIVE_STREAM_STARTED: 'youtube.live.started',
    LIVE_STREAM_ENDED: 'youtube.live.ended',
  },
  
  // TikTok Events
  TIKTOK: {
    VIDEO_UPLOADED: 'tiktok.video.uploaded',
    VIDEO_LIKED: 'tiktok.video.liked',
    VIDEO_COMMENTED: 'tiktok.video.commented',
    VIDEO_SHARED: 'tiktok.video.shared',
    FOLLOWER_GAINED: 'tiktok.follower.gained',
    FOLLOWER_LOST: 'tiktok.follower.lost',
    LIVE_STARTED: 'tiktok.live.started',
    LIVE_ENDED: 'tiktok.live.ended',
  },
} as const;

export const EVENT_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const EVENT_CATEGORIES = {
  USER: 'user',
  PLATFORM: 'platform',
  CONTENT: 'content',
  MESSAGING: 'messaging',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
  WEBHOOK: 'webhook',
  AUTOMATION: 'automation',
  CAMPAIGN: 'campaign',
  FILE: 'file',
  TEMPLATE: 'template',
} as const;

export const EVENT_DELIVERY_MODES = {
  IMMEDIATE: 'immediate',
  BATCH: 'batch',
  SCHEDULED: 'scheduled',
  DELAYED: 'delayed',
} as const;

export const EVENT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
  maxRetryDelay: 30000, // 30 seconds
} as const;

export const WEBHOOK_EVENT_MAPPING = {
  // Instagram webhook events to internal events
  'instagram.message': SYSTEM_EVENTS.MESSAGE_RECEIVED,
  'instagram.comment': SYSTEM_EVENTS.POST_COMMENTED,
  'instagram.like': SYSTEM_EVENTS.POST_LIKED,
  'instagram.follow': PLATFORM_EVENTS.INSTAGRAM.FOLLOWER_GAINED,
  'instagram.unfollow': PLATFORM_EVENTS.INSTAGRAM.FOLLOWER_LOST,
  'instagram.mention': PLATFORM_EVENTS.INSTAGRAM.MENTION_RECEIVED,
  
  // Facebook webhook events to internal events
  'facebook.message': SYSTEM_EVENTS.MESSAGE_RECEIVED,
  'facebook.comment': SYSTEM_EVENTS.POST_COMMENTED,
  'facebook.like': SYSTEM_EVENTS.POST_LIKED,
  'facebook.page_like': PLATFORM_EVENTS.FACEBOOK.PAGE_LIKED,
  'facebook.page_unlike': PLATFORM_EVENTS.FACEBOOK.PAGE_UNLIKED,
  
  // Twitter webhook events to internal events
  'twitter.tweet': PLATFORM_EVENTS.TWITTER.TWEET_CREATED,
  'twitter.retweet': PLATFORM_EVENTS.TWITTER.TWEET_RETWEETED,
  'twitter.like': PLATFORM_EVENTS.TWITTER.TWEET_LIKED,
  'twitter.reply': PLATFORM_EVENTS.TWITTER.TWEET_REPLIED,
  'twitter.follow': PLATFORM_EVENTS.TWITTER.FOLLOWER_GAINED,
  'twitter.unfollow': PLATFORM_EVENTS.TWITTER.FOLLOWER_LOST,
  'twitter.mention': PLATFORM_EVENTS.TWITTER.MENTION_RECEIVED,
  'twitter.direct_message': PLATFORM_EVENTS.TWITTER.DM_RECEIVED,
} as const;

export const EVENT_HANDLERS = {
  // Event handler types
  SYNC: 'sync',
  ASYNC: 'async',
  QUEUE: 'queue',
  WEBHOOK: 'webhook',
} as const;

export const QUEUE_NAMES = {
  HIGH_PRIORITY: 'high_priority_events',
  MEDIUM_PRIORITY: 'medium_priority_events',
  LOW_PRIORITY: 'low_priority_events',
  WEBHOOK_PROCESSING: 'webhook_processing',
  ANALYTICS_PROCESSING: 'analytics_processing',
  NOTIFICATION_DELIVERY: 'notification_delivery',
  FILE_PROCESSING: 'file_processing',
  EMAIL_DELIVERY: 'email_delivery',
} as const;