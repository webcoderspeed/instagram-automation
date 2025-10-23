/**
 * Limit Constants
 * Rate limits, quotas, and subscription-based restrictions
 */

export const RATE_LIMITS = {
  // API Rate Limits (per minute)
  API_REQUESTS_PER_MINUTE: 100,
  API_REQUESTS_PER_HOUR: 1000,
  API_REQUESTS_PER_DAY: 10000,
  
  // Authentication Rate Limits
  LOGIN_ATTEMPTS_PER_MINUTE: 5,
  LOGIN_ATTEMPTS_PER_HOUR: 20,
  PASSWORD_RESET_PER_HOUR: 3,
  EMAIL_VERIFICATION_PER_HOUR: 5,
  
  // Platform API Rate Limits (per hour)
  INSTAGRAM_API_REQUESTS: 200,
  FACEBOOK_API_REQUESTS: 200,
  TWITTER_API_REQUESTS: 300,
  LINKEDIN_API_REQUESTS: 100,
  YOUTUBE_API_REQUESTS: 100,
  TIKTOK_API_REQUESTS: 100,
  
  // Content Publishing Rate Limits (per day)
  POSTS_PER_DAY: 50,
  STORIES_PER_DAY: 20,
  REELS_PER_DAY: 10,
  MESSAGES_PER_DAY: 100,
  
  // File Upload Rate Limits
  FILE_UPLOADS_PER_MINUTE: 10,
  FILE_UPLOADS_PER_HOUR: 100,
  
  // Webhook Rate Limits
  WEBHOOK_DELIVERIES_PER_MINUTE: 100,
  WEBHOOK_RETRIES_PER_HOUR: 50,
} as const;

export const FILE_LIMITS = {
  // File Size Limits (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_TOTAL_STORAGE: 1024 * 1024 * 1024, // 1GB
  
  // File Count Limits
  MAX_FILES_PER_POST: 10,
  MAX_FILES_PER_UPLOAD: 20,
  MAX_FILES_PER_USER: 1000,
  
  // File Type Limits
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_VIDEO_TYPES: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  ALLOWED_AUDIO_TYPES: ['mp3', 'wav', 'aac', 'ogg'],
  ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'txt', 'csv'],
} as const;

export const CONTENT_LIMITS = {
  // Text Limits
  MAX_POST_TEXT_LENGTH: 2200,
  MAX_COMMENT_LENGTH: 500,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_BIO_LENGTH: 150,
  MAX_HASHTAGS_PER_POST: 30,
  MAX_MENTIONS_PER_POST: 20,
  
  // Template Limits
  MAX_TEMPLATES_PER_USER: 100,
  MAX_TEMPLATE_NAME_LENGTH: 100,
  MAX_TEMPLATE_CONTENT_LENGTH: 2000,
  
  // Campaign Limits
  MAX_CAMPAIGNS_PER_USER: 50,
  MAX_CAMPAIGN_NAME_LENGTH: 100,
  MAX_CAMPAIGN_DESCRIPTION_LENGTH: 500,
  MAX_POSTS_PER_CAMPAIGN: 100,
  
  // Automation Limits
  MAX_AUTOMATIONS_PER_USER: 25,
  MAX_AUTOMATION_RULES: 10,
  MAX_AUTO_REPLIES_PER_DAY: 100,
} as const;

export const SUBSCRIPTION_LIMITS = {
  FREE: {
    // Account Limits
    MAX_CONNECTED_ACCOUNTS: 1,
    MAX_PLATFORMS: 1,
    
    // Content Limits
    MAX_POSTS_PER_MONTH: 30,
    MAX_SCHEDULED_POSTS: 10,
    MAX_TEMPLATES: 5,
    MAX_CAMPAIGNS: 2,
    MAX_AUTOMATIONS: 1,
    
    // File Limits
    MAX_STORAGE_GB: 1,
    MAX_FILE_SIZE_MB: 5,
    
    // Analytics
    ANALYTICS_RETENTION_DAYS: 30,
    EXPORT_FORMATS: ['csv'],
    
    // Support
    SUPPORT_LEVEL: 'community',
    
    // API Access
    API_REQUESTS_PER_DAY: 1000,
    WEBHOOK_ENDPOINTS: 1,
  },
  
  BASIC: {
    // Account Limits
    MAX_CONNECTED_ACCOUNTS: 3,
    MAX_PLATFORMS: 2,
    
    // Content Limits
    MAX_POSTS_PER_MONTH: 100,
    MAX_SCHEDULED_POSTS: 50,
    MAX_TEMPLATES: 20,
    MAX_CAMPAIGNS: 10,
    MAX_AUTOMATIONS: 5,
    
    // File Limits
    MAX_STORAGE_GB: 5,
    MAX_FILE_SIZE_MB: 10,
    
    // Analytics
    ANALYTICS_RETENTION_DAYS: 90,
    EXPORT_FORMATS: ['csv', 'xlsx'],
    
    // Support
    SUPPORT_LEVEL: 'email',
    
    // API Access
    API_REQUESTS_PER_DAY: 5000,
    WEBHOOK_ENDPOINTS: 3,
  },
  
  PRO: {
    // Account Limits
    MAX_CONNECTED_ACCOUNTS: 10,
    MAX_PLATFORMS: 5,
    
    // Content Limits
    MAX_POSTS_PER_MONTH: 500,
    MAX_SCHEDULED_POSTS: 200,
    MAX_TEMPLATES: 100,
    MAX_CAMPAIGNS: 50,
    MAX_AUTOMATIONS: 25,
    
    // File Limits
    MAX_STORAGE_GB: 25,
    MAX_FILE_SIZE_MB: 50,
    
    // Analytics
    ANALYTICS_RETENTION_DAYS: 365,
    EXPORT_FORMATS: ['csv', 'xlsx', 'pdf'],
    
    // Support
    SUPPORT_LEVEL: 'priority',
    
    // API Access
    API_REQUESTS_PER_DAY: 25000,
    WEBHOOK_ENDPOINTS: 10,
  },
  
  ENTERPRISE: {
    // Account Limits
    MAX_CONNECTED_ACCOUNTS: -1, // Unlimited
    MAX_PLATFORMS: -1, // Unlimited
    
    // Content Limits
    MAX_POSTS_PER_MONTH: -1, // Unlimited
    MAX_SCHEDULED_POSTS: -1, // Unlimited
    MAX_TEMPLATES: -1, // Unlimited
    MAX_CAMPAIGNS: -1, // Unlimited
    MAX_AUTOMATIONS: -1, // Unlimited
    
    // File Limits
    MAX_STORAGE_GB: 100,
    MAX_FILE_SIZE_MB: 100,
    
    // Analytics
    ANALYTICS_RETENTION_DAYS: -1, // Unlimited
    EXPORT_FORMATS: ['csv', 'xlsx', 'pdf', 'json'],
    
    // Support
    SUPPORT_LEVEL: 'dedicated',
    
    // API Access
    API_REQUESTS_PER_DAY: 100000,
    WEBHOOK_ENDPOINTS: 50,
  },
} as const;

