/**
 * Mailer Service
 * Handles email sending functionality using nodemailer with SMTP
 */

import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import env from "../config/env.config";
import logger from "../utils/logger";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class MailerService {
  private transporter!: Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      // Check if SMTP credentials are provided
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        logger.warn(
          "SMTP credentials not provided. Email functionality will be disabled."
        );
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        secure: env.SMTP_SECURE,
        tls: { ciphers: "SSLv3" },
        requireTLS: true,
        port: 465,
        debug: true,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      this.isConfigured = true;
      logger.info("SMTP transporter initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SMTP transporter:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn("SMTP not configured. Skipping connection verification.");
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error("SMTP connection verification failed:", error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn("SMTP not configured. Email not sent:", {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const mailOptions: SendMailOptions = {
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc,
        bcc: Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully:", {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send email:", {
        error: error instanceof Error ? error.message : error,
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    const emailOptions: EmailOptions = {
      to,
      subject: "Welcome to Instagram Automation!",
      html: this.getWelcomeEmailTemplate(username),
      text: `Welcome to Instagram Automation, ${username}! Thank you for joining us.`,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    to: string,
    username: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${
      env.WEBHOOK_BASE_URL ?? "http://localhost:3000"
    }/api/auth/verify-email?token=${verificationToken}`;

    const emailOptions: EmailOptions = {
      to,
      subject: "Verify Your Email Address",
      html: this.getVerificationEmailTemplate(username, verificationUrl),
      text: `Hi ${username}, please verify your email by clicking this link: ${verificationUrl}`,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${
      env.WEBHOOK_BASE_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const emailOptions: EmailOptions = {
      to,
      subject: "Reset Your Password",
      html: this.getPasswordResetEmailTemplate(username, resetUrl),
      text: `Hi ${username}, reset your password by clicking this link: ${resetUrl}`,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const emailOptions: EmailOptions = {
      to,
      subject,
      html: this.getNotificationEmailTemplate(subject, message),
      text: message,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Instagram Automation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Instagram Automation!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>Thank you for joining Instagram Automation. We're excited to help you automate and grow your Instagram presence!</p>
            <p>With our platform, you can:</p>
            <ul>
              <li>Automate your Instagram posts and stories</li>
              <li>Schedule content in advance</li>
              <li>Analyze your performance with detailed analytics</li>
              <li>Manage multiple Instagram accounts</li>
            </ul>
            <p>Get started by connecting your Instagram account and creating your first automation!</p>
            <a href="${
              env.WEBHOOK_BASE_URL || "http://localhost:3000"
            }/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Instagram Automation Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(
    username: string,
    verificationUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>Thank you for signing up for Instagram Automation. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <div class="warning">
              <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Best regards,<br>The Instagram Automation Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(
    username: string,
    resetUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>We received a request to reset your password for your Instagram Automation account. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The Instagram Automation Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notification email template
   */
  private getNotificationEmailTemplate(
    subject: string,
    message: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>${message.replace(/\n/g, "<br>")}</p>
            <p>Best regards,<br>The Instagram Automation Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get transporter status
   */
  getStatus(): { configured: boolean; host: string; port: number } {
    return {
      configured: this.isConfigured,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
    };
  }
}

// Export singleton instance
export const mailerService = new MailerService();
export default mailerService;
