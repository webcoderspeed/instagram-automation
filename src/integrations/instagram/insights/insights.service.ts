import axios from 'axios';
import logger from '../../../utils/logger';
import {
  InsightsRequest,
  InsightsResponse,
  AccountInsightsRequest,
  AccountInsightsResponse,
  MediaInsightsRequest,
  MediaInsightsResponse,
  StoryInsightsRequest,
  StoryInsightsResponse,
  AudienceInsightsRequest,
  AudienceInsightsResponse,
  InsightsSummary,
  InsightsSummaryRequest,
  AccountInsights,
  MediaInsights,
  StoryInsights,
  AudienceInsights,
  InsightMetric
} from './insights.types';

/**
 * Instagram Insights Service
 * Handles analytics, metrics, and insights data from Instagram
 */
export class InstagramInsightsService {
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';

  /**
   * Get account insights
   */
  async getAccountInsights(request: AccountInsightsRequest): Promise<AccountInsightsResponse> {
    try {
      const params = {
        metric: request.metric.join(','),
        period: request.period,
        access_token: request.access_token,
        ...(request.since && { since: request.since }),
        ...(request.until && { until: request.until })
      };

      logger.info('Fetching account insights', {
        metrics: request.metric,
        period: request.period,
        since: request.since,
        until: request.until
      });

      const response = await axios.get<any>(`${this.graphUrl}/me/insights`, {
        params
      });

      const insights = this.parseAccountInsights(response.data.data);

      logger.info('Account insights fetched successfully', {
        metricsCount: response.data.data.length
      });

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      logger.error('Failed to fetch account insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch account insights'
      };
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(request: MediaInsightsRequest): Promise<MediaInsightsResponse> {
    try {
      const params = {
        metric: request.metric.join(','),
        access_token: request.access_token
      };

      logger.info('Fetching media insights', {
        mediaId: request.media_id,
        metrics: request.metric
      });

      const response = await axios.get<any>(`${this.graphUrl}/${request.media_id}/insights`, {
        params
      });

      const insights = this.parseMediaInsights(response.data.data);

      logger.info('Media insights fetched successfully', {
        mediaId: request.media_id,
        metricsCount: response.data.data.length
      });

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      logger.error('Failed to fetch media insights', {
        mediaId: request.media_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media insights'
      };
    }
  }

  /**
   * Get story insights
   */
  async getStoryInsights(request: StoryInsightsRequest): Promise<StoryInsightsResponse> {
    try {
      const params = {
        metric: request.metric.join(','),
        access_token: request.access_token
      };

      logger.info('Fetching story insights', {
        storyId: request.story_id,
        metrics: request.metric
      });

      const response = await axios.get<any>(`${this.graphUrl}/${request.story_id}/insights`, {
        params
      });

      const insights = this.parseStoryInsights(response.data.data);

      logger.info('Story insights fetched successfully', {
        storyId: request.story_id,
        metricsCount: response.data.data.length
      });

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      logger.error('Failed to fetch story insights', {
        storyId: request.story_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch story insights'
      };
    }
  }

  /**
   * Get audience insights
   */
  async getAudienceInsights(request: AudienceInsightsRequest): Promise<AudienceInsightsResponse> {
    try {
      const params = {
        metric: request.metric.join(','),
        period: request.period,
        breakdown: request.breakdown.join(','),
        access_token: request.access_token,
        ...(request.since && { since: request.since }),
        ...(request.until && { until: request.until })
      };

      logger.info('Fetching audience insights', {
        metrics: request.metric,
        breakdown: request.breakdown,
        period: request.period
      });

      const response = await axios.get<any>(`${this.graphUrl}/me/insights`, {
        params
      });

      const insights = this.parseAudienceInsights(response.data.data);

      logger.info('Audience insights fetched successfully', {
        metricsCount: response.data.data.length
      });

      return {
        success: true,
        data: insights
      };
    } catch (error) {
      logger.error('Failed to fetch audience insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audience insights'
      };
    }
  }

  /**
   * Get comprehensive insights summary
   */
  async getInsightsSummary(request: InsightsSummaryRequest): Promise<{
    success: boolean;
    data?: InsightsSummary;
    error?: string;
  }> {
    try {
      logger.info('Generating insights summary', {
        period: request.period,
        since: request.since,
        until: request.until
      });

      // Fetch account insights
      const accountInsights = await this.getAccountInsights({
        access_token: request.access_token,
        metric: [
          'reach',
          'impressions',
          'follower_count'
        ],
        period: request.period,
        since: request.since,
        until: request.until
      });

      // Fetch audience insights
      const audienceInsights = await this.getAudienceInsights({
        access_token: request.access_token,
        metric: ['audience_gender_age', 'audience_country', 'audience_city', 'audience_locale'],
        breakdown: ['age', 'gender', 'country', 'city', 'locale'],
        period: request.period,
        since: request.since,
        until: request.until
      });

      if (!accountInsights.success || !audienceInsights.success) {
        throw new Error('Failed to fetch required insights data');
      }

      const summary = this.generateSummary(
        accountInsights.data!,
        audienceInsights.data!,
        request
      );

      logger.info('Insights summary generated successfully');

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      logger.error('Failed to generate insights summary', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights summary'
      };
    }
  }

  /**
   * Parse account insights from API response
   */
  private parseAccountInsights(data: InsightMetric[]): AccountInsights {
    const insights: Partial<AccountInsights> = {};

    data.forEach(metric => {
      const latestValue = metric.values[metric.values.length - 1]?.value || 0;
      
      switch (metric.name) {
        case 'reach':
          insights.reach = latestValue;
          break;
        case 'impressions':
          insights.impressions = latestValue;
          break;
        case 'follower_count':
          insights.follower_count = latestValue;
          break;
      }
    });

    return insights as AccountInsights;
  }

  /**
   * Parse media insights from API response
   */
  private parseMediaInsights(data: InsightMetric[]): MediaInsights {
    const insights: Partial<MediaInsights> = {};

    data.forEach(metric => {
      const latestValue = metric.values[metric.values.length - 1]?.value || 0;
      
      switch (metric.name) {
        case 'reach':
          insights.reach = latestValue;
          break;
        case 'impressions':
          insights.impressions = latestValue;
          break;
        case 'likes':
          insights.likes = latestValue;
          break;
        case 'comments':
          insights.comments = latestValue;
          break;
        case 'shares':
          insights.shares = latestValue;
          break;
        case 'saves':
          insights.saves = latestValue;
          break;
        case 'video_views':
          insights.video_views = latestValue;
          break;
        case 'profile_visits':
          insights.profile_visits = latestValue;
          break;
        case 'website_clicks':
          insights.website_clicks = latestValue;
          break;
        case 'follows':
          insights.follows = latestValue;
          break;
      }
    });

    return insights as MediaInsights;
  }

  /**
   * Parse story insights from API response
   */
  private parseStoryInsights(data: InsightMetric[]): StoryInsights {
    const insights: Partial<StoryInsights> = {};

    data.forEach(metric => {
      const latestValue = metric.values[metric.values.length - 1]?.value || 0;
      
      switch (metric.name) {
        case 'reach':
          insights.reach = latestValue;
          break;
        case 'impressions':
          insights.impressions = latestValue;
          break;
        case 'replies':
          insights.replies = latestValue;
          break;
        case 'taps_forward':
          insights.taps_forward = latestValue;
          break;
        case 'taps_back':
          insights.taps_back = latestValue;
          break;
        case 'exits':
          insights.exits = latestValue;
          break;
        case 'profile_visits':
          insights.profile_visits = latestValue;
          break;
        case 'website_clicks':
          insights.website_clicks = latestValue;
          break;
        case 'follows':
          insights.follows = latestValue;
          break;
      }
    });

    return insights as StoryInsights;
  }

  /**
   * Parse audience insights from API response
   */
  private parseAudienceInsights(data: InsightMetric[]): AudienceInsights {
    const insights: Partial<AudienceInsights> = {
      age_gender: {},
      countries: {},
      cities: {},
      locale: {}
    };

    data.forEach(metric => {
      // This would need to be implemented based on actual API response structure
      // The Instagram API returns complex nested data for audience insights
    });

    return insights as AudienceInsights;
  }

  /**
   * Generate comprehensive summary
   */
  private generateSummary(
    accountInsights: AccountInsights,
    audienceInsights: AudienceInsights,
    request: InsightsSummaryRequest
  ): InsightsSummary {
    const engagementRate = accountInsights.impressions > 0 
      ? ((accountInsights.reach / accountInsights.impressions) * 100)
      : 0;

    return {
      account: {
        totalReach: accountInsights.reach,
        totalImpressions: accountInsights.impressions,
        followerCount: accountInsights.follower_count,
        followerGrowth: 0, // Would need historical data to calculate
        engagementRate: Math.round(engagementRate * 100) / 100
      },
      content: {
        totalPosts: 0, // Would need to fetch media count
        averageReach: 0,
        averageImpressions: 0,
        averageLikes: 0,
        averageComments: 0
      },
      audience: {
        topCountries: Object.keys(audienceInsights.countries).slice(0, 5),
        topCities: Object.keys(audienceInsights.cities).slice(0, 5),
        primaryAgeGroup: '25-34', // Would calculate from age_gender data
        genderSplit: {
          male: 0,
          female: 0,
          unknown: 0
        }
      },
      period: {
        start: request.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: request.until || new Date().toISOString(),
        days: 7 // Would calculate based on actual period
      }
    };
  }
}

export const instagramInsightsService = new InstagramInsightsService();