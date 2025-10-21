# Instagram Graph API Integration Guide

## Overview

This application integrates with the **Instagram Graph API** to provide comprehensive Instagram automation features for business and creator accounts. The Instagram Basic Display API has been deprecated, and this implementation uses the current standard Graph API.

## Prerequisites

### 1. Meta Developer Account
- Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com)
- Verify your account with a valid phone number

### 2. Instagram Business/Creator Account
- Convert your Instagram account to a Business or Creator account
- Connect it to a Facebook Page (required for Graph API access)

### 3. Facebook App Setup
1. Create a new Facebook App in Meta Developer Console
2. Add "Instagram Graph API" product to your app
3. Configure OAuth redirect URIs
4. Get your App ID and App Secret

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Instagram Graph API Credentials
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# OAuth Configuration
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
OAUTH_STATE_SECRET=your_random_secret_string

# API Configuration
INSTAGRAM_API_BASE_URL=https://graph.instagram.com
FACEBOOK_API_BASE_URL=https://graph.facebook.com

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_HOUR=200

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Core Endpoints
- `GET /` - Welcome page
- `GET /health` - Health check
- `GET /api/status` - API status and available endpoints

### Authentication Endpoints
- `GET /auth/instagram` - Start Instagram OAuth flow
- `GET /auth/instagram/callback` - OAuth callback handler
- `POST /auth/instagram/refresh` - Refresh access token
- `POST /auth/instagram/validate` - Validate access token

### Instagram API Endpoints
- `GET /api/instagram/profile` - Get user profile information
- `GET /api/instagram/media` - Get user media (posts)
- `GET /api/instagram/media/:id` - Get specific media details
- `POST /api/instagram/publish` - Publish new media
- `GET /api/instagram/insights/media/:id` - Get media insights
- `GET /api/instagram/insights/account` - Get account insights
- `GET /api/instagram/hashtag/:hashtag` - Get hashtag information
- `GET /api/instagram/rate-limit` - Check current rate limit status

## Authentication Flow

### 1. Start OAuth Flow
```bash
curl http://localhost:3000/auth/instagram
```

Response:
```json
{
  "success": true,
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=...",
  "state": "random_state_string"
}
```

### 2. User Authorization
- Redirect user to the `authUrl`
- User grants permissions
- Instagram redirects back to your callback URL

### 3. Handle Callback
The callback endpoint automatically:
- Exchanges authorization code for access token
- Converts to long-lived token (60 days)
- Returns token information

### 4. Use Access Token
Include the access token in subsequent API requests:
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:3000/api/instagram/profile
```

## Required Permissions

Your Facebook App needs the following Instagram permissions:
- `instagram_graph_user_profile` - Access to profile information
- `instagram_graph_user_media` - Access to user media
- `instagram_content_publish` - Publish content
- `instagram_manage_insights` - Access to insights data

## Rate Limiting

The Instagram Graph API has the following rate limits:
- **200 requests per hour** per access token
- Rate limits reset every hour
- The API tracks and enforces these limits automatically

Check current rate limit status:
```bash
curl http://localhost:3000/api/instagram/rate-limit
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

Common error codes:
- `INVALID_TOKEN` - Access token is invalid or expired
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `INSUFFICIENT_PERMISSIONS` - Missing required permissions
- `MEDIA_NOT_FOUND` - Requested media doesn't exist

## Media Publishing

### Image Publishing
```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "caption": "Your post caption #hashtag"
  }'
```

### Video Publishing
```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "video_url": "https://example.com/video.mp4",
    "caption": "Your video caption #hashtag"
  }'
```

## Insights and Analytics

### Media Insights
Get insights for a specific post:
```bash
curl http://localhost:3000/api/instagram/insights/media/MEDIA_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Account Insights
Get account-level insights:
```bash
curl http://localhost:3000/api/instagram/insights/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Hashtag Research

Get information about hashtags:
```bash
curl http://localhost:3000/api/instagram/hashtag/travel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development and Testing

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **"Instagram app credentials not configured"**
   - Ensure all environment variables are set correctly
   - Verify your Facebook App ID and Secret

2. **"Instagram access token not configured"**
   - Complete the OAuth flow to get an access token
   - Ensure the token hasn't expired (60-day limit)

3. **Rate limit exceeded**
   - Wait for the rate limit to reset (hourly)
   - Implement proper rate limiting in your application

4. **Invalid permissions**
   - Ensure your Facebook App has the required Instagram permissions
   - Re-authorize if permissions were added after initial setup

### Logs

Application logs are written to the `./logs/` directory:
- `combined.log` - All log levels
- `error.log` - Error logs only

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different credentials for development and production

2. **Access Tokens**
   - Store tokens securely (encrypted database recommended)
   - Implement token refresh logic
   - Monitor for token expiration

3. **Rate Limiting**
   - Implement client-side rate limiting
   - Cache API responses when possible
   - Use webhooks for real-time updates instead of polling

## Support and Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Meta Developer Community](https://developers.facebook.com/community/)
- [Instagram Platform Policy](https://developers.facebook.com/docs/instagram-api/overview#instagram-platform-policy)

## License

This project is licensed under the MIT License.