import { z } from 'zod';

// OAuth and Authentication Schemas

// Instagram OAuth connect schema
export const instagramConnectSchema = z.object({
  query: z.object({
    redirectUri: z.string().url("Invalid redirect URI").optional(),
    state: z.string().optional(),
    scopes: z.string().optional(), // comma-separated scopes
  }),
});

// Instagram OAuth callback schema
export const instagramCallbackSchema = z.object({
  query: z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),
});

// Token refresh schema
export const instagramRefreshTokenSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, "Access token is required"),
    forceRefresh: z.boolean().default(false),
  }),
});

// Connection status schema
export const connectionStatusSchema = z.object({
  query: z.object({
    includeTokenInfo: z.string().transform(val => val === 'true').optional(),
    includeProfile: z.string().transform(val => val === 'true').optional(),
  }),
});

// Disconnect account schema
export const disconnectAccountSchema = z.object({
  body: z.object({
    reason: z.enum([
      'no_longer_needed',
      'switching_accounts', 
      'privacy_concerns',
      'technical_issues',
      'other'
    ]).optional(),
    feedback: z.string().max(500, "Feedback cannot exceed 500 characters").optional(),
    deleteData: z.boolean().default(false),
  }),
});

// Token validation schema
export const validateTokenSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, "Access token is required"),
    checkExpiration: z.boolean().default(true),
    refreshIfNeeded: z.boolean().default(false),
  }),
});

// Platform account data validation
export const platformAccountDataSchema = z.object({
  instagramId: z.string().min(1, "Instagram ID is required"),
  username: z.string().min(1, "Username is required"),
  accountType: z.enum(['PERSONAL', 'BUSINESS', 'CREATOR']),
  profilePictureUrl: z.string().url().optional(),
  followersCount: z.number().int().min(0).optional(),
  followingCount: z.number().int().min(0).optional(),
  mediaCount: z.number().int().min(0).optional(),
  biography: z.string().optional(),
  website: z.string().url().optional(),
  name: z.string().optional(),
});

// Media type enum
const MediaType = z.enum(['image', 'video', 'carousel', 'story', 'reel']);

// Post visibility enum
const PostVisibility = z.enum(['public', 'private', 'close_friends']);

// Publish post schema
export const publishPostSchema = z.object({
  mediaType: MediaType,
  mediaUrl: z.string().url("Invalid media URL").optional(),
  mediaUrls: z.array(z.string().url("Invalid media URL")).max(10, "Maximum 10 media items allowed").optional(),
  caption: z.string().max(2200, "Caption cannot exceed 2200 characters").optional(),
  hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/, "Invalid hashtag format")).max(30, "Maximum 30 hashtags allowed").optional(),
  location: z.object({
    id: z.string(),
    name: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  userTags: z.array(
    z.object({
      username: z.string().regex(/^[a-zA-Z0-9._]+$/, "Invalid username format"),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
  ).max(20, "Maximum 20 user tags allowed").optional(),
  scheduledTime: z.string().datetime().optional(),
  visibility: PostVisibility.default('public'),
  disableComments: z.boolean().default(false),
  hideLikeCount: z.boolean().default(false),
}).refine((data) => {
  // Either mediaUrl or mediaUrls should be provided
  return data.mediaUrl || (data.mediaUrls && data.mediaUrls.length > 0);
}, {
  message: "Either mediaUrl or mediaUrls must be provided",
  path: ["mediaUrl"],
});

// Story post schema
export const publishStorySchema = z.object({
  mediaType: z.enum(['image', 'video']),
  mediaUrl: z.string().url("Invalid media URL"),
  text: z.string().max(500, "Story text cannot exceed 500 characters").optional(),
  stickers: z.array(
    z.object({
      type: z.enum(['mention', 'hashtag', 'location', 'poll', 'question', 'countdown', 'music']),
      content: z.string(),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      rotation: z.number().min(0).max(360).optional(),
      scale: z.number().min(0.1).max(2).optional(),
    })
  ).max(10, "Maximum 10 stickers allowed").optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  closeAfter: z.number().int().min(1).max(24).default(24), // hours
  allowReplies: z.boolean().default(true),
  visibility: z.enum(['public', 'close_friends']).default('public'),
});

// Get media insights schema
export const getMediaInsightsSchema = z.object({
  mediaId: z.string().min(1, "Media ID is required"),
  metrics: z.array(
    z.enum([
      'impressions',
      'reach', 
      'likes',
      'comments',
      'saves',
      'shares',
      'profile_visits',
      'website_clicks',
      'follows',
      'video_views',
      'plays'
    ])
  ).optional(),
});

// Get account insights schema
export const getAccountInsightsSchema = z.object({
  period: z.enum(['day', 'week', 'days_28']).default('week'),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  metrics: z.array(
    z.enum([
      'impressions',
      'reach',
      'profile_views', 
      'website_clicks',
      'follower_count',
      'email_contacts',
      'phone_call_clicks',
      'text_message_clicks',
      'get_directions_clicks'
    ])
  ).optional(),
});

// Get hashtag info schema
export const getHashtagInfoSchema = z.object({
  hashtag: z.string().regex(/^[a-zA-Z0-9_]+$/, "Invalid hashtag format"),
  fields: z.array(
    z.enum(['id', 'name', 'media_count', 'top_posts', 'recent_posts'])
  ).optional(),
});

// Comment on media schema
export const commentOnMediaSchema = z.object({
  mediaId: z.string().min(1, "Media ID is required"),
  message: z.string().min(1, "Comment message is required").max(500, "Comment cannot exceed 500 characters"),
});

// Reply to comment schema
export const replyToCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
  message: z.string().min(1, "Reply message is required").max(500, "Reply cannot exceed 500 characters"),
});

