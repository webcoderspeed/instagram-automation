# Settings API Documentation

This documentation covers all user settings endpoints for the Instagram Automation SaaS application. These endpoints allow users to manage their profile, notification preferences, privacy settings, automation configurations, billing information, and security settings.

## Base URL
```
http://localhost:3000/api/settings
```

## Table of Contents
1. [General Settings](#general-settings)
2. [Profile Settings](#profile-settings)
3. [Notification Settings](#notification-settings)
4. [Privacy Settings](#privacy-settings)
5. [Automation Settings](#automation-settings)
6. [Billing Settings](#billing-settings)
7. [Security Settings](#security-settings)
8. [Error Responses](#error-responses)
9. [Authentication](#authentication)

---

## General Settings

### 1. Get All Settings
**Endpoint:** `GET /`  
**Description:** Retrieves all user settings in a single response.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "profile": {
        "displayName": "John Doe",
        "firstName": "John",
        "lastName": "Doe",
        "bio": "Content Creator & Photographer",
        "website": "https://johndoe.com",
        "location": "Mumbai, India",
        "timezone": "Asia/Kolkata",
        "language": "en",
        "avatar": "https://example.com/avatar.jpg",
        "dateFormat": "DD/MM/YYYY",
        "timeFormat": "24h",
        "socialLinks": {
          "instagram": "@johndoe",
          "twitter": "@johndoe",
          "youtube": "johndoe",
          "linkedin": "johndoe",
          "tiktok": "@johndoe"
        }
      },
      "notifications": {
        "email": {
          "automationUpdates": true,
          "weeklyReports": true,
          "monthlyReports": false,
          "securityAlerts": true,
          "marketingEmails": false,
          "billingNotifications": true,
          "systemMaintenance": true,
          "newFeatures": true,
          "errorAlerts": true
        },
        "push": {
          "automationStatus": true,
          "postPublished": true,
          "errorAlerts": true,
          "followerMilestones": false,
          "engagementSpikes": true,
          "scheduledPostReminders": true
        },
        "inApp": {
          "realTimeUpdates": true,
          "systemMessages": true,
          "tips": false,
          "tutorials": true,
          "announcements": true
        },
        "sms": {
          "securityAlerts": false,
          "criticalErrors": false,
          "billingIssues": false
        }
      },
      "privacy": {
        "profileVisibility": "public",
        "dataSharing": false,
        "analyticsTracking": true,
        "thirdPartyIntegrations": true,
        "cookieConsent": true,
        "marketingConsent": false,
        "dataRetention": {
          "period": 365,
          "autoDelete": false,
          "deleteAfterInactivity": 730
        },
        "exportData": {
          "lastExported": "2024-01-01T10:00:00Z",
          "frequency": "monthly",
          "autoExport": false
        },
        "accountVisibility": {
          "showInDirectory": false,
          "allowSearchEngines": true,
          "publicStats": false
        }
      },
      "automation": {
        "defaultSchedule": {
          "startTime": "09:00",
          "endTime": "18:00",
          "timezone": "Asia/Kolkata",
          "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
          "pauseOnWeekends": false,
          "pauseOnHolidays": true
        },
        "safetyLimits": {
          "maxLikesPerHour": 30,
          "maxFollowsPerHour": 20,
          "maxCommentsPerHour": 10,
          "maxUnfollowsPerHour": 15,
          "maxStoriesPerHour": 25,
          "dailyLimits": {
            "likes": 500,
            "follows": 200,
            "comments": 100,
            "unfollows": 150,
            "stories": 300
          },
          "weeklyLimits": {
            "likes": 3000,
            "follows": 1000,
            "comments": 500
          }
        },
        "autoStop": {
          "enabled": true,
          "onError": true,
          "onRateLimit": true,
          "onSuspiciousActivity": true,
          "onAccountRestriction": true,
          "cooldownPeriod": 60
        },
        "contentFilters": {
          "skipBusinessAccounts": false,
          "skipVerifiedAccounts": true,
          "skipPrivateAccounts": true,
          "minFollowers": 100,
          "maxFollowers": 50000,
          "minFollowing": 50,
          "maxFollowing": 5000,
          "minPosts": 10,
          "accountAgeMinDays": 30,
          "engagementRateMin": 1.0,
          "engagementRateMax": 15.0
        },
        "smartFeatures": {
          "aiContentAnalysis": true,
          "smartScheduling": true,
          "audienceOptimization": true,
          "hashtagSuggestions": true,
          "competitorAnalysis": false
        }
      },
      "billing": {
        "currency": "INR",
        "invoiceEmail": "billing@example.com",
        "autoRenew": true,
        "usageAlerts": true,
        "billingAddress": {
          "name": "John Doe",
          "company": "Doe Enterprises",
          "address": "123 Main Street",
          "address2": "Suite 456",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "IN"
        },
        "taxInfo": {
          "gstNumber": "27AAAAA0000A1Z5",
          "taxExempt": false,
          "vatNumber": null,
          "businessType": "individual"
        },
        "alerts": {
          "usageThreshold": 80,
          "billingFailure": true,
          "renewalReminder": 7,
          "paymentMethodExpiry": 30,
          "invoiceGenerated": true
        },
        "preferences": {
          "paperlessInvoices": true,
          "detailedUsageReports": true,
          "costOptimizationTips": true
        }
      },
      "security": {
        "twoFactorAuth": {
          "enabled": false,
          "method": null,
          "backupCodes": 0,
          "lastSetup": null
        },
        "sessionTimeout": 24,
        "loginAlerts": true,
        "deviceTracking": true,
        "passwordPolicy": {
          "minLength": 8,
          "requireUppercase": true,
          "requireNumbers": true,
          "requireSymbols": true,
          "preventReuse": 5,
          "maxAge": 90
        },
        "accessControl": {
          "ipWhitelist": [],
          "allowedCountries": [],
          "blockSuspiciousLogins": true,
          "requireEmailVerification": true
        },
        "apiAccess": {
          "enabled": true,
          "rateLimit": 1000,
          "allowedIPs": [],
          "webhookSecurity": true
        }
      },
      "integrations": {
        "instagram": {
          "connected": true,
          "accountId": "instagram_123",
          "permissions": ["basic", "content", "insights"],
          "lastSync": "2024-01-15T10:30:00Z"
        },
        "facebook": {
          "connected": false,
          "accountId": null,
          "permissions": [],
          "lastSync": null
        },
        "google": {
          "connected": true,
          "accountId": "google_456",
          "permissions": ["analytics"],
          "lastSync": "2024-01-15T09:00:00Z"
        },
        "zapier": {
          "connected": false,
          "webhookUrl": null,
          "activeZaps": 0
        }
      }
    },
    "lastUpdated": "2024-01-15T12:00:00Z",
    "version": "2.1"
  },
  "message": "Settings retrieved successfully"
}
```

### 2. Update Multiple Settings
**Endpoint:** `PUT /`  
**Description:** Updates multiple settings categories in a single request.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 30 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "profile": {
      "displayName": "John Smith",
      "timezone": "Asia/Kolkata",
      "language": "hi"
    },
    "notifications": {
      "email": {
        "weeklyReports": false,
        "marketingEmails": true
      }
    },
    "automation": {
      "safetyLimits": {
        "maxLikesPerHour": 25
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updatedFields": [
      "profile.displayName",
      "profile.timezone",
      "profile.language",
      "notifications.email.weeklyReports",
      "notifications.email.marketingEmails",
      "automation.safetyLimits.maxLikesPerHour"
    ],
    "updatedAt": "2024-01-15T14:30:00Z",
    "affectedCategories": ["profile", "notifications", "automation"]
  }
}
```

### 3. Export Settings
**Endpoint:** `GET /export`  
**Description:** Exports all user settings in JSON format for backup or migration.  
**Required Permission:** `USER_READ`  
**Rate Limit:** 5 requests per day

```bash
curl -X GET http://localhost:3000/api/settings/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `format` (optional) - Export format (json, csv) - default: json
- `categories` (optional) - Comma-separated list of categories to export
- `includeSecrets` (optional) - Include sensitive data (true/false) - default: false

**Response:**
```json
{
  "success": true,
  "data": {
    "export": {
      "exportedAt": "2024-01-15T12:00:00Z",
      "version": "2.1",
      "userId": "user_123",
      "format": "json",
      "categories": ["profile", "notifications", "privacy", "automation", "billing"],
      "settings": {
        "profile": { "..." },
        "notifications": { "..." },
        "privacy": { "..." },
        "automation": { "..." },
        "billing": { "..." }
      },
      "metadata": {
        "totalSettings": 156,
        "exportSize": "12.5KB",
        "checksum": "sha256:abc123..."
      }
    }
  },
  "message": "Settings exported successfully"
}
```

### 4. Import Settings
**Endpoint:** `POST /import`  
**Description:** Imports settings from a previously exported file.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 3 requests per day

```bash
curl -X POST http://localhost:3000/api/settings/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "settings": {
      "profile": {
        "displayName": "Imported Name",
        "timezone": "Asia/Kolkata"
      },
      "notifications": {
        "email": {
          "weeklyReports": true
        }
      }
    },
    "overwrite": false,
    "validateOnly": false
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Settings imported successfully",
  "data": {
    "importedAt": "2024-01-15T13:00:00Z",
    "importedFields": [
      "profile.displayName",
      "profile.timezone",
      "notifications.email.weeklyReports"
    ],
    "skippedFields": [],
    "conflicts": [],
    "summary": {
      "totalImported": 3,
      "totalSkipped": 0,
      "totalConflicts": 0
    }
  }
}
```

### 5. Reset Settings
**Endpoint:** `POST /reset`  
**Description:** Resets specified settings categories to default values.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 10 requests per day

```bash
curl -X POST http://localhost:3000/api/settings/reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "categories": ["notifications", "automation"],
    "confirmReset": true,
    "preserveCustomizations": false
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Settings reset successfully",
  "data": {
    "resetCategories": ["notifications", "automation"],
    "resetAt": "2024-01-15T13:00:00Z",
    "resetFields": [
      "notifications.email.weeklyReports",
      "notifications.push.automationStatus",
      "automation.safetyLimits.maxLikesPerHour",
      "automation.defaultSchedule.startTime"
    ],
    "preservedFields": [],
    "summary": {
      "totalReset": 4,
      "totalPreserved": 0
    }
  }
}
```

---

## Profile Settings

### 6. Get Profile Settings
**Endpoint:** `GET /profile`  
**Description:** Retrieves user profile settings and preferences.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "displayName": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Content Creator & Photographer",
      "website": "https://johndoe.com",
      "location": "Mumbai, India",
      "timezone": "Asia/Kolkata",
      "language": "en",
      "avatar": "https://example.com/avatar.jpg",
      "dateFormat": "DD/MM/YYYY",
      "timeFormat": "24h",
      "currency": "INR",
      "socialLinks": {
        "instagram": "@johndoe",
        "twitter": "@johndoe",
        "youtube": "johndoe",
        "linkedin": "johndoe",
        "tiktok": "@johndoe",
        "facebook": "johndoe"
      },
      "preferences": {
        "theme": "light",
        "compactMode": false,
        "showTutorials": true,
        "autoSave": true,
        "defaultView": "dashboard"
      },
      "contactInfo": {
        "phone": "+91-9876543210",
        "alternateEmail": "john.alt@example.com",
        "emergencyContact": "+91-9876543211"
      }
    },
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "message": "Profile settings retrieved successfully"
}
```

### 7. Update Profile Settings
**Endpoint:** `PUT /profile`  
**Description:** Updates user profile settings and preferences.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 20 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "displayName": "John Smith",
    "bio": "Digital Marketing Expert & Content Creator",
    "website": "https://johnsmith.com",
    "location": "Delhi, India",
    "timezone": "Asia/Kolkata",
    "language": "hi",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h",
    "socialLinks": {
      "instagram": "@johnsmith",
      "twitter": "@johnsmith",
      "linkedin": "johnsmith"
    },
    "preferences": {
      "theme": "dark",
      "compactMode": true,
      "defaultView": "analytics"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile settings updated successfully",
  "data": {
    "profile": {
      "displayName": "John Smith",
      "bio": "Digital Marketing Expert & Content Creator",
      "timezone": "Asia/Kolkata",
      "language": "hi",
      "updatedAt": "2024-01-15T14:00:00Z"
    },
    "updatedFields": [
      "displayName",
      "bio",
      "website",
      "location",
      "language",
      "dateFormat",
      "timeFormat",
      "socialLinks.instagram",
      "socialLinks.twitter",
      "socialLinks.linkedin",
      "preferences.theme",
      "preferences.compactMode",
      "preferences.defaultView"
    ]
  }
}
```

### 8. Upload Profile Avatar
**Endpoint:** `POST /profile/avatar`  
**Description:** Uploads and updates user profile avatar.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 10 requests per hour

```bash
curl -X POST http://localhost:3000/api/settings/profile/avatar \
  -H "Authorization: Bearer your_jwt_token" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": {
      "url": "https://cdn.example.com/avatars/user_123_1642234567.jpg",
      "thumbnailUrl": "https://cdn.example.com/avatars/thumbs/user_123_1642234567.jpg",
      "uploadedAt": "2024-01-15T14:30:00Z",
      "size": 245760,
      "format": "jpeg",
      "dimensions": {
        "width": 512,
        "height": 512
      }
    }
  }
}
```

---

## Notification Settings

### 9. Get Notification Settings
**Endpoint:** `GET /notifications`  
**Description:** Retrieves notification preferences for all channels.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": {
        "automationUpdates": true,
        "weeklyReports": true,
        "monthlyReports": false,
        "securityAlerts": true,
        "marketingEmails": false,
        "billingNotifications": true,
        "systemMaintenance": true,
        "newFeatures": true,
        "errorAlerts": true,
        "followerMilestones": true,
        "engagementSpikes": false,
        "contentSuggestions": true
      },
      "push": {
        "automationStatus": true,
        "postPublished": true,
        "errorAlerts": true,
        "followerMilestones": false,
        "engagementSpikes": true,
        "scheduledPostReminders": true,
        "commentReceived": false,
        "mentionReceived": true,
        "directMessage": false
      },
      "inApp": {
        "realTimeUpdates": true,
        "systemMessages": true,
        "tips": false,
        "tutorials": true,
        "announcements": true,
        "achievementBadges": true,
        "goalReminders": true
      },
      "sms": {
        "securityAlerts": false,
        "criticalErrors": false,
        "billingIssues": false,
        "accountSuspension": true,
        "emergencyNotifications": true
      },
      "webhook": {
        "enabled": false,
        "url": null,
        "events": [],
        "secret": null,
        "retryAttempts": 3
      }
    },
    "channels": {
      "email": {
        "verified": true,
        "address": "user@example.com",
        "frequency": "immediate"
      },
      "push": {
        "enabled": true,
        "devices": 2,
        "lastDelivery": "2024-01-15T10:00:00Z"
      },
      "sms": {
        "enabled": false,
        "number": null,
        "verified": false
      }
    },
    "lastUpdated": "2024-01-15T11:00:00Z"
  },
  "message": "Notification settings retrieved successfully"
}
```

