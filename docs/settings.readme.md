# Settings API

Base URL: `/api/settings`

## Overview

The Settings API provides comprehensive user settings management functionality, allowing users to configure their profile, notifications, privacy, automation, billing, and security preferences. All endpoints are protected by role-based permissions and require proper authentication.

## Key Features

- **Comprehensive Settings Management**: Manage all aspects of user preferences
- **Granular Permissions**: Fine-grained access control for different setting categories
- **Bulk Operations**: Update multiple settings at once or individual categories
- **Settings Export/Import**: Export settings for backup or migration
- **Default Reset**: Reset settings to default values
- **Real-time Updates**: Immediate application of setting changes

## Table of Contents
- [General Settings](#general-settings)
- [Profile Settings](#profile-settings)
- [Notification Settings](#notification-settings)
- [Privacy Settings](#privacy-settings)
- [Automation Settings](#automation-settings)
- [Billing Settings](#billing-settings)
- [Security Settings](#security-settings)
- [Settings Management](#settings-management)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)

## General Settings

### Get All Settings
- **Endpoint**: `GET /api/settings`
- **Description**: Retrieve all user settings across all categories
- **Authentication**: Required
- **Permissions**: `SETTINGS_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "profile": {
      "displayName": "John Doe",
      "bio": "Social media enthusiast",
      "website": "https://johndoe.com",
      "location": "New York, NY",
      "avatar": "https://example.com/avatar.jpg",
      "timezone": "America/New_York",
      "language": "en"
    },
    "notifications": {
      "email": {
        "enabled": true,
        "frequency": "immediate",
        "types": ["automation", "billing", "security"]
      },
      "push": {
        "enabled": true,
        "types": ["posts", "comments", "mentions"]
      },
      "sms": {
        "enabled": false,
        "number": "+1234567890"
      }
    },
    "privacy": {
      "profileVisibility": "public",
      "showEmail": false,
      "showPhone": false,
      "dataSharing": false,
      "analyticsTracking": true
    },
    "automation": {
      "autoPost": true,
      "autoReply": false,
      "maxDailyPosts": 5,
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00"
      }
    },
    "billing": {
      "plan": "premium",
      "billingCycle": "monthly",
      "autoRenew": true,
      "currency": "USD",
      "invoiceEmail": "billing@example.com"
    },
    "security": {
      "twoFactorEnabled": false,
      "loginNotifications": true,
      "sessionTimeout": 30,
      "allowedIPs": [],
      "passwordChangeRequired": false
    }
  }
}
```

### Update Multiple Settings
- **Endpoint**: `PUT /api/settings`
- **Description**: Update multiple settings across different categories at once
- **Authentication**: Required
- **Permissions**: `SETTINGS_UPDATE`

#### Request Body
```json
{
  "profile": {
    "displayName": "Jane Doe",
    "bio": "Updated bio"
  },
  "notifications": {
    "email": {
      "enabled": false
    }
  },
  "privacy": {
    "profileVisibility": "private"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updatedCategories": ["profile", "notifications", "privacy"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Profile Settings

### Get Profile Settings
- **Endpoint**: `GET /api/settings/profile`
- **Description**: Retrieve user profile settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "displayName": "John Doe",
    "bio": "Social media enthusiast",
    "website": "https://johndoe.com",
    "location": "New York, NY",
    "avatar": "https://example.com/avatar.jpg",
    "timezone": "America/New_York",
    "language": "en",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h"
  }
}
```

### Update Profile Settings
- **Endpoint**: `PUT /api/settings/profile`
- **Description**: Update user profile settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_PROFILE_UPDATE`

#### Request Body
```json
{
  "displayName": "Jane Doe",
  "bio": "Updated bio description",
  "website": "https://janedoe.com",
  "location": "Los Angeles, CA",
  "timezone": "America/Los_Angeles",
  "language": "es"
}
```

## Notification Settings

### Get Notification Settings
- **Endpoint**: `GET /api/settings/notifications`
- **Description**: Retrieve user notification preferences
- **Authentication**: Required
- **Permissions**: `SETTINGS_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "email": {
      "enabled": true,
      "frequency": "immediate",
      "types": ["automation", "billing", "security", "posts", "comments"]
    },
    "push": {
      "enabled": true,
      "types": ["posts", "comments", "mentions", "automation"]
    },
    "sms": {
      "enabled": false,
      "number": "+1234567890",
      "types": ["security", "billing"]
    },
    "inApp": {
      "enabled": true,
      "types": ["all"]
    }
  }
}
```

### Update Notification Settings
- **Endpoint**: `PUT /api/settings/notifications`
- **Description**: Update user notification preferences
- **Authentication**: Required
- **Permissions**: `SETTINGS_NOTIFICATION_UPDATE`

#### Request Body
```json
{
  "email": {
    "enabled": false,
    "frequency": "daily"
  },
  "push": {
    "enabled": true,
    "types": ["posts", "comments"]
  }
}
```

## Privacy Settings

### Get Privacy Settings
- **Endpoint**: `GET /api/settings/privacy`
- **Description**: Retrieve user privacy settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false,
    "dataSharing": false,
    "analyticsTracking": true,
    "cookiePreferences": {
      "necessary": true,
      "analytics": true,
      "marketing": false
    },
    "searchEngineIndexing": true
  }
}
```

### Update Privacy Settings
- **Endpoint**: `PUT /api/settings/privacy`
- **Description**: Update user privacy settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_PRIVACY_UPDATE`

#### Request Body
```json
{
  "profileVisibility": "private",
  "dataSharing": false,
  "analyticsTracking": false,
  "cookiePreferences": {
    "analytics": false,
    "marketing": false
  }
}
```

## Automation Settings

### Get Automation Settings
- **Endpoint**: `GET /api/settings/automation`
- **Description**: Retrieve user automation preferences
- **Authentication**: Required
- **Permissions**: `AUTOMATION_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "autoPost": true,
    "autoReply": false,
    "maxDailyPosts": 5,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    },
    "contentFilters": {
      "enabled": true,
      "keywords": ["spam", "inappropriate"],
      "sentiment": "positive"
    },
    "schedulingPreferences": {
      "optimalTiming": true,
      "audienceTimezone": true
    }
  }
}
```

### Update Automation Settings
- **Endpoint**: `PUT /api/settings/automation`
- **Description**: Update user automation preferences
- **Authentication**: Required
- **Permissions**: `AUTOMATION_UPDATE`

#### Request Body
```json
{
  "autoPost": false,
  "maxDailyPosts": 3,
  "quietHours": {
    "enabled": false
  },
  "contentFilters": {
    "enabled": true,
    "keywords": ["updated", "keywords"]
  }
}
```

## Billing Settings

### Get Billing Settings
- **Endpoint**: `GET /api/settings/billing`
- **Description**: Retrieve user billing preferences
- **Authentication**: Required
- **Permissions**: `SUBSCRIPTION_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "plan": "premium",
    "billingCycle": "monthly",
    "autoRenew": true,
    "currency": "USD",
    "invoiceEmail": "billing@example.com",
    "paymentMethod": {
      "type": "card",
      "last4": "1234",
      "expiryMonth": 12,
      "expiryYear": 2025
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US"
    }
  }
}
```

### Update Billing Settings
- **Endpoint**: `PUT /api/settings/billing`
- **Description**: Update user billing preferences
- **Authentication**: Required
- **Permissions**: `SUBSCRIPTION_UPDATE`

#### Request Body
```json
{
  "billingCycle": "yearly",
  "autoRenew": false,
  "invoiceEmail": "newemail@example.com",
  "billingAddress": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90210"
  }
}
```

## Security Settings

### Get Security Settings
- **Endpoint**: `GET /api/settings/security`
- **Description**: Retrieve user security settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_READ`

