/**
 * Message Constants
 * Standardized user-facing messages and notifications
 */

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTRATION_SUCCESS: 'Account created successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  
  // Platform Accounts
  ACCOUNT_CONNECTED: 'Account connected successfully',
  ACCOUNT_DISCONNECTED: 'Account disconnected successfully',
  ACCOUNT_UPDATED: 'Account updated successfully',
  TOKEN_REFRESHED: 'Account token refreshed successfully',
  
  // Content Management
  POST_CREATED: 'Post created successfully',
  POST_UPDATED: 'Post updated successfully',
  POST_DELETED: 'Post deleted successfully',
  POST_PUBLISHED: 'Post published successfully',
  POST_SCHEDULED: 'Post scheduled successfully',
  POST_DRAFT_SAVED: 'Draft saved successfully',
  
  // Messages
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
  AUTO_REPLY_ENABLED: 'Auto-reply enabled successfully',
  AUTO_REPLY_DISABLED: 'Auto-reply disabled successfully',
  
  // Templates
  TEMPLATE_CREATED: 'Template created successfully',
  TEMPLATE_UPDATED: 'Template updated successfully',
  TEMPLATE_DELETED: 'Template deleted successfully',
  TEMPLATE_APPLIED: 'Template applied successfully',
  
  // Campaigns
  CAMPAIGN_CREATED: 'Campaign created successfully',
  CAMPAIGN_UPDATED: 'Campaign updated successfully',
  CAMPAIGN_DELETED: 'Campaign deleted successfully',
  CAMPAIGN_STARTED: 'Campaign started successfully',
  CAMPAIGN_PAUSED: 'Campaign paused successfully',
  CAMPAIGN_RESUMED: 'Campaign resumed successfully',
  CAMPAIGN_COMPLETED: 'Campaign completed successfully',
  
  // Automations
  AUTOMATION_CREATED: 'Automation created successfully',
  AUTOMATION_UPDATED: 'Automation updated successfully',
  AUTOMATION_DELETED: 'Automation deleted successfully',
  AUTOMATION_ENABLED: 'Automation enabled successfully',
  AUTOMATION_DISABLED: 'Automation disabled successfully',
  
  // Files
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  FILES_PROCESSED: 'Files processed successfully',
  
  // Analytics
  REPORT_GENERATED: 'Report generated successfully',
  DATA_EXPORTED: 'Data exported successfully',
  ANALYTICS_UPDATED: 'Analytics updated successfully',
  
  // Webhooks
  WEBHOOK_CREATED: 'Webhook created successfully',
  WEBHOOK_UPDATED: 'Webhook updated successfully',
  WEBHOOK_DELETED: 'Webhook deleted successfully',
  WEBHOOK_TESTED: 'Webhook test completed successfully',
  
  // Subscription
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
  SUBSCRIPTION_CANCELLED: 'Subscription cancelled successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  
  // General
  SETTINGS_SAVED: 'Settings saved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PREFERENCES_SAVED: 'Preferences saved successfully',
  INVITATION_SENT: 'Invitation sent successfully',
  BACKUP_CREATED: 'Backup created successfully',
  DATA_IMPORTED: 'Data imported successfully',
} as const;

