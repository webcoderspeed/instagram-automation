# Settings API Documentation

यह documentation Instagram Automation SaaS application के सभी user settings endpoints के लिए है। सभी endpoints authentication की आवश्यकता होती है।

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

---

## General Settings

### 1. Get All Settings
**Endpoint:** `GET /`  
**Description:** User के सभी settings return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "profile": {
        "displayName": "John Doe",
        "bio": "Content Creator & Photographer",
        "website": "https://johndoe.com",
        "location": "Mumbai, India",
        "timezone": "Asia/Kolkata",
        "language": "en",
        "avatar": "https://example.com/avatar.jpg"
      },
      "notifications": {
        "email": {
          "automationUpdates": true,
          "weeklyReports": true,
          "securityAlerts": true,
          "marketingEmails": false
        },
        "push": {
          "automationStatus": true,
          "postPublished": true,
          "errorAlerts": true
        },
        "inApp": {
          "realTimeUpdates": true,
          "systemMessages": true
        }
      },
      "privacy": {
        "profileVisibility": "public",
        "dataSharing": false,
        "analyticsTracking": true,
        "thirdPartyIntegrations": true
      },
      "automation": {
        "defaultSchedule": {
          "startTime": "09:00",
          "endTime": "18:00",
          "timezone": "Asia/Kolkata"
        },
        "safetyLimits": {
          "maxLikesPerHour": 30,
          "maxFollowsPerHour": 20,
          "maxCommentsPerHour": 10
        },
        "autoStop": {
          "enabled": true,
          "onError": true,
          "onRateLimit": true
        }
      },
      "billing": {
        "currency": "INR",
        "invoiceEmail": "billing@example.com",
        "autoRenew": true,
        "usageAlerts": true
      },
      "security": {
        "twoFactorAuth": false,
        "sessionTimeout": 24,
        "loginAlerts": true,
        "deviceTracking": true
      }
    }
  }
}
```

### 2. Update Multiple Settings
**Endpoint:** `PUT /`  
**Description:** Multiple settings को एक साथ update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "profile": {
      "displayName": "John Smith",
      "timezone": "Asia/Kolkata"
    },
    "notifications": {
      "email": {
        "weeklyReports": false
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
      "notifications.email.weeklyReports",
      "automation.safetyLimits.maxLikesPerHour"
    ]
  }
}
```

### 3. Export Settings
**Endpoint:** `GET /export`  
**Description:** User के सभी settings को JSON format में export करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/export \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export": {
      "exportedAt": "2024-01-01T12:00:00Z",
      "version": "1.0",
      "settings": {
        "profile": { "..." },
        "notifications": { "..." },
        "privacy": { "..." },
        "automation": { "..." },
        "billing": { "..." },
        "security": { "..." }
      }
    }
  }
}
```

### 4. Reset Settings
**Endpoint:** `POST /reset`  
**Description:** Settings को default values पर reset करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X POST http://localhost:3000/api/settings/reset \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "categories": ["notifications", "automation"],
    "confirmReset": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Settings reset successfully",
  "data": {
    "resetCategories": ["notifications", "automation"],
    "resetAt": "2024-01-01T13:00:00Z"
  }
}
```

---

## Profile Settings

### 5. Get Profile Settings
**Endpoint:** `GET /profile`  
**Description:** User के profile settings return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "displayName": "John Doe",
      "bio": "Content Creator & Photographer",
      "website": "https://johndoe.com",
      "location": "Mumbai, India",
      "timezone": "Asia/Kolkata",
      "language": "en",
      "avatar": "https://example.com/avatar.jpg",
      "socialLinks": {
        "instagram": "@johndoe",
        "twitter": "@johndoe",
        "youtube": "johndoe"
      }
    }
  }
}
```

### 6. Update Profile Settings
**Endpoint:** `PUT /profile`  
**Description:** Profile settings को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "displayName": "John Smith",
    "bio": "Digital Marketing Expert",
    "website": "https://johnsmith.com",
    "location": "Delhi, India",
    "timezone": "Asia/Kolkata",
    "language": "hi",
    "socialLinks": {
      "instagram": "@johnsmith",
      "twitter": "@johnsmith"
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
      "bio": "Digital Marketing Expert",
      "updatedAt": "2024-01-01T14:00:00Z"
    }
  }
}
```