#### Response
```json
{
  "success": true,
  "data": {
    "twoFactorEnabled": false,
    "loginNotifications": true,
    "sessionTimeout": 30,
    "allowedIPs": [],
    "passwordChangeRequired": false,
    "loginHistory": {
      "enabled": true,
      "retentionDays": 90
    },
    "deviceManagement": {
      "enabled": true,
      "maxDevices": 5
    },
    "apiKeyManagement": {
      "enabled": true,
      "maxKeys": 3
    }
  }
}
```

### Update Security Settings
- **Endpoint**: `PUT /api/settings/security`
- **Description**: Update user security settings
- **Authentication**: Required
- **Permissions**: `SETTINGS_SECURITY_UPDATE`

#### Request Body
```json
{
  "twoFactorEnabled": true,
  "sessionTimeout": 60,
  "loginNotifications": false,
  "allowedIPs": ["192.168.1.1", "10.0.0.1"],
  "deviceManagement": {
    "maxDevices": 3
  }
}
```

## Settings Management

### Export Settings
- **Endpoint**: `GET /api/settings/export`
- **Description**: Export all user settings for backup or migration
- **Authentication**: Required
- **Permissions**: `SETTINGS_EXPORT`

#### Query Parameters
- `format` (optional): Export format (`json`, `csv`) - Default: `json`
- `categories` (optional): Comma-separated list of categories to export

