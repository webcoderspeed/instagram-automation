# User Management API Documentation

## Overview
The User Management API provides comprehensive user profile management, settings, and account administration functionality. It handles user data, preferences, and account-related operations.

## Base URL
```
/api/users
```

## Authentication
All user management endpoints require authentication via session cookie or JWT token. Include the authentication token in your requests.

## Required Permissions
User endpoints require specific role-based permissions:
- `USER_READ`: View user data
- `USER_WRITE`: Modify user data
- `USER_ADMIN`: Administrative user operations

## Table of Contents
1. [User Profile Management](#user-profile-management)
2. [User Settings](#user-settings)
3. [Account Administration](#account-administration)
4. [User Preferences](#user-preferences)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Security Features](#security-features)
8. [Best Practices](#best-practices)

---

## User Profile Management

### Get User Profile
Retrieve the current user's profile information.

**Endpoint:** `GET /profile`  
**Required Permission:** `USER_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Social media enthusiast",
    "website": "https://johndoe.com",
    "location": "New York, NY",
    "role": "user",
    "permissions": ["USER_READ", "USER_WRITE"],
    "isEmailVerified": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/users/profile" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

### Update User Profile
Update the current user's profile information.

**Endpoint:** `PUT /profile`  
**Required Permission:** `USER_WRITE`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "bio": "Updated bio",
  "website": "https://newwebsite.com",
  "location": "San Francisco, CA",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "bio": "Updated bio",
    "website": "https://newwebsite.com",
    "location": "San Francisco, CA",
    "avatar": "https://example.com/new-avatar.jpg",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## User Settings

### Get User Settings
Retrieve all user settings and preferences.

**Endpoint:** `GET /settings`  
**Required Permission:** `USER_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": true,
      "push": false,
      "sms": false,
      "marketing": true
    },
    "privacy": {
      "profileVisibility": "public",
      "showEmail": false,
      "showLastSeen": true
    },
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "dateFormat": "MM/DD/YYYY",
      "theme": "light"
    },
    "automation": {
      "autoApprove": false,
      "maxDailyActions": 100,
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00"
      }
    }
  }
}
```

### Update User Settings
Update specific user settings and preferences.

**Endpoint:** `PUT /settings`  
**Required Permission:** `USER_WRITE`

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "push": true,
    "marketing": false
  },
  "preferences": {
    "language": "es",
    "timezone": "America/Los_Angeles",
    "theme": "dark"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updatedSettings": ["notifications", "preferences"],
    "updatedAt": "2024-01-15T11:15:00Z"
  }
}
```

---

## Account Administration

### Get User Statistics
Retrieve user account statistics and usage metrics.

**Endpoint:** `GET /stats`  
**Required Permission:** `USER_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "accountAge": 45,
    "totalLogins": 127,
    "lastLogin": "2024-01-15T10:30:00Z",
    "connectedAccounts": 3,
    "activeAutomations": 8,
    "totalPosts": 156,
    "engagement": {
      "totalLikes": 2847,
      "totalComments": 394,
      "totalShares": 89
    },
    "subscription": {
      "plan": "professional",
      "status": "active",
      "expiresAt": "2024-02-15T00:00:00Z"
    }
  }
}
```

### Account Activity Log
Retrieve user account activity and audit log.

**Endpoint:** `GET /activity`  
**Required Permission:** `USER_READ`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20, max: 100)
- `offset` (optional): Number of activities to skip (default: 0)
- `type` (optional): Filter by activity type
- `startDate` (optional): Filter activities from this date
- `endDate` (optional): Filter activities until this date

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "type": "login",
        "description": "User logged in",
        "timestamp": "2024-01-15T10:30:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "metadata": {
          "device": "desktop",
          "location": "New York, NY"
        }
      },
      {
        "id": "activity_124",
        "type": "profile_update",
        "description": "Profile information updated",
        "timestamp": "2024-01-15T11:00:00Z",
        "changes": ["firstName", "bio"]
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## User Preferences

### Notification Preferences
Manage user notification settings across different channels.

**Notification Types:**
- `email`: Email notifications
- `push`: Push notifications
- `sms`: SMS notifications
- `marketing`: Marketing communications
- `security`: Security alerts
- `automation`: Automation updates

**Notification Categories:**
- `account`: Account-related notifications
- `automation`: Automation execution updates
- `engagement`: Social media engagement alerts
- `billing`: Billing and subscription updates
- `security`: Security and login alerts

### Privacy Settings
Control user privacy and data visibility settings.

**Privacy Options:**
- `profileVisibility`: public, private, friends
- `showEmail`: boolean
- `showLastSeen`: boolean
- `allowDirectMessages`: boolean
- `dataSharing`: boolean

### Application Preferences
Customize application behavior and appearance.

**Preference Categories:**
- `language`: User interface language
- `timezone`: User timezone for scheduling
- `dateFormat`: Date display format
- `timeFormat`: 12h or 24h time format
- `theme`: light, dark, auto
- `currency`: Preferred currency for billing

---

## Data Models

### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  role: string;
  permissions: string[];
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Settings
```typescript
interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    security: boolean;
    automation: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    theme: 'light' | 'dark' | 'auto';
    currency: string;
  };
  automation: {
    autoApprove: boolean;
    maxDailyActions: number;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}
```

### Activity Log Entry
```typescript
interface ActivityLogEntry {
  id: string;
  userId: string;
  type: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  changes?: string[];
}
```

---

## Error Handling

### Common Error Responses

#### User Not Found
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "statusCode": 404
}
```

#### Insufficient Permissions
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "statusCode": 403
}
```

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": {
    "email": "Invalid email format",
    "username": "Username already exists"
  }
}
```

#### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 60
}
```

---

## Security Features

### Data Protection
- **Encryption**: Sensitive data is encrypted at rest and in transit
- **Access Control**: Role-based permissions for all operations
- **Audit Logging**: Complete audit trail of user activities
- **Session Management**: Secure session handling and timeout

### Privacy Controls
- **Data Minimization**: Only collect necessary user data
- **Consent Management**: Clear consent for data processing
- **Right to Deletion**: Users can request account deletion
- **Data Export**: Users can export their data

### Authentication Security
- **Multi-Factor Authentication**: Optional 2FA support
- **Password Security**: Strong password requirements
- **Session Security**: Secure session tokens and rotation
- **Login Monitoring**: Suspicious login detection

---

## Best Practices

### 1. Profile Management
- **Complete Profiles**: Encourage users to complete their profiles
- **Regular Updates**: Prompt users to keep information current
- **Avatar Guidelines**: Provide guidelines for profile pictures

### 2. Settings Management
- **Default Settings**: Provide sensible default settings
- **Granular Control**: Allow fine-grained control over preferences
- **Easy Reset**: Provide easy way to reset to defaults

### 3. Privacy and Security
- **Privacy by Design**: Default to most private settings
- **Clear Communication**: Clearly explain privacy implications
- **Regular Reviews**: Encourage users to review settings regularly

### 4. User Experience
- **Progressive Disclosure**: Show advanced settings only when needed
- **Contextual Help**: Provide help text for complex settings
- **Immediate Feedback**: Provide immediate feedback for changes

### 5. Data Management
- **Regular Backups**: Backup user data regularly
- **Data Validation**: Validate all user input
- **Graceful Degradation**: Handle missing or invalid data gracefully

This documentation provides comprehensive coverage of the User Management API functionality and best practices for implementation.