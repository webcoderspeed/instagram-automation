import { Request, Response, NextFunction } from 'express';
import { jwtAuthService } from '../../services/auth/jwt-auth.service';
import logger from '../../utils/logger';

/**
 * JWT Authentication Guard
 * Validates JWT token and attaches user to request
 */
export const jwtAuthGuard = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = (req as any).get('authorization');
  const token = jwtAuthService.extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Access token required'
      }
    });
    return;
  }

  const validation = jwtAuthService.validateToken(token);
  
  if (!validation.isValid || !validation.user) {
    logger.warn('Invalid token provided', { error: validation.error });
    res.status(403).json({
      success: false,
      error: {
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  req.user = validation.user;
  next();
};

/**
 * Optional JWT Authentication Guard
 * Validates JWT token if present but doesn't require it
 */
export const optionalJwtAuthGuard = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = (req as any).get('authorization');
  const token = jwtAuthService.extractTokenFromHeader(authHeader);

  if (!token) {
    next();
    return;
  }

  const validation = jwtAuthService.validateToken(token);
  
  if (validation.isValid && validation.user) {
    req.user = validation.user;
  } else {
    logger.debug('Optional auth failed', { error: validation.error });
  }

  next();
};