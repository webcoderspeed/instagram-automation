/**
 * Regex Constants
 * Regular expression patterns for validation
 */

export const VALIDATION_PATTERNS = {
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Password validation
  PASSWORD: {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    VERY_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    // Minimum 6 characters
    BASIC: /^.{6,}$/,
  },
  
  // Username validation
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  
  // Phone number validation
  PHONE: {
    // International format
    INTERNATIONAL: /^\+[1-9]\d{1,14}$/,
    // US format
    US: /^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    // General format
    GENERAL: /^[\+]?[1-9][\d]{0,15}$/,
  },
  
  // URL validation
  URL: {
    // General URL
    GENERAL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    // HTTPS only
    HTTPS: /^https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    // Domain only
    DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/,
  },
  
  // Social media patterns
  SOCIAL_MEDIA: {
    // Instagram username
    INSTAGRAM_USERNAME: /^[a-zA-Z0-9._]{1,30}$/,
    // Twitter handle
    TWITTER_HANDLE: /^@?[a-zA-Z0-9_]{1,15}$/,
    // Facebook page
    FACEBOOK_PAGE: /^[a-zA-Z0-9.]{5,50}$/,
    // LinkedIn profile
    LINKEDIN_PROFILE: /^[a-zA-Z0-9-]{3,100}$/,
    // YouTube channel
    YOUTUBE_CHANNEL: /^[a-zA-Z0-9_-]{1,100}$/,
    // TikTok username
    TIKTOK_USERNAME: /^[a-zA-Z0-9_.]{2,24}$/,
  },
  
  // Content patterns
  CONTENT: {
    // Hashtag
    HASHTAG: /#[a-zA-Z0-9_]+/g,
    // Mention
    MENTION: /@[a-zA-Z0-9_.]+/g,
    // URL in text
    URL_IN_TEXT: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    // Email in text
    EMAIL_IN_TEXT: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Phone in text
    PHONE_IN_TEXT: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  },
  
  // File patterns
  FILE: {
    // Image files
    IMAGE: /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i,
    // Video files
    VIDEO: /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i,
    // Audio files
    AUDIO: /\.(mp3|wav|aac|ogg|flac|m4a)$/i,
    // Document files
    DOCUMENT: /\.(pdf|doc|docx|txt|rtf|odt)$/i,
    // Spreadsheet files
    SPREADSHEET: /\.(xls|xlsx|csv|ods)$/i,
    // Archive files
    ARCHIVE: /\.(zip|rar|7z|tar|gz)$/i,
  },
  
  // Date and time patterns
  DATE_TIME: {
    // ISO 8601 date
    ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
    // ISO 8601 datetime
    ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    // Time (24-hour format)
    TIME_24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    // Time (12-hour format)
    TIME_12: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
  },
  
  // Color patterns
  COLOR: {
    // Hex color
    HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    // RGB color
    RGB: /^rgb\(\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*\)$/,
    // RGBA color
    RGBA: /^rgba\(\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01](\.[0-9]+)?)\s*\)$/,
  },
  
  // Number patterns
  NUMBER: {
    // Integer
    INTEGER: /^-?\d+$/,
    // Positive integer
    POSITIVE_INTEGER: /^\d+$/,
    // Decimal
    DECIMAL: /^-?\d+(\.\d+)?$/,
    // Positive decimal
    POSITIVE_DECIMAL: /^\d+(\.\d+)?$/,
    // Percentage
    PERCENTAGE: /^(100|[1-9]?[0-9])(\.\d+)?%?$/,
  },
  
  // ID patterns
  ID: {
    // UUID v4
    UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    // MongoDB ObjectId
    MONGODB_OBJECTID: /^[0-9a-fA-F]{24}$/,
    // Alphanumeric ID
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    // Slug
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  
  // Security patterns
  SECURITY: {
    // JWT token
    JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    // API key
    API_KEY: /^[a-zA-Z0-9]{32,}$/,
    // Base64
    BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  },
  
  // Platform-specific patterns
  PLATFORM_SPECIFIC: {
    // Instagram media ID
    INSTAGRAM_MEDIA_ID: /^\d+_\d+$/,
    // Facebook post ID
    FACEBOOK_POST_ID: /^\d+_\d+$/,
    // Twitter tweet ID
    TWITTER_TWEET_ID: /^\d+$/,
    // YouTube video ID
    YOUTUBE_VIDEO_ID: /^[a-zA-Z0-9_-]{11}$/,
    // LinkedIn post URN
    LINKEDIN_POST_URN: /^urn:li:activity:\d+$/,
  },
  
  // Template patterns
  TEMPLATE: {
    // Template variable
    VARIABLE: /\{\{([a-zA-Z0-9_]+)\}\}/g,
    // Template function
    FUNCTION: /\{\{([a-zA-Z0-9_]+)\(([^)]*)\)\}\}/g,
  },
  
  // Search patterns
  SEARCH: {
    // Search query with quotes
    QUOTED_SEARCH: /"([^"]+)"/g,
    // Search operators
    OPERATORS: /\b(AND|OR|NOT)\b/gi,
    // Wildcard search
    WILDCARD: /\*/g,
  },
} as const;

export const SANITIZATION_PATTERNS = {
  // Remove HTML tags
  HTML_TAGS: /<[^>]*>/g,
  
  // Remove script tags
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  
  // Remove style tags
  STYLE_TAGS: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  
  // Remove SQL injection patterns
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
  
  // Remove XSS patterns
  XSS: /(javascript:|vbscript:|onload|onerror|onclick)/gi,
  
  // Remove excessive whitespace
  EXCESSIVE_WHITESPACE: /\s+/g,
  
  // Remove non-printable characters
  NON_PRINTABLE: /[\x00-\x1F\x7F]/g,
} as const;

export const EXTRACTION_PATTERNS = {
  // Extract hashtags
  HASHTAGS: /#([a-zA-Z0-9_]+)/g,
  
  // Extract mentions
  MENTIONS: /@([a-zA-Z0-9_.]+)/g,
  
  // Extract URLs
  URLS: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  
  // Extract emails
  EMAILS: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Extract phone numbers
  PHONE_NUMBERS: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  
  // Extract emojis
  EMOJIS: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  
  // Extract numbers
  NUMBERS: /\d+/g,
  
  // Extract words
  WORDS: /\b\w+\b/g,
} as const;

export const REPLACEMENT_PATTERNS = {
  // Replace multiple spaces with single space
  NORMALIZE_SPACES: {
    pattern: /\s+/g,
    replacement: ' ',
  },
  
  // Replace line breaks with spaces
  LINE_BREAKS_TO_SPACES: {
    pattern: /\r?\n/g,
    replacement: ' ',
  },
  
  // Replace tabs with spaces
  TABS_TO_SPACES: {
    pattern: /\t/g,
    replacement: ' ',
  },
  
  // Remove leading/trailing whitespace
  TRIM_WHITESPACE: {
    pattern: /^\s+|\s+$/g,
    replacement: '',
  },
  
  // Replace smart quotes with regular quotes
  SMART_QUOTES: {
    pattern: /[""]/g,
    replacement: '"',
  },
  
  // Replace smart apostrophes with regular apostrophes
  SMART_APOSTROPHES: {
    pattern: /['']/g,
    replacement: "'",
  },
} as const;