### 10. Update Notification Settings
**Endpoint:** `PUT /notifications`  
**Description:** Updates notification preferences for specified channels.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 20 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "email": {
      "weeklyReports": false,
      "marketingEmails": true,
      "engagementSpikes": true
    },
    "push": {
      "followerMilestones": true,
      "commentReceived": true
    },
    "inApp": {
      "tips": true,
      "goalReminders": false
    },
    "sms": {
      "securityAlerts": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "data": {
    "updatedPreferences": [
      "email.weeklyReports",
      "email.marketingEmails",
      "email.engagementSpikes",
      "push.followerMilestones",
      "push.commentReceived",
      "inApp.tips",
      "inApp.goalReminders",
      "sms.securityAlerts"
    ],
    "updatedAt": "2024-01-15T15:00:00Z",
    "affectedChannels": ["email", "push", "inApp", "sms"]
  }
}
```

### 11. Test Notification
**Endpoint:** `POST /notifications/test`  
**Description:** Sends a test notification to verify channel configuration.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 5 requests per hour

```bash
curl -X POST http://localhost:3000/api/settings/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "channel": "email",
    "type": "test_notification"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "channel": "email",
    "sentAt": "2024-01-15T15:30:00Z",
    "deliveryStatus": "delivered",
    "messageId": "test_msg_123"
  }
}
```

---

## Privacy Settings

### 12. Get Privacy Settings
**Endpoint:** `GET /privacy`  
**Description:** Retrieves privacy and data sharing preferences.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/privacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "privacy": {
      "profileVisibility": "public",
      "dataSharing": false,
      "analyticsTracking": true,
      "thirdPartyIntegrations": true,
      "cookieConsent": true,
      "marketingConsent": false,
      "dataRetention": {
        "period": 365,
        "autoDelete": false,
        "deleteAfterInactivity": 730,
        "keepBackups": true,
        "backupRetention": 90
      },
      "exportData": {
        "lastExported": "2024-01-01T10:00:00Z",
        "frequency": "monthly",
        "autoExport": false,
        "includeAnalytics": true,
        "includeContent": true
      },
      "accountVisibility": {
        "showInDirectory": false,
        "allowSearchEngines": true,
        "publicStats": false,
        "showActivity": false,
        "showConnections": false
      },
      "dataProcessing": {
        "allowProfiling": false,
        "allowTargeting": false,
        "allowResearch": false,
        "allowImprovement": true
      },
      "communication": {
        "allowDirectContact": true,
        "allowPartnerContact": false,
        "allowSurveys": false,
        "allowFeedbackRequests": true
      }
    },
    "compliance": {
      "gdprCompliant": true,
      "ccpaCompliant": true,
      "lastReviewed": "2024-01-01T00:00:00Z",
      "consentVersion": "2.1"
    },
    "lastUpdated": "2024-01-15T12:00:00Z"
  },
  "message": "Privacy settings retrieved successfully"
}
```

