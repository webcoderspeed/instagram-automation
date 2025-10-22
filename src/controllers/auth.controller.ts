import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { createOAuthConfig, createOAuthController } from '../services/oauth';
import logger from '../utils/logger';

export class AuthController {
  private oauthController: any;

  constructor() {
    const oauthConfig = createOAuthConfig(
      process.env.INSTAGRAM_APP_ID || '',
      process.env.INSTAGRAM_APP_SECRET || '',
      process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback'
    );
    this.oauthController = createOAuthController(oauthConfig);
  }

  initiateAuth = asyncHandler(async (req: Request, res: Response) => {
    await this.oauthController.initiateAuth(req, res);
  });

  handleCallback = asyncHandler(async (req: Request, res: Response) => {
    await this.oauthController.handleCallback(req, res);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    await this.oauthController.refreshToken(req, res);
  });

  getUserInfo = asyncHandler(async (req: Request, res: Response) => {
    await this.oauthController.getUserInfo(req, res);
  });

  revokeToken = asyncHandler(async (req: Request, res: Response) => {
    await this.oauthController.revokeToken(req, res);
  });
}