export const USER_ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to multiple failed login attempts',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in',
  PASSWORD_TOO_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource',
  
  // Platform Accounts
  ACCOUNT_ALREADY_CONNECTED: 'This account is already connected',
  ACCOUNT_CONNECTION_FAILED: 'Failed to connect account. Please try again',
  PLATFORM_NOT_SUPPORTED: 'This platform is not currently supported',
  INVALID_PLATFORM_CREDENTIALS: 'Invalid platform credentials',
  PLATFORM_API_ERROR: 'Platform API is currently unavailable',
  ACCOUNT_SUSPENDED: 'Your platform account has been suspended',
  
  // Content Management
  POST_NOT_FOUND: 'Post not found',
  POST_ALREADY_PUBLISHED: 'Post has already been published',
  INVALID_POST_CONTENT: 'Post content is invalid or too long',
  MEDIA_UPLOAD_FAILED: 'Failed to upload media files',
  SCHEDULING_FAILED: 'Failed to schedule post',
  PUBLISHING_FAILED: 'Failed to publish post',
  
  // Messages
  MESSAGE_NOT_FOUND: 'Message not found',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  AUTO_REPLY_SETUP_FAILED: 'Failed to set up auto-reply',
  
  // Templates
  TEMPLATE_NOT_FOUND: 'Template not found',
  TEMPLATE_NAME_EXISTS: 'Template with this name already exists',
  INVALID_TEMPLATE_CONTENT: 'Template content is invalid',
  TEMPLATE_LIMIT_EXCEEDED: 'You have reached the maximum number of templates',
  
  // Campaigns
  CAMPAIGN_NOT_FOUND: 'Campaign not found',
  CAMPAIGN_ALREADY_RUNNING: 'Campaign is already running',
  CAMPAIGN_NOT_RUNNING: 'Campaign is not currently running',
  INVALID_CAMPAIGN_DATES: 'Invalid campaign start or end dates',
  CAMPAIGN_LIMIT_EXCEEDED: 'You have reached the maximum number of campaigns',
  
  // Automations
  AUTOMATION_NOT_FOUND: 'Automation not found',
  AUTOMATION_ALREADY_ENABLED: 'Automation is already enabled',
  AUTOMATION_NOT_ENABLED: 'Automation is not currently enabled',
  INVALID_AUTOMATION_RULES: 'Invalid automation rules',
  AUTOMATION_LIMIT_EXCEEDED: 'You have reached the maximum number of automations',
  
  // Files
  FILE_NOT_FOUND: 'File not found',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'File type is not supported',
  STORAGE_LIMIT_EXCEEDED: 'Storage limit exceeded',
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_CORRUPTED: 'File appears to be corrupted',
  
  // Analytics
  ANALYTICS_NOT_AVAILABLE: 'Analytics data is not available',
  REPORT_GENERATION_FAILED: 'Failed to generate report',
  EXPORT_FAILED: 'Data export failed',
  INSUFFICIENT_DATA: 'Insufficient data for analysis',
  
  // Webhooks
  WEBHOOK_NOT_FOUND: 'Webhook not found',
  WEBHOOK_URL_INVALID: 'Webhook URL is invalid',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook verification failed',
  WEBHOOK_DELIVERY_FAILED: 'Webhook delivery failed',
  
  // Subscription
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired',
  PAYMENT_FAILED: 'Payment processing failed',
  FEATURE_NOT_AVAILABLE: 'This feature is not available in your current plan',
  USAGE_LIMIT_EXCEEDED: 'You have exceeded your usage limit',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  API_QUOTA_EXCEEDED: 'API quota exceeded for today',
  PLATFORM_RATE_LIMITED: 'Platform rate limit exceeded. Please wait before trying again',
  
  // General
  VALIDATION_ERROR: 'Please check your input and try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Internal server error. Please try again later',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',
  MAINTENANCE_MODE: 'Service is under maintenance. Please try again later',
  RESOURCE_NOT_FOUND: 'Requested resource not found',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  INVALID_REQUEST: 'Invalid request format',
  MISSING_REQUIRED_FIELDS: 'Please fill in all required fields',
} as const;