### 13. Update Privacy Settings
**Endpoint:** `PUT /privacy`  
**Description:** Updates privacy and data sharing preferences.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 15 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/privacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "profileVisibility": "private",
    "dataSharing": false,
    "analyticsTracking": false,
    "dataRetention": {
      "period": 180,
      "autoDelete": true,
      "deleteAfterInactivity": 365
    },
    "accountVisibility": {
      "showInDirectory": false,
      "allowSearchEngines": false,
      "publicStats": false
    },
    "dataProcessing": {
      "allowProfiling": false,
      "allowTargeting": false,
      "allowResearch": false
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "data": {
    "privacy": {
      "profileVisibility": "private",
      "dataSharing": false,
      "analyticsTracking": false,
      "updatedAt": "2024-01-15T15:00:00Z"
    },
    "updatedFields": [
      "profileVisibility",
      "dataSharing",
      "analyticsTracking",
      "dataRetention.period",
      "dataRetention.autoDelete",
      "dataRetention.deleteAfterInactivity",
      "accountVisibility.showInDirectory",
      "accountVisibility.allowSearchEngines",
      "accountVisibility.publicStats",
      "dataProcessing.allowProfiling",
      "dataProcessing.allowTargeting",
      "dataProcessing.allowResearch"
    ],
    "complianceUpdated": true
  }
}
```

### 14. Request Data Export
**Endpoint:** `POST /privacy/export-request`  
**Description:** Requests a complete data export for GDPR compliance.  
**Required Permission:** `USER_READ`  
**Rate Limit:** 3 requests per month

```bash
curl -X POST http://localhost:3000/api/settings/privacy/export-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "includeAnalytics": true,
    "includeContent": true,
    "includeAutomations": true,
    "format": "json"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Data export request submitted successfully",
  "data": {
    "requestId": "export_req_123",
    "requestedAt": "2024-01-15T16:00:00Z",
    "estimatedCompletion": "2024-01-16T16:00:00Z",
    "status": "processing",
    "includesData": ["profile", "analytics", "content", "automations"],
    "format": "json",
    "deliveryMethod": "email"
  }
}
```

### 15. Request Account Deletion
**Endpoint:** `POST /privacy/delete-request`  
**Description:** Requests account deletion for GDPR compliance.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 1 request per month

```bash
curl -X POST http://localhost:3000/api/settings/privacy/delete-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "reason": "No longer using the service",
    "confirmDeletion": true,
    "deleteImmediately": false,
    "gracePeriod": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion request submitted successfully",
  "data": {
    "requestId": "delete_req_123",
    "requestedAt": "2024-01-15T16:30:00Z",
    "scheduledDeletion": "2024-02-14T16:30:00Z",
    "gracePeriod": 30,
    "cancellationDeadline": "2024-02-13T16:30:00Z",
    "status": "scheduled"
  }
}
```

---

## Automation Settings

### 16. Get Automation Settings
**Endpoint:** `GET /automation`  
**Description:** Retrieves default automation configuration and safety limits.  
**Required Permission:** `AUTOMATION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "automation": {
      "defaultSchedule": {
        "startTime": "09:00",
        "endTime": "18:00",
        "timezone": "Asia/Kolkata",
        "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "pauseOnWeekends": false,
        "pauseOnHolidays": true,
        "lunchBreak": {
          "enabled": true,
          "startTime": "12:00",
          "endTime": "13:00"
        }
      },
      "safetyLimits": {
        "maxLikesPerHour": 30,
        "maxFollowsPerHour": 20,
        "maxCommentsPerHour": 10,
        "maxUnfollowsPerHour": 15,
        "maxStoriesPerHour": 25,
        "maxDirectMessagesPerHour": 5,
        "dailyLimits": {
          "likes": 500,
          "follows": 200,
          "comments": 100,
          "unfollows": 150,
          "stories": 300,
          "directMessages": 50
        },
        "weeklyLimits": {
          "likes": 3000,
          "follows": 1000,
          "comments": 500,
          "unfollows": 800
        },
        "monthlyLimits": {
          "likes": 12000,
          "follows": 4000,
          "comments": 2000
        }
      },
      "autoStop": {
        "enabled": true,
        "onError": true,
        "onRateLimit": true,
        "onSuspiciousActivity": true,
        "onAccountRestriction": true,
        "onUnusualActivity": true,
        "cooldownPeriod": 60,
        "maxRetries": 3,
        "escalationEnabled": true
      },
      "contentFilters": {
        "skipBusinessAccounts": false,
        "skipVerifiedAccounts": true,
        "skipPrivateAccounts": true,
        "skipRecentlyInteracted": true,
        "minFollowers": 100,
        "maxFollowers": 50000,
        "minFollowing": 50,
        "maxFollowing": 5000,
        "minPosts": 10,
        "maxPosts": 10000,
        "accountAgeMinDays": 30,
        "engagementRateMin": 1.0,
        "engagementRateMax": 15.0,
        "followerToFollowingRatio": {
          "min": 0.1,
          "max": 10.0
        },
        "languageFilters": ["en", "hi"],
        "locationFilters": ["India", "USA"],
        "hashtagBlacklist": ["spam", "fake"],
        "usernamePatterns": {
          "avoid": ["bot", "fake", "spam"],
          "prefer": ["photo", "art", "creative"]
        }
      },
      "smartFeatures": {
        "aiContentAnalysis": true,
        "smartScheduling": true,
        "audienceOptimization": true,
        "hashtagSuggestions": true,
        "competitorAnalysis": false,
        "trendAnalysis": true,
        "sentimentAnalysis": false,
        "influencerDetection": true
      },
      "behaviorSettings": {
        "humanLikeDelays": true,
        "randomizeActions": true,
        "mimicUserBehavior": true,
        "varyActionTiming": true,
        "useProxyRotation": false,
        "sessionDuration": {
          "min": 30,
          "max": 120
        },
        "breakFrequency": {
          "min": 15,
          "max": 45
        }
      }
    },
    "limits": {
      "currentUsage": {
        "likesToday": 45,
        "followsToday": 12,
        "commentsToday": 8
      },
      "remainingToday": {
        "likes": 455,
        "follows": 188,
        "comments": 92
      },
      "resetTime": "2024-01-16T00:00:00Z"
    },
    "lastUpdated": "2024-01-15T13:00:00Z"
  },
  "message": "Automation settings retrieved successfully"
}
```

### 17. Update Automation Settings
**Endpoint:** `PUT /automation`  
**Description:** Updates automation configuration and safety limits.  
**Required Permission:** `AUTOMATION_WRITE`  
**Rate Limit:** 15 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "defaultSchedule": {
      "startTime": "10:00",
      "endTime": "17:00",
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      "pauseOnWeekends": false
    },
    "safetyLimits": {
      "maxLikesPerHour": 25,
      "maxFollowsPerHour": 15,
      "dailyLimits": {
        "likes": 400,
        "follows": 150
      }
    },
    "contentFilters": {
      "minFollowers": 200,
      "maxFollowers": 100000,
      "engagementRateMin": 2.0
    },
    "smartFeatures": {
      "competitorAnalysis": true,
      "trendAnalysis": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Automation settings updated successfully",
  "data": {
    "automation": {
      "defaultSchedule": {
        "startTime": "10:00",
        "endTime": "17:00",
        "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      },
      "safetyLimits": {
        "maxLikesPerHour": 25,
        "maxFollowsPerHour": 15
      },
      "updatedAt": "2024-01-15T16:00:00Z"
    },
    "updatedFields": [
      "defaultSchedule.startTime",
      "defaultSchedule.endTime",
      "defaultSchedule.workingDays",
      "defaultSchedule.pauseOnWeekends",
      "safetyLimits.maxLikesPerHour",
      "safetyLimits.maxFollowsPerHour",
      "safetyLimits.dailyLimits.likes",
      "safetyLimits.dailyLimits.follows",
      "contentFilters.minFollowers",
      "contentFilters.maxFollowers",
      "contentFilters.engagementRateMin",
      "smartFeatures.competitorAnalysis",
      "smartFeatures.trendAnalysis"
    ],
    "validationWarnings": [
      "Increased daily limits may trigger Instagram rate limiting"
    ]
  }
}
```

