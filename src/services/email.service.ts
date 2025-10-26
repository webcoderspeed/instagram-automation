/**
 * Email Service
 * Handles sending emails for verification, notifications, and other communications
 */

import logger from '../utils/logger';
import { mailerService, EmailOptions } from './mailer.service';

export interface VerificationEmailData {
  to: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetUrl: string;
}

export interface WelcomeEmailData {
  to: string;
  name: string;
}

class EmailService {
  /**
   * Send verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    try {
      logger.info('Sending verification email:', {
        to: data.to,
        name: data.name,
        verificationUrl: data.verificationUrl
      });

      const emailOptions: EmailOptions = {
        to: data.to,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email address</h2>
            <p>Hi ${data.name},</p>
            <p>Please click the link below to verify your email address:</p>
            <a href="${data.verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>PostEngage.ai Team</p>
          </div>
        `,
        text: `Hi ${data.name},\n\nPlease click the link below to verify your email address:\n${data.verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nPostEngage.ai Team`
      };

      const success = await mailerService.sendEmail(emailOptions);
      if (!success) {
        throw new Error('Failed to send verification email through mailer service');
      }

    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    try {
      logger.info('Sending password reset email:', {
        to: data.to,
        name: data.name,
        resetUrl: data.resetUrl
      });

      const emailOptions: EmailOptions = {
        to: data.to,
        subject: 'Reset your password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Hi ${data.name},</p>
            <p>You requested to reset your password. Click the link below:</p>
            <a href="${data.resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>PostEngage.ai Team</p>
          </div>
        `,
        text: `Hi ${data.name},\n\nYou requested to reset your password. Click the link below:\n${data.resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nPostEngage.ai Team`
      };

      const success = await mailerService.sendEmail(emailOptions);
      if (!success) {
        throw new Error('Failed to send password reset email through mailer service');
      }

    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    try {
      logger.info('Sending welcome email:', {
        to: data.to,
        name: data.name
      });

      const emailOptions: EmailOptions = {
        to: data.to,
        subject: 'Welcome to PostEngage.ai!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to PostEngage.ai!</h2>
            <p>Hi ${data.name},</p>
            <p>Welcome to PostEngage.ai! We're excited to have you on board.</p>
            <h3>Here's what you can do next:</h3>
            <ol>
              <li>Connect your social media accounts</li>
              <li>Set up your first automation</li>
              <li>Schedule your content</li>
              <li>Monitor your analytics</li>
            </ol>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>PostEngage.ai Team</p>
          </div>
        `,
        text: `Hi ${data.name},\n\nWelcome to PostEngage.ai! We're excited to have you on board.\n\nHere's what you can do next:\n1. Connect your social media accounts\n2. Set up your first automation\n3. Schedule your content\n4. Monitor your analytics\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nPostEngage.ai Team`
      };

      const success = await mailerService.sendEmail(emailOptions);
      if (!success) {
        throw new Error('Failed to send welcome email through mailer service');
      }

    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(to: string, subject: string, message: string): Promise<void> {
    try {
      logger.info('Sending notification email:', {
        to,
        subject
      });

      const emailOptions: EmailOptions = {
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${subject}</h2>
            <div style="margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>Best regards,<br>PostEngage.ai Team</p>
          </div>
        `,
        text: `${message}\n\nBest regards,\nPostEngage.ai Team`
      };

      const success = await mailerService.sendEmail(emailOptions);
      if (!success) {
        throw new Error('Failed to send notification email through mailer service');
      }

    } catch (error) {
      logger.error('Failed to send notification email:', error);
      throw new Error('Failed to send notification email');
    }
  }
}

export const emailService = new EmailService();