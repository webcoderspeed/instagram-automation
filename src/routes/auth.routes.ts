/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { signupController } from '../auth/signup/signup.controller';
import { loginController } from '../auth/login/login.controller';
import { passwordResetController } from '../auth/password-reset/password-reset.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { validate } from '../validators/common.validator';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// User Authentication routes
// Signup routes
router.post('/signup', rateLimitMiddleware.signup, validate(registerSchema), signupController.signup);
router.post('/verify-email', rateLimitMiddleware.emailVerification, signupController.verifyEmail);
router.get('/verify-email', rateLimitMiddleware.emailVerification, signupController.verifyEmail);
router.post('/resend-verification', rateLimitMiddleware.emailVerification, signupController.resendVerification);

// Login routes
router.post('/login', rateLimitMiddleware.login, validate(loginSchema), loginController.login);
router.post('/logout', authMiddleware.authenticate, loginController.logout);

// Session management routes
router.get('/session', loginController.checkSession);
router.post('/session/refresh', authMiddleware.authenticate, loginController.refreshSession);

// Profile routes (protected)
router.get('/profile', authMiddleware.authenticate, loginController.getProfile);

// Password reset routes
router.post('/forgot-password', rateLimitMiddleware.passwordReset, passwordResetController.forgotPassword);
router.post('/reset-password', rateLimitMiddleware.passwordReset, passwordResetController.resetPassword);
router.post('/verify-reset-token', rateLimitMiddleware.passwordReset, passwordResetController.verifyResetToken);

// Change password (protected)
router.post('/change-password', authMiddleware.authenticate, passwordResetController.changePassword);

// Instagram OAuth routes
router.get('/instagram', authController.initiateAuth);
router.get('/instagram/callback', authController.handleCallback);
router.post('/instagram/refresh', authController.refreshToken);
router.get('/instagram/user/:userId', authController.getUserInfo);
router.post('/instagram/revoke', authController.revokeToken);

export default router;