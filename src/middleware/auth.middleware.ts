/**
 * Authentication Middleware
 * Handles session-based authentication
 */

import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";
import logger from "../utils/logger";
import { AuthenticatedUser } from "../types";

class AuthMiddleware {
  /**
   * Authenticate user using session
   */
  async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Check if session exists and user is authenticated
      if (!req.session || !req.session.isAuthenticated || !req.session.user) {
        throw ApiError.unauthorized("Authentication required");
      }

      const sessionUser = req.session.user;

      // Get fresh user data from database with populated platform accounts
      const user = await UserModel.findById(sessionUser.id)
        .select("-passwordHash")
        .populate("platformAccounts");

      if (!user) {
        // User not found, destroy session
        req.session.destroy(() => {});
        throw ApiError.unauthorized("User not found");
      }

      // Check if user is deleted
      if (user.deletedAt) {
        req.session.destroy(() => {});
        throw ApiError.unauthorized("Account is deactivated");
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw ApiError.unauthorized("Email verification required");
      }

      req.session.user = {
        id: String(user._id),
        _id: String(user._id),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions || [],
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt || new Date(),
        connectedAccounts: user.platformAccounts || [],
      } as AuthenticatedUser;

      next();
    } catch (error: unknown) {
      logger.error("Authentication middleware error:", error);
      next(error);
    }
  }

  /**
   * Check if user has required role
   */
  requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.session?.user) {
          throw ApiError.unauthorized("User not authenticated");
        }

        const userRole = req.session.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
          throw ApiError.forbidden("Insufficient permissions");
        }

        next();
      } catch (error: unknown) {
        logger.error("Role check middleware error:", error);
        next(error);
      }
    };
  }

  /**
   * Check if user is admin
   */
  requireAdmin(req: Request, res: Response, next: NextFunction): void {
    this.requireRole("admin")(req, res, next);
  }

  /**
   * Check if user has verified email
   */
  requireEmailVerified(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.session?.user) {
        throw ApiError.unauthorized("User not authenticated");
      }

      if (!req.session?.user?.isEmailVerified) {
        throw ApiError.forbidden("Email verification required");
      }

      next();
    } catch (error: unknown) {
      logger.error("Email verification middleware error:", error);
      next(error);
    }
  }

  /**
   * Optional authentication - doesn't fail if no session
   */
  async optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Check if session exists and user is authenticated
      if (!req.session || !req.session.isAuthenticated || !req.session.user) {
        // No session, continue without authentication
        next();
        return;
      }

      const sessionUser = req.session.user;

      // Get user from database with populated platform accounts
      const user = await UserModel.findById(sessionUser.id)
        .select("-passwordHash")
        .populate("platformAccounts");
      if (user && !user.deletedAt && user.isEmailVerified) {
        // No need to attach user to req.user, using req.session.user instead
      }

      next();
    } catch (error: unknown) {
      // For optional auth, we don't fail on errors
      logger.debug("Optional auth failed:", error);
      next();
    }
  }

  /**
   * Check if user is authenticated (session-based)
   */
  isAuthenticated(req: Request): boolean {
    return !!(req.session && req.session.isAuthenticated && req.session.user);
  }

  /**
   * Get current user from session
   */
  getCurrentUser(req: Request): any | null {
    if (this.isAuthenticated(req) && req.session.user) {
      return req.session.user;
    }
    return null;
  }
}

export const authMiddleware = new AuthMiddleware();