export const INFO_MESSAGES = {
  // Onboarding
  WELCOME_MESSAGE: 'Welcome to our social media automation platform!',
  SETUP_COMPLETE: 'Account setup completed successfully',
  FIRST_POST_GUIDE: 'Ready to create your first post? Click here to get started',
  CONNECT_ACCOUNT_GUIDE: 'Connect your social media accounts to start automating',
  
  // Features
  FEATURE_COMING_SOON: 'This feature is coming soon!',
  BETA_FEATURE: 'This is a beta feature. Your feedback is appreciated',
  NEW_FEATURE_AVAILABLE: 'New feature available! Check it out',
  
  // Maintenance
  SCHEDULED_MAINTENANCE: 'Scheduled maintenance will occur on {date} from {startTime} to {endTime}',
  MAINTENANCE_COMPLETE: 'Maintenance completed. All services are now available',
  
  // Updates
  PLATFORM_UPDATE: 'Platform updated with new features and improvements',
  SECURITY_UPDATE: 'Security update applied to protect your account',
  
  // Tips
  TIP_OPTIMAL_POSTING: 'Tip: Post when your audience is most active for better engagement',
  TIP_HASHTAG_USAGE: 'Tip: Use relevant hashtags to increase your post visibility',
  TIP_CONTENT_PLANNING: 'Tip: Plan your content in advance for consistent posting',
  TIP_ANALYTICS_REVIEW: 'Tip: Review your analytics weekly to optimize your strategy',
  
  // Limits
  APPROACHING_LIMIT: 'You are approaching your {limitType} limit',
  LIMIT_REACHED: 'You have reached your {limitType} limit',
  UPGRADE_SUGGESTION: 'Consider upgrading your plan for higher limits',
  
  // Data
  DATA_SYNCING: 'Syncing data from your connected accounts...',
  DATA_SYNC_COMPLETE: 'Data synchronization completed',
  ANALYTICS_UPDATING: 'Analytics data is being updated...',
  REPORT_PROCESSING: 'Your report is being generated...',
} as const;

export const WARNING_MESSAGES = {
  // Account
  ACCOUNT_EXPIRING: 'Your account access will expire in {days} days',
  TOKEN_EXPIRING: 'Your platform token will expire soon. Please reconnect your account',
  SUBSCRIPTION_EXPIRING: 'Your subscription will expire on {date}',
  
  // Content
  POST_PENDING_APPROVAL: 'Your post is pending approval and will be published once approved',
  CONTENT_POLICY_WARNING: 'This content may violate platform policies',
  DUPLICATE_CONTENT: 'Similar content has been posted recently',
  
  // Platform
  PLATFORM_ISSUES: 'The platform is experiencing issues. Some features may be limited',
  API_DEPRECATED: 'This API version will be deprecated soon. Please update your integration',
  
  // Security
  UNUSUAL_ACTIVITY: 'Unusual activity detected on your account',
  PASSWORD_EXPIRING: 'Your password will expire in {days} days',
  LOGIN_FROM_NEW_DEVICE: 'Login detected from a new device',
  
  // Data
  DATA_LOSS_WARNING: 'This action will permanently delete your data',
  BACKUP_RECOMMENDED: 'We recommend backing up your data before proceeding',
  LARGE_EXPORT: 'This export contains a large amount of data and may take some time',
  
  // Performance
  HIGH_USAGE: 'High usage detected. Consider optimizing your automation rules',
  SLOW_RESPONSE: 'Platform response is slower than usual',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to Social Media Automation Platform',
  EMAIL_VERIFICATION: 'Verify your email address',
  PASSWORD_RESET: 'Reset your password',
  ACCOUNT_SUSPENDED: 'Account suspended - Action required',
  SUBSCRIPTION_EXPIRING: 'Your subscription is expiring soon',
  PAYMENT_FAILED: 'Payment failed - Update payment method',
  WEEKLY_REPORT: 'Your weekly analytics report',
  PLATFORM_UPDATE: 'Platform update notification',
  SECURITY_ALERT: 'Security alert for your account',
} as const;

export const PLACEHOLDER_MESSAGES = {
  SEARCH: 'Search posts, campaigns, templates...',
  POST_CONTENT: 'What would you like to share?',
  MESSAGE_REPLY: 'Type your reply...',
  TEMPLATE_NAME: 'Enter template name',
  CAMPAIGN_NAME: 'Enter campaign name',
  AUTOMATION_NAME: 'Enter automation name',
  WEBHOOK_URL: 'Enter webhook URL',
  EMAIL: 'Enter your email address',
  PASSWORD: 'Enter your password',
  CONFIRM_PASSWORD: 'Confirm your password',
} as const;