---

## Billing Settings

### 18. Get Billing Settings
**Endpoint:** `GET /billing`  
**Description:** Retrieves billing and payment preferences.  
**Required Permission:** `BILLING_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "billing": {
      "currency": "INR",
      "invoiceEmail": "billing@example.com",
      "autoRenew": true,
      "usageAlerts": true,
      "billingAddress": {
        "name": "John Doe",
        "company": "Doe Enterprises",
        "address": "123 Main Street",
        "address2": "Suite 456",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400001",
        "country": "IN"
      },
      "taxInfo": {
        "gstNumber": "27AAAAA0000A1Z5",
        "taxExempt": false,
        "vatNumber": null,
        "businessType": "individual",
        "taxCategory": "standard"
      },
      "alerts": {
        "usageThreshold": 80,
        "billingFailure": true,
        "renewalReminder": 7,
        "paymentMethodExpiry": 30,
        "invoiceGenerated": true,
        "creditLimitReached": true,
        "unusualUsage": true
      },
      "preferences": {
        "paperlessInvoices": true,
        "detailedUsageReports": true,
        "costOptimizationTips": true,
        "budgetAlerts": true,
        "monthlySpendingLimit": 5000,
        "autoTopup": false,
        "topupAmount": 1000,
        "topupThreshold": 500
      },
      "paymentMethods": [
        {
          "id": "pm_123",
          "type": "card",
          "last4": "4242",
          "brand": "visa",
          "expiryMonth": 12,
          "expiryYear": 2025,
          "isDefault": true,
          "status": "active"
        }
      ]
    },
    "subscription": {
      "planId": "pro_monthly",
      "planName": "Pro Monthly",
      "status": "active",
      "currentPeriodStart": "2024-01-01T00:00:00Z",
      "currentPeriodEnd": "2024-02-01T00:00:00Z",
      "nextBillingDate": "2024-02-01T00:00:00Z"
    },
    "lastUpdated": "2024-01-15T14:00:00Z"
  },
  "message": "Billing settings retrieved successfully"
}
```

