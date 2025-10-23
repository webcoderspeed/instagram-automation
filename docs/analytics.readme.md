# Analytics API Documentation

यह documentation Instagram Automation SaaS application के सभी analytics endpoints के लिए है। ये endpoints user login statistics, device analytics, और security insights प्रदान करते हैं।

## Base URL
```
http://localhost:3000/api/analytics
```

## Table of Contents
1. [Login Statistics](#login-statistics)
2. [Login Activity](#login-activity)
3. [Device Analytics](#device-analytics)
4. [Security Insights](#security-insights)

---

## Authentication Required
सभी analytics endpoints के लिए authentication और proper permissions की आवश्यकता होती है। सभी requests में session cookies शामिल करें।

```bash
# सभी requests में cookies include करें
-b cookies.txt
```

---

## Login Statistics

### 1. Get User Login Statistics
**Endpoint:** `GET /login-stats`  
**Description:** User के login statistics प्राप्त करता है।  
**Access:** Private - Analytics permission required

```bash
curl -X GET "http://localhost:3000/api/analytics/login-stats?days=30" \
  -b cookies.txt
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogins": 45,
    "uniqueDays": 15,
    "averageLoginsPerDay": 3.0,
    "period": {
      "days": 30,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-30T23:59:59Z"
    },
    "trends": {
      "weeklyGrowth": 12.5,
      "monthlyGrowth": 8.3
    }
  }
}
```

---

## Login Activity

### 2. Get Login Activity by Date Range
**Endpoint:** `GET /login-activity`  
**Description:** Specific date range के लिए login activity प्राप्त करता है।  
**Access:** Private - Analytics permission required

```bash
curl -X GET "http://localhost:3000/api/analytics/login-activity?startDate=2024-01-01&endDate=2024-01-31" \
  -b cookies.txt
```

**Query Parameters:**
- `startDate` (optional): Start date (ISO string format)
- `endDate` (optional): End date (ISO string format)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "date": "2024-01-15",
        "loginCount": 3,
        "locations": ["Mumbai, Maharashtra, India", "Delhi, Delhi, India"],
        "devices": ["Chrome on Windows", "Safari on iPhone"],
        "timeSlots": {
          "morning": 1,
          "afternoon": 1,
          "evening": 1,
          "night": 0
        }
      }
    ],
    "summary": {
      "totalDays": 31,
      "activeDays": 15,
      "totalLogins": 45,
      "averageLoginsPerActiveDay": 3.0
    }
  }
}
```

---

## Device Analytics

### 3. Get Device and Browser Analytics
**Endpoint:** `GET /device-analytics`  
**Description:** Device और browser analytics प्राप्त करता है।  
**Access:** Private - Analytics permission required

```bash
curl -X GET "http://localhost:3000/api/analytics/device-analytics?days=30" \
  -b cookies.txt
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "browsers": [
      {
        "name": "Chrome",
        "count": 25,
        "percentage": 55.6
      },
      {
        "name": "Safari",
        "count": 15,
        "percentage": 33.3
      },
      {
        "name": "Firefox",
        "count": 5,
        "percentage": 11.1
      }
    ],
    "operatingSystems": [
      {
        "name": "Windows",
        "count": 20,
        "percentage": 44.4
      },
      {
        "name": "macOS",
        "count": 15,
        "percentage": 33.3
      },
      {
        "name": "iOS",
        "count": 10,
        "percentage": 22.2
      }
    ],
    "devices": [
      {
        "type": "Desktop",
        "count": 30,
        "percentage": 66.7
      },
      {
        "type": "Mobile",
        "count": 15,
        "percentage": 33.3
      }
    ],
    "locations": [
      {
        "country": "India",
        "city": "Mumbai",
        "count": 20,
        "percentage": 44.4
      },
      {
        "country": "India",
        "city": "Delhi",
        "count": 15,
        "percentage": 33.3
      }
    ]
  }
}
```

---

## Security Insights

### 4. Get Security Insights
**Endpoint:** `GET /security-insights`  
**Description:** Security insights और suspicious login attempts प्राप्त करता है।  
**Access:** Private - Analytics permission required

```bash
curl -X GET "http://localhost:3000/api/analytics/security-insights?days=30" \
  -b cookies.txt
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "suspiciousLogins": [
      {
        "date": "2024-01-15T10:30:00Z",
        "location": "Unknown Location",
        "device": "Chrome on Linux",
        "ipAddress": "192.168.1.100",
        "reason": "New location",
        "riskLevel": "medium"
      }
    ],
    "securityMetrics": {
      "totalLogins": 45,
      "suspiciousLogins": 2,
      "suspiciousPercentage": 4.4,
      "uniqueLocations": 3,
      "uniqueDevices": 5,
      "uniqueIPs": 8
    },
    "recommendations": [
      "Enable two-factor authentication",
      "Review recent login locations",
      "Consider setting up login notifications"
    ],
    "riskAssessment": {
      "overall": "low",
      "factors": {
        "locationVariability": "medium",
        "deviceVariability": "low",
        "timePatterns": "normal"
      }
    }
  }
}
```

---

## Rate Limiting
Analytics endpoints में rate limiting लागू है:
- General rate limit: 100 requests per 15 minutes per user

---

## Error Responses
सभी endpoints में error के case में यह format होता है:
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

## Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (Invalid query parameters)
- `401` - Unauthorized (Not logged in)
- `403` - Forbidden (Insufficient permissions)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Analytics Testing:
```bash
# 1. Login first (required for all analytics endpoints)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Get login statistics for last 30 days
curl -X GET "http://localhost:3000/api/analytics/login-stats?days=30" \
  -b cookies.txt

# 3. Get login activity for specific date range
curl -X GET "http://localhost:3000/api/analytics/login-activity?startDate=2024-01-01&endDate=2024-01-31" \
  -b cookies.txt

# 4. Get device analytics
curl -X GET "http://localhost:3000/api/analytics/device-analytics?days=30" \
  -b cookies.txt

# 5. Get security insights
curl -X GET "http://localhost:3000/api/analytics/security-insights?days=30" \
  -b cookies.txt
```

---

## Notes
- सभी analytics data user-specific है
- Date ranges ISO 8601 format में होनी चाहिए
- Analytics permissions की आवश्यकता है सभी endpoints के लिए
- Data real-time update होता है login events के साथ
- Location data IP-based geolocation से आता है