export const PLATFORM_SPECIFIC_LIMITS = {
  INSTAGRAM: {
    MAX_POST_TEXT_LENGTH: 2200,
    MAX_STORY_TEXT_LENGTH: 500,
    MAX_HASHTAGS: 30,
    MAX_MENTIONS: 20,
    MAX_IMAGES_PER_POST: 10,
    MAX_VIDEO_LENGTH_SECONDS: 60,
    MAX_STORY_VIDEO_LENGTH_SECONDS: 15,
    MAX_REEL_LENGTH_SECONDS: 90,
    POSTS_PER_DAY: 25,
    STORIES_PER_DAY: 100,
  },
  
  FACEBOOK: {
    MAX_POST_TEXT_LENGTH: 63206,
    MAX_HASHTAGS: 30,
    MAX_MENTIONS: 50,
    MAX_IMAGES_PER_POST: 10,
    MAX_VIDEO_LENGTH_SECONDS: 240,
    POSTS_PER_DAY: 25,
    PAGES_PER_APP: 200,
  },
  
  TWITTER: {
    MAX_TWEET_LENGTH: 280,
    MAX_HASHTAGS: 10,
    MAX_MENTIONS: 10,
    MAX_IMAGES_PER_TWEET: 4,
    MAX_VIDEO_LENGTH_SECONDS: 140,
    TWEETS_PER_DAY: 300,
    DMS_PER_DAY: 1000,
  },
  
  LINKEDIN: {
    MAX_POST_TEXT_LENGTH: 3000,
    MAX_HASHTAGS: 5,
    MAX_MENTIONS: 10,
    MAX_IMAGES_PER_POST: 9,
    MAX_VIDEO_LENGTH_SECONDS: 600,
    POSTS_PER_DAY: 25,
    CONNECTIONS_PER_DAY: 100,
  },
  
  YOUTUBE: {
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 5000,
    MAX_TAGS: 500,
    MAX_VIDEO_SIZE_GB: 256,
    MAX_VIDEO_LENGTH_HOURS: 12,
    UPLOADS_PER_DAY: 100,
  },
  
  TIKTOK: {
    MAX_CAPTION_LENGTH: 300,
    MAX_HASHTAGS: 20,
    MAX_MENTIONS: 20,
    MAX_VIDEO_LENGTH_SECONDS: 180,
    UPLOADS_PER_DAY: 10,
  },
} as const;

export const VALIDATION_LIMITS = {
  // User Input Limits
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 20,
  
  // Search Limits
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
  MAX_SEARCH_RESULTS: 100,
  
  // Pagination Limits
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  
  // Bulk Operation Limits
  MAX_BULK_OPERATIONS: 100,
  MAX_BATCH_SIZE: 50,
} as const;

export const CACHE_LIMITS = {
  // Cache TTL (in seconds)
  USER_CACHE_TTL: 300, // 5 minutes
  PLATFORM_DATA_TTL: 600, // 10 minutes
  ANALYTICS_CACHE_TTL: 1800, // 30 minutes
  CONFIG_CACHE_TTL: 3600, // 1 hour
  
  // Cache Size Limits
  MAX_CACHE_ENTRIES: 10000,
  MAX_CACHE_SIZE_MB: 100,
  
  // Cache Key Limits
  MAX_CACHE_KEY_LENGTH: 250,
} as const;

export const WEBHOOK_LIMITS = {
  // Webhook Delivery
  MAX_DELIVERY_ATTEMPTS: 5,
  DELIVERY_TIMEOUT_SECONDS: 30,
  RETRY_DELAY_SECONDS: 60,
  MAX_RETRY_DELAY_SECONDS: 3600,
  
  // Webhook Payload
  MAX_PAYLOAD_SIZE_KB: 1024, // 1MB
  MAX_HEADERS: 20,
  MAX_HEADER_VALUE_LENGTH: 1000,
  
  // Webhook URL
  MAX_URL_LENGTH: 2048,
  ALLOWED_PROTOCOLS: ['https'],
} as const;