### 19. Update Billing Settings
**Endpoint:** `PUT /billing`  
**Description:** Updates billing and payment preferences.  
**Required Permission:** `BILLING_WRITE`  
**Rate Limit:** 10 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "invoiceEmail": "accounts@example.com",
    "autoRenew": false,
    "billingAddress": {
      "name": "John Smith",
      "company": "Smith Corp",
      "address": "456 Business Street",
      "city": "Delhi",
      "state": "Delhi",
      "postalCode": "110001"
    },
    "alerts": {
      "usageThreshold": 90,
      "renewalReminder": 3
    },
    "preferences": {
      "monthlySpendingLimit": 7500,
      "autoTopup": true,
      "topupAmount": 1500,
      "topupThreshold": 750
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Billing settings updated successfully",
  "data": {
    "billing": {
      "invoiceEmail": "accounts@example.com",
      "autoRenew": false,
      "billingAddress": {
        "name": "John Smith",
        "company": "Smith Corp"
      },
      "updatedAt": "2024-01-15T17:00:00Z"
    },
    "updatedFields": [
      "invoiceEmail",
      "autoRenew",
      "billingAddress.name",
      "billingAddress.company",
      "billingAddress.address",
      "billingAddress.city",
      "billingAddress.state",
      "billingAddress.postalCode",
      "alerts.usageThreshold",
      "alerts.renewalReminder",
      "preferences.monthlySpendingLimit",
      "preferences.autoTopup",
      "preferences.topupAmount",
      "preferences.topupThreshold"
    ]
  }
}
```

---

## Security Settings

### 20. Get Security Settings
**Endpoint:** `GET /security`  
**Description:** Retrieves security and authentication settings.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/settings/security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "security": {
      "twoFactorAuth": {
        "enabled": false,
        "method": null,
        "backupCodes": 0,
        "lastSetup": null,
        "availableMethods": ["app", "sms", "email"]
      },
      "sessionTimeout": 24,
      "loginAlerts": true,
      "deviceTracking": true,
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireNumbers": true,
        "requireSymbols": true,
        "preventReuse": 5,
        "maxAge": 90,
        "lastChanged": "2024-01-01T00:00:00Z"
      },
      "accessControl": {
        "ipWhitelist": [],
        "allowedCountries": [],
        "blockSuspiciousLogins": true,
        "requireEmailVerification": true,
        "maxFailedAttempts": 5,
        "lockoutDuration": 30
      },
      "apiAccess": {
        "enabled": true,
        "rateLimit": 1000,
        "allowedIPs": [],
        "webhookSecurity": true,
        "apiKeys": [
          {
            "id": "key_123",
            "name": "Main API Key",
            "lastUsed": "2024-01-15T10:00:00Z",
            "permissions": ["read", "write"],
            "status": "active"
          }
        ]
      },
      "activeSessions": [
        {
          "id": "session_1",
          "device": "Chrome on Windows",
          "location": "Mumbai, India",
          "ip": "192.168.1.1",
          "lastActive": "2024-01-15T12:00:00Z",
          "current": true,
          "createdAt": "2024-01-15T08:00:00Z"
        },
        {
          "id": "session_2",
          "device": "Safari on iPhone",
          "location": "Mumbai, India",
          "ip": "192.168.1.2",
          "lastActive": "2024-01-14T20:00:00Z",
          "current": false,
          "createdAt": "2024-01-14T18:00:00Z"
        }
      ],
      "recentActivity": [
        {
          "action": "login",
          "timestamp": "2024-01-15T12:00:00Z",
          "ip": "192.168.1.1",
          "location": "Mumbai, India",
          "device": "Chrome on Windows",
          "status": "success"
        },
        {
          "action": "password_change",
          "timestamp": "2024-01-10T15:30:00Z",
          "ip": "192.168.1.1",
          "location": "Mumbai, India",
          "device": "Chrome on Windows",
          "status": "success"
        }
      ]
    },
    "riskAssessment": {
      "level": "low",
      "factors": [],
      "recommendations": [
        "Enable two-factor authentication",
        "Review active sessions regularly"
      ],
      "lastAssessed": "2024-01-15T12:00:00Z"
    },
    "lastUpdated": "2024-01-15T15:00:00Z"
  },
  "message": "Security settings retrieved successfully"
}
```