#### Response
```json
{
  "success": true,
  "data": {
    "exportId": "exp_1234567890",
    "downloadUrl": "https://api.example.com/downloads/settings_export_1234567890.json",
    "expiresAt": "2024-01-16T10:30:00Z",
    "categories": ["profile", "notifications", "privacy", "automation", "billing", "security"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Reset Settings
- **Endpoint**: `POST /api/settings/reset`
- **Description**: Reset settings to default values
- **Authentication**: Required
- **Permissions**: `SETTINGS_RESET`

#### Request Body
```json
{
  "categories": ["notifications", "privacy"],
  "confirmReset": true
}
```

#### Response
```json
{
  "success": true,
  "message": "Settings reset successfully",
  "data": {
    "resetCategories": ["notifications", "privacy"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Data Models

### Settings Object
```typescript
interface Settings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  automation: AutomationSettings;
  billing: BillingSettings;
  security: SecuritySettings;
}
```

### ProfileSettings
```typescript
interface ProfileSettings {
  displayName: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}
```

### NotificationSettings
```typescript
interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    types: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
  };
  sms: {
    enabled: boolean;
    number?: string;
    types: string[];
  };
  inApp: {
    enabled: boolean;
    types: string[];
  };
}
```

### PrivacySettings
```typescript
interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  cookiePreferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  searchEngineIndexing: boolean;
}
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (Invalid input data)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Settings category not found)
- `422` - Unprocessable Entity (Validation errors)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid settings data provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## Rate Limiting

### Rate Limits
- **General Settings**: 100 requests per hour per user
- **Settings Updates**: 50 requests per hour per user
- **Export Operations**: 5 requests per hour per user
- **Reset Operations**: 3 requests per hour per user

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Best Practices

### Efficient Settings Management
1. **Batch Updates**: Use the bulk update endpoint for multiple changes
2. **Selective Retrieval**: Request only needed setting categories
3. **Caching**: Cache settings data to reduce API calls
4. **Validation**: Validate settings on the client side before submission

### Security Considerations
1. **Sensitive Data**: Never log or expose sensitive settings
2. **Permission Checks**: Always verify user permissions before updates
3. **Input Validation**: Validate all input data thoroughly
4. **Audit Trail**: Maintain logs of settings changes

### Performance Optimization
1. **Pagination**: Use pagination for large settings exports
2. **Compression**: Enable gzip compression for large responses
3. **CDN**: Use CDN for settings export downloads
4. **Monitoring**: Monitor API performance and usage patterns

### User Experience
1. **Real-time Updates**: Apply settings changes immediately
2. **Validation Feedback**: Provide clear validation error messages
3. **Default Values**: Provide sensible default settings
4. **Backup/Restore**: Allow users to backup and restore settings