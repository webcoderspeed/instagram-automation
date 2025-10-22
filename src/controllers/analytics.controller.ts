/**
 * Analytics Controller
 * Provides user login statistics and activity insights
 */

import { Request, Response, NextFunction } from 'express';
import { LoginHistoryModel } from '../models/login-history.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import { sendSuccess, createMeta } from '../utils/response-builder';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Types } from 'mongoose';

class AnalyticsController {
  /**
   * Get user login statistics
   */
  getUserLoginStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      // Get comprehensive login stats
      const stats = await LoginHistoryModel.getLoginStats(new Types.ObjectId(userId), days);
      
      // Get recent login history
      const recentLogins = await LoginHistoryModel.find({
        userId: new Types.ObjectId(userId)
      })
      .sort({ loginAt: -1 })
      .limit(10)
      .select('loginAt logoutAt ipAddress browser os device location isSuspicious status sessionDuration');

      // Get user's current info
      const user = await UserModel.findById(userId).select('totalLoginCount lastLoginAt lastLoginIP lastLoginUserAgent');

      sendSuccess(res, {
        period: `${days} days`,
        stats,
        recentLogins,
        userInfo: {
          totalLoginCount: user?.totalLoginCount || 0,
          lastLoginAt: user?.lastLoginAt,
          lastLoginIP: user?.lastLoginIP,
          lastLoginUserAgent: user?.lastLoginUserAgent
        }
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

    } catch (error: unknown) {
      logger.error('Get user login stats error:', error);
      throw error;
    }
  });

  /**
   * Get login activity by date range
   */
  getLoginActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.session.user?.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    if (!userId) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const activity = await LoginHistoryModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          loginAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loginAt' }
          },
          loginCount: { $sum: 1 },
          uniqueDevices: { $addToSet: '$deviceFingerprint' },
          suspiciousCount: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
          avgSessionDuration: { $avg: '$sessionDuration' }
        }
      },
      {
        $project: {
          date: '$_id',
          loginCount: 1,
          uniqueDeviceCount: { $size: '$uniqueDevices' },
          suspiciousCount: 1,
          avgSessionDuration: { $round: ['$avgSessionDuration', 2] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    sendSuccess(res, {
      startDate,
      endDate,
      activity
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get device and browser analytics
   */
  getDeviceAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.session.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deviceStats = await LoginHistoryModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            loginAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            browsers: {
              $push: {
                browser: '$browser',
                count: 1
              }
            },
            devices: {
              $push: {
                device: '$device',
                count: 1
              }
            },
            operatingSystems: {
              $push: {
                os: '$os',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            browserStats: {
              $reduce: {
                input: '$browsers',
                initialValue: [],
                in: {
                  $cond: [
                    { $in: ['$$this.browser', '$$value.browser'] },
                    {
                      $map: {
                        input: '$$value',
                        in: {
                          $cond: [
                            { $eq: ['$$this.browser', '$$this.browser'] },
                            { browser: '$$this.browser', count: { $add: ['$$this.count', 1] } },
                            '$$this'
                          ]
                        }
                      }
                    },
                    { $concatArrays: ['$$value', ['$$this']] }
                  ]
                }
              }
            },
            deviceStats: {
              $reduce: {
                input: '$devices',
                initialValue: [],
                in: {
                  $cond: [
                    { $in: ['$$this.device', '$$value.device'] },
                    {
                      $map: {
                        input: '$$value',
                        in: {
                          $cond: [
                            { $eq: ['$$this.device', '$$this.device'] },
                            { device: '$$this.device', count: { $add: ['$$this.count', 1] } },
                            '$$this'
                          ]
                        }
                      }
                    },
                    { $concatArrays: ['$$value', ['$$this']] }
                  ]
                }
              }
            },
            osStats: {
              $reduce: {
                input: '$operatingSystems',
                initialValue: [],
                in: {
                  $cond: [
                    { $in: ['$$this.os', '$$value.os'] },
                    {
                      $map: {
                        input: '$$value',
                        in: {
                          $cond: [
                            { $eq: ['$$this.os', '$$this.os'] },
                            { os: '$$this.os', count: { $add: ['$$this.count', 1] } },
                            '$$this'
                          ]
                        }
                      }
                    },
                    { $concatArrays: ['$$value', ['$$this']] }
                  ]
                }
              }
            }
          }
        }
      ]);

      sendSuccess(res, {
        period: `${days} days`,
        deviceAnalytics: deviceStats[0] || {
          browserStats: [],
          deviceStats: [],
          osStats: []
        }
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

  });

  /**
   * Get security insights
   */
  getSecurityInsights = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.session.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get suspicious login attempts
      const suspiciousLogins = await LoginHistoryModel.find({
        userId: new Types.ObjectId(userId),
        isSuspicious: true,
        loginAt: { $gte: startDate }
      })
      .sort({ loginAt: -1 })
      .select('loginAt ipAddress browser device suspiciousReasons location')
      .limit(20);

      // Get unique IPs and devices
      const uniqueData = await LoginHistoryModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            loginAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            uniqueIPs: { $addToSet: '$ipAddress' },
            uniqueDevices: { $addToSet: '$deviceFingerprint' },
            totalSuspicious: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
            totalLogins: { $sum: 1 }
          }
        }
      ]);

      const stats = uniqueData[0] || {
        uniqueIPs: [],
        uniqueDevices: [],
        totalSuspicious: 0,
        totalLogins: 0
      };

      sendSuccess(res, {
        period: `${days} days`,
        securityStats: {
          uniqueIPCount: stats.uniqueIPs.length,
          uniqueDeviceCount: stats.uniqueDevices.length,
          suspiciousLoginCount: stats.totalSuspicious,
          totalLogins: stats.totalLogins,
          suspiciousPercentage: stats.totalLogins > 0 ? 
            Math.round((stats.totalSuspicious / stats.totalLogins) * 100) : 0
        },
        suspiciousLogins
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

  });
}

export const analyticsController = new AnalyticsController();