### 21. Update Security Settings
**Endpoint:** `PUT /security`  
**Description:** Updates security and authentication settings.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 10 requests per hour

```bash
curl -X PUT http://localhost:3000/api/settings/security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sessionTimeout": 12,
    "loginAlerts": true,
    "deviceTracking": true,
    "accessControl": {
      "blockSuspiciousLogins": true,
      "maxFailedAttempts": 3,
      "lockoutDuration": 60
    },
    "apiAccess": {
      "rateLimit": 500,
      "webhookSecurity": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Security settings updated successfully",
  "data": {
    "security": {
      "sessionTimeout": 12,
      "loginAlerts": true,
      "deviceTracking": true,
      "accessControl": {
        "blockSuspiciousLogins": true,
        "maxFailedAttempts": 3,
        "lockoutDuration": 60
      },
      "updatedAt": "2024-01-15T18:00:00Z"
    },
    "updatedFields": [
      "sessionTimeout",
      "loginAlerts",
      "deviceTracking",
      "accessControl.blockSuspiciousLogins",
      "accessControl.maxFailedAttempts",
      "accessControl.lockoutDuration",
      "apiAccess.rateLimit",
      "apiAccess.webhookSecurity"
    ],
    "securityImpact": "medium",
    "recommendations": [
      "Consider enabling two-factor authentication for enhanced security"
    ]
  }
}
```

