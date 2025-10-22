/**
 * Analytics Controller
 * Provides user login statistics and activity insights
 */

import { Request, Response, NextFunction } from 'express';
import { LoginHistoryModel } from '../models/login-history.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import logger from '../utils/logger';
import { Types } from 'mongoose';

class AnalyticsController {
  /**
   * Get user login statistics
   */
  async getUserLoginStats(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          stats,
          recentLogins,
          userInfo: {
            totalLoginCount: user?.totalLoginCount || 0,
            lastLoginAt: user?.lastLoginAt,
            lastLoginIP: user?.lastLoginIP,
            lastLoginUserAgent: user?.lastLoginUserAgent
          }
        }
      });

    } catch (error: unknown) {
      logger.error('Get user login stats error:', error);
      next(error);
    }
  }

  /**
   * Get login activity by date range
   */
  async getLoginActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      res.json({
        success: true,
        data: {
          startDate,
          endDate,
          activity
        }
      });

    } catch (error: unknown) {
      logger.error('Get login activity error:', error);
      next(error);
    }
  }

  /**
   * Get device and browser analytics
   */
  async getDeviceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          deviceAnalytics: deviceStats[0] || {
            browserStats: [],
            deviceStats: [],
            osStats: []
          }
        }
      });

    } catch (error: unknown) {
      logger.error('Get device analytics error:', error);
      next(error);
    }
  }

  /**
   * Get security insights
   */
  async getSecurityInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      res.json({
        success: true,
        data: {
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
        }
      });

    } catch (error: unknown) {
      logger.error('Get security insights error:', error);
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();