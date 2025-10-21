# Instagram Business Login Updates

This document summarizes the updates made to implement Instagram Business Login according to the official Facebook documentation.

## Overview

The codebase has been updated to use the new Instagram Business Login flow and scope values. The old scope values will be deprecated on **January 27, 2025**, so these updates are critical for continued functionality.

## Key Changes Made

### 1. Updated Authentication Scopes

**Old scopes (deprecated Jan 27, 2025):**
- `user_profile`
- `user_media`
- `business_basic`
- `business_content_publish`
- `business_manage_comments`
- `business_manage_messages`

**New Instagram Business scopes:**
- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_messages`
- `instagram_business_manage_comments`

### 2. Updated OAuth Endpoints

**Authorization URL:**
- Updated from: `https://api.instagram.com/oauth/authorize`
- Updated to: `https://www.instagram.com/oauth/authorize`

**Token Exchange Endpoints:**
- Short-lived token: `https://api.instagram.com/oauth/access_token` (unchanged)
- Long-lived token: `https://graph.instagram.com/access_token` (updated from Facebook Graph API)
- Token refresh: `https://graph.instagram.com/refresh_access_token` (updated from Facebook Graph API)

### 3. Files Modified

#### `src/services/auth.ts`
- Updated `INSTAGRAM_OAUTH_URL` to use Instagram Business Login endpoint
- Updated default scopes to use new Instagram Business scope values
- Updated `exchangeForLongLivedToken()` to use Instagram Graph API endpoint
- Updated `refreshLongLivedToken()` to use Instagram Graph API endpoint
- Added documentation comments explaining the changes

#### `.env`
- Added comprehensive comments documenting all Instagram Business Login endpoints
- Updated configuration section titles to reflect Instagram Business Login
- Added deprecation warning for old scope values

## API Endpoint Reference

According to the Instagram Business Login documentation:

| Purpose | Endpoint |
|---------|----------|
| Authorization | `https://www.instagram.com/oauth/authorize` |
| Token Exchange | `https://api.instagram.com/oauth/access_token` |
| Long-lived Token | `https://graph.instagram.com/access_token` |
| Token Refresh | `https://graph.instagram.com/refresh_access_token` |
| User Info | `https://graph.facebook.com/v24.0/me` |

## Required App Configuration

Ensure your Meta App Dashboard is configured with:

1. **Instagram Product** added to your app
2. **Business Login Settings** configured with:
   - Instagram App ID
   - Instagram App Secret
   - Valid OAuth redirect URIs
3. **Appropriate Access Level:**
   - Advanced Access: For Instagram professional accounts you don't own
   - Standard Access: For Instagram professional accounts you own/manage

## Testing Recommendations

1. Test the authorization flow with the new scopes
2. Verify token exchange functionality
3. Test token refresh mechanism
4. Validate user information retrieval
5. Ensure all API calls work with the updated endpoints

## Migration Timeline

- **Now**: New Instagram Business scope values are available
- **January 27, 2025**: Old scope values will be deprecated
- **Action Required**: Update your app before the deprecation date to avoid service disruption

## Notes

- The getUserInfo method continues to use Facebook Graph API (`graph.facebook.com`) as this is correct for Instagram Business accounts
- All token-related operations now use Instagram Graph API (`graph.instagram.com`) endpoints
- The authorization flow uses the Instagram-specific OAuth endpoint (`www.instagram.com`)