### 22. Enable Two-Factor Authentication
**Endpoint:** `POST /security/2fa/enable`  
**Description:** Enables two-factor authentication for the account.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 5 requests per hour

```bash
curl -X POST http://localhost:3000/api/settings/security/2fa/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "method": "app",
    "phoneNumber": "+91-9876543210"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication setup initiated",
  "data": {
    "method": "app",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "123456789",
      "987654321",
      "456789123",
      "789123456",
      "321654987"
    ],
    "setupToken": "setup_token_123",
    "expiresAt": "2024-01-15T19:00:00Z"
  }
}
```

### 23. Revoke Session
**Endpoint:** `DELETE /security/sessions/{sessionId}`  
**Description:** Revokes a specific active session.  
**Required Permission:** `USER_WRITE`  
**Rate Limit:** 20 requests per hour

```bash
curl -X DELETE http://localhost:3000/api/settings/security/sessions/session_2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "sessionId": "session_2",
    "revokedAt": "2024-01-15T18:30:00Z",
    "device": "Safari on iPhone",
    "location": "Mumbai, India"
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "automation.safetyLimits.maxLikesPerHour",
        "message": "Value must be between 1 and 60",
        "value": 100
      }
    ]
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource",
    "requiredPermission": "BILLING_WRITE"
  }
}
```

