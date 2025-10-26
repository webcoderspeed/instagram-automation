import axios from 'axios';
import logger from '../utils/logger';

// Instagram Graph API configuration interface
interface InstagramConfig {
  accessToken?: string;
  baseUrl?: string;
}

// Instagram media interface based on Graph API
interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
}

// Instagram user profile interface based on Graph API
interface InstagramProfile {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  media_count: number;
  followers_count?: number;
  follows_count?: number;
  name?: string;
  biography?: string;
  website?: string;
  profile_picture_url?: string;
}

// Instagram insights interface
interface InstagramInsights {
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      value: number;
      end_time: string;
    }>;
    title: string;
    description: string;
    id: string;
  }>;
}

// Instagram container interface for publishing
interface MediaContainer {
  id: string;
}

// Instagram publishing response
interface PublishResponse {
  id: string;
}

// Rate limiting interface
interface RateLimit {
  remaining: number;
  resetTime: number;
}

// Instagram Graph API service class
class InstagramService {
  private config: InstagramConfig;
  private readonly baseUrl: string;
  private rateLimit: RateLimit;

  constructor(config: InstagramConfig = {}) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://graph.instagram.com/v24.0';
    this.rateLimit = { remaining: 200, resetTime: Date.now() + 3600000 }; // 1 hour
    logger.info('Instagram Graph API service initialized');
  }

  /**
   * Set Instagram API configuration
   */
  setConfig(config: Partial<InstagramConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Instagram configuration updated');
  }

  /**
   * Check rate limiting before making API calls
   */
  private checkRateLimit(): void {
    if (Date.now() > this.rateLimit.resetTime) {
      this.rateLimit.remaining = 200;
      this.rateLimit.resetTime = Date.now() + 3600000;
    }

    if (this.rateLimit.remaining <= 0) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    this.rateLimit.remaining--;
  }

  /**
   * Make authenticated API request
   */
  private async makeApiRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    this.checkRateLimit();

    if (!this.config.accessToken) {
      throw new Error('Access token is required for Instagram Graph API requests');
    }

    
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const requestParams = {
        access_token: this.config.accessToken,
        ...params
      };
      
      console.log('Request params:', requestParams);
      logger.info(`Making API request to: ${endpoint}`);
      const response = await axios.get(url, { params: requestParams });
      
      return response.data;
    } catch (error: any) {
      logger.error(`API request failed for ${endpoint}`, { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get authenticated user profile information
   */
  async getUserProfile(): Promise<InstagramProfile | null> {
    try {
      logger.info('Fetching authenticated user profile');
      
      const fields = 'id,username,account_type,media_count,followers_count,follows_count,name,biography,website,profile_picture_url';
      const data = await this.makeApiRequest('/me', { fields });

      logger.info('User profile fetched successfully', { username: data.username });
      return data;
    } catch (error) {
      logger.error(`Error fetching user profile: ${error}`);
      return null;
    }
  }

  /**
   * Get user's media posts
   */
  async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    try {
      logger.info(`Fetching user media, limit: ${limit}`);
      
      const fields = 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count,thumbnail_url';
      const data = await this.makeApiRequest('/me/media', { 
        fields,
        limit: Math.min(limit, 100) // Instagram API max limit is 100
      });

      logger.info(`Fetched ${data.data?.length || 0} media items`);
      return data.data || [];
    } catch (error) {
      logger.error(`Error fetching user media: ${error}`);
      return [];
    }
  }

  /**
   * Get specific media item details
   */
  async getMediaDetails(mediaId: string): Promise<InstagramMedia | null> {
    try {
      logger.info(`Fetching media details for: ${mediaId}`);
      
      const fields = 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count,thumbnail_url';
      const data = await this.makeApiRequest(`/${mediaId}`, { fields });

      logger.info('Media details fetched successfully');
      return data;
    } catch (error) {
      logger.error(`Error fetching media details: ${error}`);
      return null;
    }
  }

  /**
   * Create media container for publishing (Business/Creator accounts only)
   */
  async createMediaContainer(imageUrl: string, caption?: string): Promise<MediaContainer | null> {
    try {
      logger.info('Creating media container for publishing');
      
      if (!this.config.accessToken) {
        throw new Error('Access token is required');
      }

      const params = {
        image_url: imageUrl,
        caption: caption || '',
        access_token: this.config.accessToken
      };

      const response = await axios.post<MediaContainer>(`${this.baseUrl}/me/media`, params);
      
      logger.info('Media container created successfully', { id: response.data.id });
      return response.data;
    } catch (error: any) {
      logger.error('Error creating media container', { 
        error: error.response?.data || error.message 
      });
      return null;
    }
  }

  /**
   * Publish media container (Business/Creator accounts only)
   */
  async publishMedia(creationId: string): Promise<PublishResponse | null> {
    try {
      logger.info(`Publishing media container: ${creationId}`);
      
      if (!this.config.accessToken) {
        throw new Error('Access token is required');
      }

      const params = {
        creation_id: creationId,
        access_token: this.config.accessToken
      };

      const response = await axios.post<PublishResponse>(`${this.baseUrl}/me/media_publish`, params);
      
      logger.info('Media published successfully', { id: response.data.id });
      return response.data;
    } catch (error: any) {
      logger.error('Error publishing media', { 
        error: error.response?.data || error.message 
      });
      return null;
    }
  }

  /**
   * Get media insights (Business/Creator accounts only)
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsights | null> {
    try {
      logger.info(`Fetching insights for media: ${mediaId}`);
      
      // Updated metrics for v24.0 compatibility - using views instead of deprecated impressions
      const metrics = 'views,reach,likes,comments,saves,shares';
      const data = await this.makeApiRequest(`/${mediaId}/insights`, { metric: metrics });

      logger.info('Media insights fetched successfully');
      return data;
    } catch (error) {
      logger.error(`Error fetching media insights: ${error}`);
      return null;
    }
  }

  /**
   * Get account insights (Business/Creator accounts only)
   */


  /**
   * Validate access token
   */
  async validateAccessToken(): Promise<boolean> {
    try {
      logger.info('Validating access token');
      
      await this.makeApiRequest('/me', { fields: 'id' });
      
      logger.info('Access token is valid');
      return true;
    } catch (error) {
      logger.warn('Access token validation failed', { error });
      return false;
    }
  }

  /**
   * Get hashtag information (limited functionality)
   */
  async getHashtagInfo(hashtag: string): Promise<any> {
    try {
      logger.info(`Fetching hashtag info for: ${hashtag}`);
      
      // Note: Hashtag search requires special permissions and is limited
      logger.warn('Hashtag search functionality requires special permissions from Instagram');
      
      return {
        message: 'Hashtag search requires special permissions from Instagram',
        hashtag: hashtag
      };
    } catch (error) {
      logger.error(`Error fetching hashtag info: ${error}`);
      return null;
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): RateLimit {
    return { ...this.rateLimit };
  }


}

// Export singleton instance
export const instagramService = new InstagramService();
export default InstagramService;