---

## Notification Settings

### 7. Get Notification Settings
**Endpoint:** `GET /notifications`  
**Description:** Notification preferences return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
        "securityAlerts": true,
        "marketingEmails": false,
        "billingNotifications": true,
        "systemMaintenance": true
      },
      "push": {
        "automationStatus": true,
        "postPublished": true,
        "errorAlerts": true,
        "followerMilestones": false
      },
      "inApp": {
        "realTimeUpdates": true,
        "systemMessages": true,
        "tips": false
      },
      "sms": {
        "securityAlerts": false,
        "criticalErrors": false
      }
    }
  }
}
```

### 8. Update Notification Settings
**Endpoint:** `PUT /notifications`  
**Description:** Notification preferences को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": {
      "weeklyReports": false,
      "marketingEmails": true
    },
    "push": {
      "followerMilestones": true
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
      "push.followerMilestones",
      "sms.securityAlerts"
    ]
  }
}
```

---

## Privacy Settings

### 9. Get Privacy Settings
**Endpoint:** `GET /privacy`  
**Description:** Privacy और data sharing settings return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/privacy \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
      "dataRetention": {
        "period": 365,
        "autoDelete": false
      },
      "exportData": {
        "lastExported": "2024-01-01T10:00:00Z",
        "frequency": "monthly"
      }
    }
  }
}
```

### 10. Update Privacy Settings
**Endpoint:** `PUT /privacy`  
**Description:** Privacy settings को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/privacy \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "profileVisibility": "private",
    "dataSharing": false,
    "analyticsTracking": false,
    "dataRetention": {
      "period": 180,
      "autoDelete": true
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
      "updatedAt": "2024-01-01T15:00:00Z"
    }
  }
}
```

---

## Automation Settings

### 11. Get Automation Settings
**Endpoint:** `GET /automation`  
**Description:** Automation के default settings return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
        "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "safetyLimits": {
        "maxLikesPerHour": 30,
        "maxFollowsPerHour": 20,
        "maxCommentsPerHour": 10,
        "maxUnfollowsPerHour": 15,
        "dailyLimits": {
          "likes": 500,
          "follows": 200,
          "comments": 100
        }
      },
      "autoStop": {
        "enabled": true,
        "onError": true,
        "onRateLimit": true,
        "onSuspiciousActivity": true
      },
      "contentFilters": {
        "skipBusinessAccounts": false,
        "skipVerifiedAccounts": true,
        "minFollowers": 100,
        "maxFollowers": 50000
      }
    }
  }
}
```

### 12. Update Automation Settings
**Endpoint:** `PUT /automation`  
**Description:** Automation settings को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "defaultSchedule": {
      "startTime": "10:00",
      "endTime": "17:00",
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    },
    "safetyLimits": {
      "maxLikesPerHour": 25,
      "maxFollowsPerHour": 15
    },
    "contentFilters": {
      "minFollowers": 200,
      "maxFollowers": 100000
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
        "endTime": "17:00"
      },
      "updatedAt": "2024-01-01T16:00:00Z"
    }
  }
}
```

---

## Billing Settings

### 13. Get Billing Settings
**Endpoint:** `GET /billing`  
**Description:** Billing और payment preferences return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/billing \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400001",
        "country": "IN"
      },
      "taxInfo": {
        "gstNumber": "27AAAAA0000A1Z5",
        "taxExempt": false
      },
      "alerts": {
        "usageThreshold": 80,
        "billingFailure": true,
        "renewalReminder": 7
      }
    }
  }
}
```

### 14. Update Billing Settings
**Endpoint:** `PUT /billing`  
**Description:** Billing settings को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/billing \
  -H "Content-Type: application/json" \
  -b cookies.txt \
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
      "updatedAt": "2024-01-01T17:00:00Z"
    }
  }
}
```