**422 Unprocessable Entity**
```json
{
  "success": false,
  "error": {
    "code": "SETTINGS_VALIDATION_ERROR",
    "message": "Settings validation failed",
    "details": [
      {
        "field": "timezone",
        "message": "Invalid timezone identifier",
        "allowedValues": ["Asia/Kolkata", "America/New_York", "Europe/London"]
      }
    ]
  }
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for settings updates",
    "retryAfter": 3600,
    "limit": 30,
    "remaining": 0,
    "resetTime": "2024-01-15T19:00:00Z"
  }
}
```

### Settings-Specific Error Codes

**SETTINGS_CONFLICT**
```json
{
  "success": false,
  "error": {
    "code": "SETTINGS_CONFLICT",
    "message": "Settings conflict detected",
    "details": {
      "conflictingFields": ["automation.safetyLimits", "subscription.limits"],
      "reason": "Requested limits exceed subscription plan limits"
    }
  }
}
```

**SECURITY_RESTRICTION**
```json
{
  "success": false,
  "error": {
    "code": "SECURITY_RESTRICTION",
    "message": "Security policy prevents this change",
    "details": {
      "policy": "minimum_session_timeout",
      "minimumValue": 1,
      "requestedValue": 0.5
    }
  }
}
```

**BILLING_REQUIRED**
```json
{
  "success": false,
  "error": {
    "code": "BILLING_REQUIRED",
    "message": "Valid billing information required for this setting",
    "details": {
      "setting": "automation.smartFeatures.competitorAnalysis",
      "requiredPlan": "pro"
    }
  }
}
```

---

## Authentication

All settings API endpoints require:

1. **User Authentication**: Valid JWT token in Authorization header
2. **Permissions**: Specific permissions based on endpoint requirements

### Required Permissions

- `USER_READ` - For accessing basic settings (profile, notifications, general)
- `USER_WRITE` - For updating basic settings
- `AUTOMATION_READ` - For accessing automation settings
- `AUTOMATION_WRITE` - For updating automation settings
- `BILLING_READ` - For accessing billing settings
- `BILLING_WRITE` - For updating billing settings

### Rate Limiting

- **General settings retrieval**: 100 requests per hour per user
- **Settings updates**: 30 requests per hour per user
- **Security operations**: 10 requests per hour per user
- **Export operations**: 5 requests per day per user
- **Import operations**: 3 requests per day per user

Rate limits are enforced per user and reset every hour. When rate limit is exceeded, the API returns a 429 status code with retry information.

### Security Features

- All requests must be made over HTTPS in production
- JWT tokens expire after 24 hours (configurable in security settings)
- Settings changes are logged for audit purposes
- Sensitive settings require additional verification
- Rate limiting prevents abuse
- Input validation and sanitization applied to all data

### Data Validation

- **Timezone values**: Must be valid IANA timezone identifiers
- **Language codes**: Must be ISO 639-1 format (en, hi, es, etc.)
- **Email addresses**: Must be valid format and verified
- **Phone numbers**: Must include country code (+91-9876543210)
- **Currency codes**: Must be ISO 4217 format (INR, USD, EUR)
- **URLs**: Must be valid HTTP/HTTPS URLs
- **Numeric limits**: Must be within platform-defined ranges

### Settings Categories

1. **Profile Settings**: Display preferences, contact information, social links
2. **Notification Settings**: Email, push, in-app, SMS, and webhook preferences
3. **Privacy Settings**: Data sharing, visibility, retention, and compliance
4. **Automation Settings**: Schedules, safety limits, filters, and smart features
5. **Billing Settings**: Payment preferences, addresses, alerts, and limits
6. **Security Settings**: Authentication, sessions, access control, and monitoring

### Performance Considerations

- Settings are cached for 5 minutes to improve performance
- Bulk updates are more efficient than individual field updates
- Large exports may take several minutes to process
- Import operations are processed asynchronously
- Real-time validation prevents invalid configurations

### Compliance Features

- **GDPR Compliance**: Data export, deletion requests, consent management
- **CCPA Compliance**: Data sharing controls, opt-out mechanisms
- **SOC 2 Compliance**: Audit logging, access controls, data protection
- **ISO 27001**: Security controls, risk management, incident response