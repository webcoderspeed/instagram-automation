/**
 * Signup Service
 * Handles user registration, email verification, and initial subscription setup
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel, UserDocument } from '../../models/user.model';
import { SubscriptionModel, SubscriptionPlan } from '../../models/subscription.model';
import { NotificationModel, NotificationType, NotificationChannel, NotificationPriority } from '../../models/notification.model';
import { ApiError } from '../../utils/api-error';
import logger from '../../utils/logger';
import { emailService } from '../../services/email.service';

export interface SignupData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  language?: string;
}

export interface SignupResult {
  user: UserDocument;
  emailVerificationRequired: boolean;
  message: string;
}

class SignupService {
  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<SignupResult> {
    try {
      // Check if user already exists
      const existingUser = await this.checkExistingUser(data.email, data.username);
      if (existingUser) {
        throw new ApiError(400, 'User already exists with this email or username');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create user
      const user = new UserModel({
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.username,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        isEmailVerified: false
      });

      // Generate email verification token using user model method
      const emailVerificationToken = user.generateEmailVerificationToken();

      await user.save();

      // Create free subscription
      await this.createFreeSubscription(String(user._id));

      // Send verification email with the original token
      await this.sendVerificationEmail(user, emailVerificationToken);

      // Create welcome notification
      await this.createWelcomeNotification(String(user._id));

      logger.info(`New user registered: ${user.email}`);

      return {
        user,
        emailVerificationRequired: true,
        message: 'Account created successfully. Please check your email to verify your account.'
      };
    } catch (error: unknown) {
      logger.error('Signup error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to create account');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<UserDocument> {
    try {
      // Hash the provided token to match the stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await UserModel.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
        isEmailVerified: false
      });

      if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token');
      }

      // Update user
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Create verification success notification
      await this.createEmailVerifiedNotification(String(user._id));

      logger.info(`Email verified for user: ${user.email}`);

      return user;
    } catch (error: unknown) {
      logger.error('Email verification error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to verify email');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        isEmailVerified: false
      });

      if (!user) {
        throw new ApiError(404, 'User not found or already verified');
      }

      // Generate new token using user model method
      const emailVerificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email with the original token
      await this.sendVerificationEmail(user, emailVerificationToken);

      logger.info(`Verification email resent to: ${user.email}`);
    } catch (error: unknown) {
      logger.error('Resend verification email error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to resend verification email');
    }
  }

  /**
   * Check if user exists with email or username
   */
  private async checkExistingUser(email: string, username: string): Promise<boolean> {
    const existingUser = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ],
      deletedAt: null
    });

    return !!existingUser;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }



  /**
   * Create free subscription for new user
   */
  private async createFreeSubscription(userId: string): Promise<void> {
    const subscription = new SubscriptionModel({
      userId,
      plan: SubscriptionPlan.FREE,
      features: {
        maxPlatformAccounts: 1,
        maxAutomations: 3,
        maxPostsPerMonth: 30,
        maxStorageGB: 1,
        analyticsRetentionDays: 30,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        webhooks: false,
        teamMembers: 1,
        advancedAnalytics: false,
        bulkOperations: false
      }
    });

    await subscription.save();

    // Update user with subscription reference
    await UserModel.findByIdAndUpdate(userId, {
      subscriptionId: subscription._id
    });
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(user: UserDocument, originalToken: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${originalToken}`;
      
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.displayName || user.username,
        verificationUrl
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't throw error here as user is already created
    }
  }

  /**
   * Create welcome notification
   */
  private async createWelcomeNotification(userId: string): Promise<void> {
    try {
      const notification = new NotificationModel({
        userId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        title: 'Welcome to SocialMedia Automation!',
        message: 'Your account has been created successfully. Please verify your email to get started.',
        channels: [NotificationChannel.IN_APP],
        actions: [
          {
            label: 'Get Started',
            action: 'navigate',
            url: '/dashboard'
          }
        ]
      });

      await notification.save();
    } catch (error) {
      logger.error('Failed to create welcome notification:', error);
      // Don't throw error here
    }
  }

  /**
   * Create email verified notification
   */
  private async createEmailVerifiedNotification(userId: string): Promise<void> {
    try {
      const notification = new NotificationModel({
        userId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        title: 'Email Verified Successfully!',
        message: 'Your email has been verified. You can now access all features.',
        channels: [NotificationChannel.IN_APP],
        actions: [
          {
            label: 'Connect Platform',
            action: 'navigate',
            url: '/integrations'
          }
        ]
      });

      await notification.save();
    } catch (error) {
      logger.error('Failed to create email verified notification:', error);
      // Don't throw error here
    }
  }
}

export const signupService = new SignupService();