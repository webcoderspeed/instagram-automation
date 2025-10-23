/**
 * Instagram Insights Types
 * Based on Instagram Platform API for analytics and metrics
 */

export interface InsightMetric {
  name: string;
  period: 'day' | 'week' | 'days_28' | 'lifetime';
  values: InsightValue[];
  title: string;
  description: string;
  id: string;
}

export interface InsightValue {
  value: number;
  end_time: string;
}

export interface AccountInsights {
  reach: number;
  impressions: number;
  follower_count: number;
  online_followers?: OnlineFollowers;
}

export interface OnlineFollowers {
  [hour: string]: number; // "0": 123, "1": 456, etc.
}

export interface MediaInsights {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  video_views?: number;
  profile_visits: number;
  website_clicks: number;
  follows: number;
}

export interface StoryInsights {
  reach: number;
  impressions: number;
  replies: number;
  taps_forward: number;
  taps_back: number;
  exits: number;
  profile_visits: number;
  website_clicks: number;
  follows: number;
}

export interface AudienceInsights {
  age_gender: AgeGenderBreakdown;
  countries: CountryBreakdown;
  cities: CityBreakdown;
  locale: LocaleBreakdown;
}

export interface AgeGenderBreakdown {
  [ageRange: string]: {
    male: number;
    female: number;
    unknown: number;
  };
}

export interface CountryBreakdown {
  [countryCode: string]: number;
}

export interface CityBreakdown {
  [cityName: string]: number;
}

export interface LocaleBreakdown {
  [locale: string]: number;
}

export interface InsightsRequest {
  access_token: string;
  metric: string[];
  period: 'day' | 'week' | 'days_28' | 'lifetime';
  since?: string;
  until?: string;
  breakdown?: string[];
}

export interface AccountInsightsRequest extends InsightsRequest {
  metric: [
    'reach',
    'impressions',
    'follower_count'
  ];
}

export interface MediaInsightsRequest extends InsightsRequest {
  media_id: string;
  metric: [
    'reach',
    'impressions',
    'likes',
    'comments',
    'shares',
    'saves',
    'video_views',
    'profile_visits',
    'website_clicks',
    'follows'
  ];
}

export interface StoryInsightsRequest extends InsightsRequest {
  story_id: string;
  metric: [
    'reach',
    'impressions',
    'replies',
    'taps_forward',
    'taps_back',
    'exits',
    'profile_visits',
    'website_clicks',
    'follows'
  ];
}

export interface AudienceInsightsRequest extends InsightsRequest {
  metric: ['audience_gender_age', 'audience_country', 'audience_city', 'audience_locale'];
  breakdown: ['age', 'gender', 'country', 'city', 'locale'];
}

export interface InsightsResponse {
  success: boolean;
  data?: {
    data: InsightMetric[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
    };
  };
  error?: string;
}

export interface AccountInsightsResponse {
  success: boolean;
  data?: AccountInsights;
  error?: string;
}

export interface MediaInsightsResponse {
  success: boolean;
  data?: MediaInsights;
  error?: string;
}

export interface StoryInsightsResponse {
  success: boolean;
  data?: StoryInsights;
  error?: string;
}

export interface AudienceInsightsResponse {
  success: boolean;
  data?: AudienceInsights;
  error?: string;
}

export interface InsightsSummary {
  account: {
    totalReach: number;
    totalImpressions: number;
    followerCount: number;
    followerGrowth: number;
    engagementRate: number;
  };
  content: {
    totalPosts: number;
    averageReach: number;
    averageImpressions: number;
    averageLikes: number;
    averageComments: number;
    topPerformingPost?: string;
  };
  audience: {
    topCountries: string[];
    topCities: string[];
    primaryAgeGroup: string;
    genderSplit: {
      male: number;
      female: number;
      unknown: number;
    };
  };
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface InsightsSummaryRequest {
  access_token: string;
  period: 'day' | 'week' | 'days_28';
  since?: string;
  until?: string;
}