/**
 * Login Service
 * Handles user authentication and session management
 */

import { Request } from "express";
import { UserModel, UserDocument } from "../../models/user.model";
import { LoginHistoryModel } from "../../models/login-history.model";
import { ApiError } from "../../utils/api-error";
import logger from "../../utils/logger";
import { SessionUser } from "../../config/session.config";
import {
  generateDeviceFingerprint,
  getClientIP,
  getLocationFromIP,
  formatLocationForDisplay,
  formatUserAgentForDisplay,
  isSuspiciousLogin,
  parseUserAgent,
} from "../../utils/device-tracking";

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: UserDocument;
  success: boolean;
  message: string;
}

class LoginService {
  /**
   * Authenticate user and create session
   */
  async login(data: LoginData, req: Request): Promise<LoginResult> {
    try {
      const { email, password, rememberMe = false } = data;

      // Find user by email
      const user = await UserModel.findOne({
        email: email.toLowerCase().trim(),
        deletedAt: null,
      }).select("+passwordHash").populate("platformAccounts");

      if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw ApiError.unauthorized(
          "Account is temporarily locked due to too many failed login attempts"
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        throw ApiError.unauthorized("Invalid email or password");
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw ApiError.unauthorized(
          "Please verify your email before logging in"
        );
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Capture comprehensive login tracking data
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "";
      const deviceFingerprint = generateDeviceFingerprint(req);
      const locationData = await getLocationFromIP(clientIP);
      const location = formatLocationForDisplay(locationData);

      // Check for suspicious login patterns
      const suspiciousCheck = isSuspiciousLogin(
        clientIP,
        deviceFingerprint,
        user.lastLoginIP,
        user.trustedDevices
      );

      if (suspiciousCheck.isSuspicious) {
        logger.warn(`Suspicious login detected for user ${user.email}:`, {
          ip: clientIP,
          userAgent: formatUserAgentForDisplay(userAgent),
          reasons: suspiciousCheck.reasons,
          deviceFingerprint,
        });

        // You could add additional security measures here:
        // - Send email notification
        // - Require additional verification
        // - Log to security audit trail
      }

      // Update last login with comprehensive data
      await user.updateLastLogin({
        ip: clientIP,
        userAgent,
        location,
        deviceFingerprint,
      });

      // Parse user agent for detailed device info
      const deviceInfo = parseUserAgent(userAgent);

      // Create login history record for analytics
      const loginHistory = new LoginHistoryModel({
        userId: user._id,
        loginAt: new Date(),
        ipAddress: clientIP,
        userAgent,
        deviceFingerprint,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        location,
        country: locationData?.country,
        city: locationData?.city,
        timezone: locationData?.timezone,
        isSuspicious: suspiciousCheck.isSuspicious,
        suspiciousReasons: suspiciousCheck.reasons,
        isNewDevice: !user.trustedDevices.includes(deviceFingerprint),
        isNewLocation: user.lastLoginIP !== clientIP,
        rememberMe: rememberMe || false,
        sessionId: req.sessionID,
        status: "active",
        metadata: {
          loginMethod: "email_password",
          timestamp: new Date().toISOString(),
        },
      });

      await loginHistory.save();

      // Create session
      req.session.user = {
        id: String(user._id),
        _id: String(user._id),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions ?? [],
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt ?? new Date(),
      } as SessionUser;

      req.session.isAuthenticated = true;

      // Set session expiration based on rememberMe
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user,
        success: true,
        message: "Login successful",
      };
    } catch (error: unknown) {
      logger.error("Login error:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Login failed");
    }
  }

  /**
   * Logout user (destroy session)
   */
  async logout(req: Request): Promise<void> {
    try {
      const userId = req.session.user?.id;
      const sessionId = req.sessionID;

      // Update login history to mark session as logged out
      if (userId && sessionId) {
        await LoginHistoryModel.findOneAndUpdate(
          {
            userId,
            sessionId,
            status: "active",
          },
          {
            $set: {
              status: "logged_out",
              logoutAt: new Date(),
            },
          }
        );
      }

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error("Session destruction error:", err);
          throw ApiError.internal("Logout failed");
        }
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error: unknown) {
      logger.error("Logout error:", error);
      throw ApiError.internal("Logout failed");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(req: Request): boolean {
    return !!(req.session && req.session.isAuthenticated && req.session.user);
  }

  /**
   * Get current user from session
   */
  getCurrentUser(req: Request): SessionUser | null {
    if (this.isAuthenticated(req)) {
      return req.session.user ?? null;
    }
    return null;
  }

  /**
   * Refresh session (extend expiration)
   */
  refreshSession(req: Request): void {
    if (this.isAuthenticated(req)) {
      req.session.touch();
    }
  }
}

export const loginService = new LoginService();
