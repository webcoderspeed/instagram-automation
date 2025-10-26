import axios from 'axios';
import logger from '../../../utils/logger';
import { 
  InstagramUserProfile, 
  ProfileRequest, 
  ProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  ProfileInsights,
  ProfileInsightsRequest,
  ProfileInsightsResponse
} from './profile.types';

/**
 * Instagram Profile Service
 * Handles all profile-related operations
 */
export class InstagramProfileService {
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';

  /**
   * Get user profile information
   */
  async getUserProfile(request: ProfileRequest): Promise<ProfileResponse> {
    try {
      const fields = request.fields?.join(',') || 
        'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count';

      const url = `${this.graphUrl}/me?fields=${fields}&access_token=${request.access_token}`;

      logger.info('Fetching Instagram user profile', {
        fields,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<InstagramUserProfile>(url);

      logger.info('Instagram profile fetched successfully', {
        userId: response.data.user_id,
        username: response.data.username,
        accountType: response.data.account_type
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram profile', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  }

  /**
   * Get profile by Instagram user ID
   */
  async getProfileById(userId: string, accessToken: string): Promise<ProfileResponse> {
    try {
      const fields = 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count';
      const url = `${this.graphUrl}/${userId}?fields=${fields}&access_token=${accessToken}`;

      logger.info('Fetching Instagram profile by ID', {
        userId,
        url: url.replace(accessToken, '[REDACTED]')
      });

      const response = await axios.get<InstagramUserProfile>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram profile by ID', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  }

  /**
   * Update profile information (limited fields available via API)
   */
  async updateProfile(
    accessToken: string, 
    updateData: ProfileUpdateRequest
  ): Promise<ProfileUpdateResponse> {
    try {
      // Note: Instagram API has limited profile update capabilities
      // Most profile updates need to be done through the Instagram app
      
      logger.info('Attempting to update Instagram profile', {
        fields: Object.keys(updateData)
      });

      // For now, return success message as Instagram API doesn't support
      // direct profile updates via Graph API
      return {
        success: true,
        message: 'Profile updates should be done through Instagram app. API has limited update capabilities.'
      };
    } catch (error) {
      logger.error('Failed to update Instagram profile', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }

  /**
   * Get profile insights (for business accounts)
   */
  async getProfileInsights(request: ProfileInsightsRequest): Promise<ProfileInsightsResponse> {
    try {
      const metrics = request.metric.join(',');
      let url = `${this.graphUrl}/me/insights?metric=${metrics}&period=${request.period}&access_token=${request.access_token}`;

      if (request.since) {
        url += `&since=${request.since}`;
      }
      if (request.until) {
        url += `&until=${request.until}`;
      }

      logger.info('Fetching Instagram profile insights', {
        metrics,
        period: request.period,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<{ data: any[] }>(url);

      // Process insights data
      const insights: Partial<ProfileInsights> = {};
      if (response.data.data) {
        response.data.data.forEach((insight: any) => {
          const metricName = insight.name as keyof ProfileInsights;
          insights[metricName] = insight.values?.[0]?.value || 0;
        });
      }

      return {
        success: true,
        data: insights as ProfileInsights
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram profile insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights'
      };
    }
  }

  /**
   * Validate profile access token
   */
  async validateProfileAccess(accessToken: string): Promise<boolean> {
    try {
      const response = await this.getUserProfile({
        access_token: accessToken,
        fields: ['user_id', 'username']
      });

      return response.success;
    } catch (error) {
      logger.error('Profile access validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get profile summary for dashboard
   */
  async getProfileSummary(accessToken: string): Promise<ProfileResponse> {
    return this.getUserProfile({
      access_token: accessToken,
      fields: ['username', 'name', 'account_type', 'profile_picture_url', 'followers_count', 'media_count']
    });
  }
}

export const instagramProfileService = new InstagramProfileService();