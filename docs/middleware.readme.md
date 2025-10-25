# Middleware Documentation

## Overview
This document provides comprehensive information about all middleware components used in the backend application. Middleware functions are essential for request processing, security, authentication, and error handling.

## Table of Contents
1. [Authentication Middleware](#authentication-middleware)
2. [Authorization Guards](#authorization-guards)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [CORS Configuration](#cors-configuration)
6. [Subscription Middleware](#subscription-middleware)
7. [Validation Middleware](#validation-middleware)
8. [Security Middleware](#security-middleware)
9. [Best Practices](#best-practices)

---

## Authentication Middleware

### Authentication Guard
Verifies user authentication status and session validity.

**Location:** `src/middleware/guards/auth.middleware.ts`

**Usage:**
```typescript
import { authMiddleware } from '../middleware/guards';

// Protect a route
router.get('/protected', authMiddleware.authenticate, controller.method);
```

**Features:**
- **Session Validation**: Validates user session and authentication status
- **Token Verification**: Verifies JWT tokens if used
- **User Context**: Adds authenticated user to request context
- **Automatic Refresh**: Handles session refresh when needed

**Request Enhancement:**
```typescript
// Adds to request object
interface AuthenticatedRequest extends Request {
  user: SessionUser;
  session: {
    user: SessionUser;
    isAuthenticated: boolean;
  };
}
```

### Optional Authentication
Middleware for routes that work with or without authentication.

**Usage:**
```typescript
router.get('/public-or-private', authMiddleware.optional, controller.method);
```

---

## Authorization Guards

### Role-Based Access Control
Enforces role-based permissions for protected resources.

**Location:** `src/middleware/guards/role.middleware.ts`

**Usage:**
```typescript
import { requireRole, requirePermission } from '../middleware/guards';

// Require specific role
router.post('/admin', requireRole('admin'), controller.adminMethod);

// Require specific permission
router.get('/analytics', requirePermission('ANALYTICS_READ'), controller.getAnalytics);
```

**Available Roles:**
- `admin`: Full system access
- `user`: Standard user access
- `moderator`: Content moderation access
- `viewer`: Read-only access

**Permission Categories:**
- `USER_*`: User management permissions
- `AUTOMATION_*`: Automation management permissions
- `ANALYTICS_*`: Analytics and reporting permissions
- `PLATFORM_*`: Platform integration permissions
- `SUBSCRIPTION_*`: Subscription management permissions

### Permission Middleware
```typescript
// Multiple permissions (AND logic)
router.get('/data', requirePermissions(['ANALYTICS_READ', 'USER_READ']), controller.getData);

// Any permission (OR logic)
router.get('/content', requireAnyPermission(['CONTENT_READ', 'ADMIN']), controller.getContent);
```

---

## Rate Limiting

### General Rate Limiting
Applies standard rate limiting to all API endpoints.

**Configuration:**
```typescript
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

### Authentication Rate Limiting
Stricter rate limiting for authentication endpoints.

**Configuration:**
```typescript
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true
});
```

### Webhook Rate Limiting
Specialized rate limiting for webhook endpoints.

**Configuration:**
```typescript
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Allow more requests for webhooks
  message: {
    error: 'Webhook rate limit exceeded',
    retryAfter: '1 minute'
  }
});
```

### Custom Rate Limiting
```typescript
// Per-user rate limiting
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'User rate limit exceeded',
      retryAfter: Math.ceil(windowMs / 1000) + ' seconds'
    }
  });
};
```

---

## Error Handling

### Global Error Handler
Catches and processes all unhandled errors in the application.

**Location:** `src/middleware/error.middleware.ts`

**Features:**
- **Error Classification**: Categorizes errors by type and severity
- **Response Formatting**: Standardizes error response format
- **Logging**: Comprehensive error logging for debugging
- **Security**: Prevents sensitive information leakage

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456",
  "details": {
    "field": "validation error details"
  }
}
```

### Async Handler
Wrapper for async route handlers to catch promise rejections.

**Usage:**
```typescript
import { asyncHandler } from '../middleware/error.middleware';

router.get('/async-route', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json({ success: true, data });
}));
```

### Not Found Handler
Handles requests to non-existent endpoints.

**Features:**
- **404 Response**: Returns standardized 404 response
- **Logging**: Logs attempted access to non-existent endpoints
- **Suggestions**: Provides suggestions for similar endpoints

---

## CORS Configuration

### CORS Middleware
Configures Cross-Origin Resource Sharing for the application.

**Location:** `src/middleware/cors.middleware.ts`

**Configuration:**
```typescript
export const getCorsOptions = () => ({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
});
```

### Environment-Specific CORS
```typescript
// Development CORS (more permissive)
const developmentCors = {
  origin: true,
  credentials: true
};

// Production CORS (restrictive)
const productionCors = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true
};
```

