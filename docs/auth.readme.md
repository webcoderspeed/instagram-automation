# Authentication API Documentation

This documentation covers all authentication endpoints for the Instagram Automation SaaS application. All endpoints use session-based authentication and role-based permissions.

## Base URL
```
http://localhost:3000/api/auth
```

## Table of Contents
1. [User Registration](#user-registration)
2. [Email Verification](#email-verification)
3. [User Login](#user-login)
4. [Session Management](#session-management)
5. [User Profile](#user-profile)
6. [Password Management](#password-management)
7. [Middleware & Security](#middleware-security)
8. [Error Handling](#error-handling)

---

## User Registration

### 1. User Signup
**Endpoint:** `POST /signup`  
**Description:** Creates a new user account and sends verification email  
**Rate Limit:** Signup rate limiting applied  
**Validation:** registerSchema validation applied

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "username": "myusername",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Request Body:**
```typescript
{
  email: string;        // Valid email address
  password: string;     // Min 8 chars, must include uppercase, lowercase, number, special char
  username: string;     // Unique username
  firstName: string;    // User's first name
  lastName: string;     // User's last name
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "userId": "user_id_here",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

---

## Email Verification

### 1. Verify Email
**Endpoint:** `POST /verify-email` or `GET /verify-email`  
**Description:** Verifies email verification token  
**Rate Limit:** Email verification rate limiting applied

```bash
# POST method
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_here"
  }'

# GET method (from email link)
curl -X GET "http://localhost:3000/api/auth/verify-email?token=verification_token_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "verified": true
  }
}
```

### 2. Resend Verification Email
**Endpoint:** `POST /resend-verification`  
**Description:** Resends verification email  
**Rate Limit:** Email verification rate limiting applied

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## User Login

### 1. User Login
**Endpoint:** `POST /login`  
**Description:** Authenticates user and creates session  
**Rate Limit:** Login rate limiting applied  
**Validation:** loginSchema validation applied

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }'
```

**Request Body:**
```typescript
{
  email: string;        // User's email
  password: string;     // User's password
  rememberMe?: boolean; // Optional: extend session duration
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "myusername",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. Logout
**Endpoint:** `POST /logout`  
**Description:** Destroys user session  
**Authentication:** Required

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session_cookie_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Session Management

### 1. Check Session Status
**Endpoint:** `GET /session`  
**Description:** Checks if user session is valid  
**Authentication:** Required

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: session_cookie_here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "user",
      "isEmailVerified": true
    }
  }
}
```

### 2. Refresh Session
**Endpoint:** `POST /refresh`  
**Description:** Refreshes user session  
**Authentication:** Required

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: session_cookie_here"
```

---

## User Profile

### 1. Get Profile
**Endpoint:** `GET /profile`  
**Description:** Gets current user profile  
**Authentication:** Required  
**Email Verification:** Required

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Cookie: session_cookie_here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "myusername",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

## Password Management

### 1. Request Password Reset
**Endpoint:** `POST /forgot-password`  
**Description:** Sends password reset email  
**Rate Limit:** Password reset rate limiting applied

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 2. Reset Password
**Endpoint:** `POST /reset-password`  
**Description:** Resets password using reset token  
**Rate Limit:** Password reset rate limiting applied  
**Validation:** resetPasswordSchema validation applied

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Request Body:**
```typescript
{
  token: string;        // Password reset token
  newPassword: string;  // New password (same requirements as signup)
}
```

### 3. Change Password
**Endpoint:** `POST /change-password`  
**Description:** Changes password for authenticated user  
**Authentication:** Required  
**Email Verification:** Required  
**Validation:** changePasswordSchema validation applied

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

---

## Middleware & Security

### Authentication Middleware
- **Session-based authentication** using express-session
- **Automatic session validation** on protected routes
- **Session timeout** and renewal mechanisms

### Rate Limiting
- **Signup rate limiting:** Prevents spam registrations
- **Login rate limiting:** Prevents brute force attacks
- **Email verification rate limiting:** Prevents email spam
- **Password reset rate limiting:** Prevents abuse

### Validation
- **Input validation** using Joi schemas
- **Password strength requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Email format validation**
- **Username uniqueness validation**

### Security Features
- **Password hashing** using bcrypt
- **CSRF protection** (when enabled)
- **Secure session cookies**
- **Email verification** required for sensitive operations
- **Rate limiting** on sensitive endpoints

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Email verification required"
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later."
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Internal server error"
  }
}
```

---

## Session Configuration

### Session Settings
- **Session store:** MongoDB (using connect-mongo)
- **Session duration:** 24 hours (default) or 30 days (with rememberMe)
- **Session security:** httpOnly, secure (in production), sameSite
- **Session cleanup:** Automatic expired session removal

### Environment Variables
```env
SESSION_SECRET=your_session_secret_here
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
MONGODB_URI=mongodb://localhost:27017/instagram-automation
```

---

## Testing Examples

### Complete Authentication Flow
```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Verify email (use token from email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_from_email"
  }'

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# 4. Access protected route
curl -X GET http://localhost:3000/api/auth/profile \
  -b cookies.txt

# 5. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## Notes

- All endpoints return JSON responses
- Session cookies are automatically handled by the browser
- For API clients, ensure proper cookie handling
- Email verification is required for accessing most protected features
- Rate limiting helps prevent abuse and ensures system stability
- All passwords are securely hashed using bcrypt
- Sessions are stored in MongoDB for scalability and persistence