// Like/unlike media schema
export const likeMediaSchema = z.object({
  mediaId: z.string().min(1, "Media ID is required"),
  action: z.enum(['like', 'unlike']),
});

// Follow/unfollow user schema
export const followUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(['follow', 'unfollow']),
});

// Send direct message schema
export const sendDirectMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  messageType: z.enum(['text', 'media', 'story_share', 'post_share']),
  text: z.string().max(1000, "Message cannot exceed 1000 characters").optional(),
  mediaUrl: z.string().url("Invalid media URL").optional(),
  mediaId: z.string().optional(), // For sharing posts/stories
}).refine((data) => {
  if (data.messageType === 'text') {
    return data.text && data.text.length > 0;
  }
  if (data.messageType === 'media') {
    return data.mediaUrl;
  }
  if (data.messageType === 'story_share' || data.messageType === 'post_share') {
    return data.mediaId;
  }
  return true;
}, {
  message: "Required fields missing for message type",
  path: ["text"],
});

// Get user info schema
export const getUserInfoSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9._]+$/, "Invalid username format").optional(),
  userId: z.string().optional(),
  fields: z.array(
    z.enum([
      'id',
      'username', 
      'account_type',
      'media_count',
      'followers_count',
      'follows_count',
      'name',
      'biography',
      'website',
      'profile_picture_url'
    ])
  ).optional(),
}).refine((data) => {
  return data.username || data.userId;
}, {
  message: "Either username or userId must be provided",
  path: ["username"],
});

// Search users schema
export const searchUsersSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Query too long"),
  limit: z.number().int().min(1).max(50).default(20),
  fields: z.array(
    z.enum(['id', 'username', 'name', 'profile_picture_url', 'followers_count'])
  ).optional(),
});

// Export types
// OAuth types
export type InstagramConnectInput = z.infer<typeof instagramConnectSchema>;
export type InstagramCallbackInput = z.infer<typeof instagramCallbackSchema>;
export type InstagramRefreshTokenInput = z.infer<typeof instagramRefreshTokenSchema>;
export type ConnectionStatusInput = z.infer<typeof connectionStatusSchema>;
export type DisconnectAccountInput = z.infer<typeof disconnectAccountSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;
export type PlatformAccountData = z.infer<typeof platformAccountDataSchema>;

// Media and content types
export type PublishPostInput = z.infer<typeof publishPostSchema>;
export type PublishStoryInput = z.infer<typeof publishStorySchema>;
export type GetMediaInsightsInput = z.infer<typeof getMediaInsightsSchema>;
export type GetAccountInsightsInput = z.infer<typeof getAccountInsightsSchema>;
export type GetHashtagInfoInput = z.infer<typeof getHashtagInfoSchema>;
export type CommentOnMediaInput = z.infer<typeof commentOnMediaSchema>;
export type ReplyToCommentInput = z.infer<typeof replyToCommentSchema>;
export type LikeMediaInput = z.infer<typeof likeMediaSchema>;
export type FollowUserInput = z.infer<typeof followUserSchema>;
export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
export type GetUserInfoInput = z.infer<typeof getUserInfoSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;