---

## Subscription Middleware

### Subscription Protection
Enforces subscription-based access control for premium features.

**Location:** `src/middleware/subscription.middleware.ts`

**Usage:**
```typescript
import { 
  requirePlan, 
  requireFeature, 
  checkUsageLimit,
  requireActiveSubscription 
} from '../middleware/subscription.middleware';

// Require specific plan
router.get('/premium', requirePlan('professional'), controller.premiumFeature);

// Require specific feature
router.post('/automation', requireFeature('advanced_automation'), controller.createAutomation);

// Check usage limits
router.post('/post', checkUsageLimit('posts'), controller.createPost);

// Require active subscription
router.get('/dashboard', requireActiveSubscription, controller.getDashboard);
```

### Plan Requirements
```typescript
// Available plans
type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

// Plan hierarchy (higher plans include lower plan features)
const planHierarchy = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3
};
```

### Feature Gates
```typescript
// Feature availability by plan
const featureMatrix = {
  basic_automation: ['starter', 'professional', 'enterprise'],
  advanced_automation: ['professional', 'enterprise'],
  analytics: ['professional', 'enterprise'],
  white_label: ['enterprise']
};
```

### Usage Limits
```typescript
// Usage limits by plan
const usageLimits = {
  free: {
    posts: 10,
    automations: 3,
    accounts: 1
  },
  starter: {
    posts: 100,
    automations: 10,
    accounts: 3
  },
  professional: {
    posts: 1000,
    automations: 50,
    accounts: 10
  },
  enterprise: {
    posts: -1, // unlimited
    automations: -1,
    accounts: -1
  }
};
```

---

## Validation Middleware

### Request Validation
Validates incoming request data using Joi schemas.

**Usage:**
```typescript
import { validate } from '../middleware/validation.middleware';
import { createUserSchema } from '../validators/user.validator';

router.post('/users', validate(createUserSchema), controller.createUser);
```

**Validation Features:**
- **Schema Validation**: Uses Joi for comprehensive validation
- **Error Formatting**: Provides detailed validation error messages
- **Sanitization**: Sanitizes input data
- **Type Coercion**: Converts data types when appropriate

### Custom Validators
```typescript
// Custom validation middleware
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`
      });
    }
    next();
  };
};
```

---

## Security Middleware

### Security Headers
Adds security headers to all responses.

**Headers Added:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`

### Request Sanitization
Sanitizes request data to prevent XSS and injection attacks.

**Features:**
- **HTML Sanitization**: Removes dangerous HTML tags
- **SQL Injection Prevention**: Escapes SQL special characters
- **NoSQL Injection Prevention**: Validates MongoDB queries
- **Path Traversal Prevention**: Validates file paths

### IP Filtering
Blocks requests from blacklisted IP addresses.

**Configuration:**
```typescript
const ipFilter = {
  blacklist: process.env.BLACKLISTED_IPS?.split(',') || [],
  whitelist: process.env.WHITELISTED_IPS?.split(',') || [],
  mode: 'blacklist' // or 'whitelist'
};
```

---

## Best Practices

### 1. Middleware Order
Apply middleware in the correct order for optimal security and performance:

```typescript
app.use(helmet()); // Security headers first
app.use(cors(corsOptions)); // CORS configuration
app.use(express.json()); // Body parsing
app.use(session(sessionConfig)); // Session management
app.use(generalRateLimit); // Rate limiting
app.use('/api', routes); // Application routes
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Error handler last
```

### 2. Error Handling
- **Consistent Format**: Use consistent error response format
- **Logging**: Log all errors with appropriate detail level
- **Security**: Never expose sensitive information in error messages
- **User-Friendly**: Provide helpful error messages for users

### 3. Rate Limiting
- **Graduated Limits**: Use different limits for different endpoint types
- **User-Based**: Consider per-user rate limiting for authenticated endpoints
- **Monitoring**: Monitor rate limit hits and adjust as needed
- **Graceful Degradation**: Provide helpful messages when limits are exceeded

### 4. Authentication
- **Session Security**: Use secure session configuration
- **Token Validation**: Validate all authentication tokens
- **User Context**: Always provide user context in authenticated requests
- **Logout Handling**: Properly handle session cleanup on logout

### 5. Authorization
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Role Hierarchy**: Implement clear role hierarchy
- **Permission Granularity**: Use granular permissions for fine-grained control
- **Regular Audits**: Regularly audit and update permissions

### 6. Performance
- **Caching**: Cache middleware results where appropriate
- **Async Operations**: Use async middleware for I/O operations
- **Early Returns**: Return early from middleware when possible
- **Resource Cleanup**: Properly clean up resources in middleware

This documentation provides comprehensive coverage of all middleware components and their proper usage in the application.