---

## Security Settings

### 15. Get Security Settings
**Endpoint:** `GET /security`  
**Description:** Security और authentication settings return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/settings/security \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
        "backupCodes": 0
      },
      "sessionTimeout": 24,
      "loginAlerts": true,
      "deviceTracking": true,
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireNumbers": true,
        "requireSymbols": true
      },
      "activeSessions": [
        {
          "id": "session_1",
          "device": "Chrome on Windows",
          "location": "Mumbai, India",
          "lastActive": "2024-01-01T12:00:00Z",
          "current": true
        }
      ],
      "recentActivity": [
        {
          "action": "login",
          "timestamp": "2024-01-01T12:00:00Z",
          "ip": "192.168.1.1",
          "location": "Mumbai, India"
        }
      ]
    }
  }
}
```

### 16. Update Security Settings
**Endpoint:** `PUT /security`  
**Description:** Security settings को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/settings/security \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "twoFactorAuth": {
      "enabled": true,
      "method": "app"
    },
    "sessionTimeout": 12,
    "loginAlerts": true,
    "deviceTracking": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Security settings updated successfully",
  "data": {
    "security": {
      "twoFactorAuth": {
        "enabled": true,
        "method": "app",
        "setupRequired": true
      },
      "sessionTimeout": 12,
      "updatedAt": "2024-01-01T18:00:00Z"
    }
  }
}
```

---

## Important Notes

### Authentication Requirements
- सभी endpoints authenticated user की आवश्यकता होती है
- `VERIFIED_USER` role minimum requirement है
- Session cookies का उपयोग करें (`-b cookies.txt`)

### Settings Categories
- **Profile**: Display name, bio, timezone, language
- **Notifications**: Email, push, in-app, SMS preferences
- **Privacy**: Data sharing, visibility, retention policies
- **Automation**: Default schedules, safety limits, filters
- **Billing**: Payment preferences, addresses, alerts
- **Security**: 2FA, session management, device tracking

### Data Validation
- Timezone values must be valid IANA timezone identifiers
- Language codes must be ISO 639-1 format
- Email addresses must be valid format
- Phone numbers must include country code

### Rate Limiting
- Settings Updates: 30 requests per hour
- Settings Retrieval: 100 requests per hour
- Export: 5 requests per day

### Error Responses
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "SETTINGS_ERROR",
    "field": "automation.safetyLimits.maxLikesPerHour",
    "details": "Value must be between 1 and 60"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (Invalid data)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Settings Flow Test:
```bash
# 1. Login first (required for all settings endpoints)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Get all settings
curl -X GET http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 3. Get profile settings
curl -X GET http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Update profile settings
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"displayName":"Updated Name","timezone":"Asia/Kolkata"}'

# 5. Get notification settings
curl -X GET http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 6. Update notification settings
curl -X PUT http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email":{"weeklyReports":false},"push":{"automationStatus":true}}'

# 7. Get automation settings
curl -X GET http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. Update automation settings
curl -X PUT http://localhost:3000/api/settings/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"safetyLimits":{"maxLikesPerHour":25},"defaultSchedule":{"startTime":"10:00"}}'

# 9. Get security settings
curl -X GET http://localhost:3000/api/settings/security \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 10. Export all settings
curl -X GET http://localhost:3000/api/settings/export \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 11. Reset specific settings
curl -X POST http://localhost:3000/api/settings/reset \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"categories":["notifications"],"confirmReset":true}'
```

### Bulk Settings Update Test:
```bash
# Update multiple settings categories at once
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "profile": {
      "displayName": "New Name",
      "timezone": "Asia/Kolkata"
    },
    "notifications": {
      "email": {
        "weeklyReports": false
      }
    },
    "automation": {
      "safetyLimits": {
        "maxLikesPerHour": 20
      }
    }
  }'
```

यह documentation आपको सभी settings endpoints को test करने में मदद करेगी।