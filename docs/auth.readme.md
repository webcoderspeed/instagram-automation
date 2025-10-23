# Authentication API Documentation

यह documentation Instagram Automation SaaS application के सभी authentication endpoints के लिए है। सभी endpoints session-based authentication और role-based permissions का उपयोग करते हैं।

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
7. [Instagram OAuth](#instagram-oauth)

---

## User Registration

### 1. User Signup
**Endpoint:** `POST /signup`  
**Description:** नया user account बनाता है और verification email भेजता है।  
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

### 2. Verify Email
**Endpoint:** `POST /verify-email` या `GET /verify-email`  
**Description:** Email verification token को verify करता है।  
**Rate Limit:** Email verification rate limiting applied

```bash
# POST method
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_here"
  }'

# GET method (email link से)
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

### 3. Resend Verification Email
**Endpoint:** `POST /resend-verification`  
**Description:** Verification email को दोबारा भेजता है।  
**Rate Limit:** Email verification rate limiting applied

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

---

## User Login

### 4. User Login
**Endpoint:** `POST /login`  
**Description:** User को login करता है और session create करता है।  
**Rate Limit:** Login rate limiting applied  
**Validation:** loginSchema validation applied

```bash
# Regular login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Login with Remember Me (extended session)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }'
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
      "emailVerified": true
    },
    "session": {
      "id": "session_id",
      "expiresAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 5. User Logout
**Endpoint:** `POST /logout`  
**Description:** Current session को terminate करता है।  
**Authentication:** Required (authMiddleware.authenticate)

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Session Management

### 6. Check Session Status
**Endpoint:** `GET /session`  
**Description:** Current session की status check करता है।  
**Authentication:** Not required (public endpoint)

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_id",
    "userId": "user_id",
    "isActive": true,
    "expiresAt": "2024-01-01T12:00:00Z",
    "rememberMe": false
  }
}
```

### 7. Refresh Session
**Endpoint:** `POST /session/refresh`  
**Description:** Current session को refresh करता है (expiry time extend करता है)।  
**Authentication:** Required (authMiddleware.authenticate)

```bash
curl -X POST http://localhost:3000/api/auth/session/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Session refreshed successfully",
  "data": {
    "sessionId": "session_id",
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

---

## User Profile

### 8. Get User Profile
**Endpoint:** `GET /profile`  
**Description:** Current authenticated user की profile information return करता है।  
**Authentication:** Required (authMiddleware.authenticate)

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

---

## Password Management

### 9. Forgot Password
**Endpoint:** `POST /forgot-password`  
**Description:** Password reset email भेजता है।  
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

### 10. Reset Password
**Endpoint:** `POST /reset-password`  
**Description:** Password reset token के साथ नया password set करता है।  
**Rate Limit:** Password reset rate limiting applied

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 11. Verify Reset Token
**Endpoint:** `POST /verify-reset-token`  
**Description:** Password reset token की validity check करता है।  
**Rate Limit:** Password reset rate limiting applied

```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

### 12. Change Password
**Endpoint:** `POST /change-password`  
**Description:** Authenticated user का password change करता है।  
**Authentication:** Required (authMiddleware.authenticate)

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Instagram OAuth

### 13. Initiate Instagram OAuth
**Endpoint:** `GET /instagram`  
**Description:** Instagram OAuth flow को initiate करता है।

```bash
curl -X GET http://localhost:3000/api/auth/instagram
```

**Response:** Redirects to Instagram OAuth URL

### 14. Handle Instagram OAuth Callback
**Endpoint:** `GET /instagram/callback`  
**Description:** Instagram OAuth callback को handle करता है।

```bash
curl -X GET "http://localhost:3000/api/auth/instagram/callback?code=auth_code_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Instagram account connected successfully",
  "data": {
    "platformAccount": {
      "id": "platform_account_id",
      "platform": "instagram",
      "platformUserId": "instagram_user_id",
      "platformUsername": "instagram_username"
    }
  }
}
```

### 15. Refresh Instagram Token
**Endpoint:** `POST /instagram/refresh`  
**Description:** Instagram access token को refresh करता है।

```bash
curl -X POST http://localhost:3000/api/auth/instagram/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "platformAccountId": "platform_account_id"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

### 16. Get Instagram User Info
**Endpoint:** `GET /instagram/user/:userId`  
**Description:** Instagram user की information retrieve करता है।

```bash
curl -X GET http://localhost:3000/api/auth/instagram/user/instagram_user_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "instagram_user_id",
      "username": "instagram_username",
      "account_type": "BUSINESS",
      "media_count": 150
    }
  }
}
```

### 17. Revoke Instagram Token
**Endpoint:** `POST /instagram/revoke`  
**Description:** Instagram access token को revoke करता है।

```bash
curl -X POST http://localhost:3000/api/auth/instagram/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "platformAccountId": "platform_account_id"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

## Error Responses

सभी endpoints निम्नलिखित error format का उपयोग करते हैं:

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

### Common Error Codes:
- `400` - Bad Request (Invalid input data)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

निम्नलिखित endpoints पर rate limiting लागू है:

- **Signup:** Limited requests per IP
- **Login:** Limited login attempts per IP
- **Email Verification:** Limited verification attempts
- **Password Reset:** Limited reset requests per email
- **General:** General rate limiting on all auth endpoints

Rate limit exceed होने पर `429` status code के साथ error response मिलता है।

---

## Security Features

1. **Session-based Authentication:** Secure HTTP-only cookies
2. **Rate Limiting:** Brute force protection
3. **Email Verification:** Account verification required
4. **Password Security:** Strong password requirements
5. **OAuth Integration:** Secure Instagram API integration
6. **CSRF Protection:** Cross-site request forgery protection