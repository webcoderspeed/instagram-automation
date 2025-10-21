/**
 * Instagram OAuth API Endpoints
 */

export const INSTAGRAM_OAUTH_ENDPOINTS = {
  AUTHORIZATION: 'https://www.instagram.com/oauth/authorize',
  TOKEN_EXCHANGE: 'https://api.instagram.com/oauth/access_token',
  LONG_LIVED_TOKEN: 'https://graph.instagram.com/access_token',
  REFRESH_TOKEN: 'https://graph.instagram.com/refresh_access_token',
  USER_INFO: 'https://graph.instagram.com/me'
} as const;

export const INSTAGRAM_GRAPH_API_BASE = 'https://graph.instagram.com';
export const INSTAGRAM_API_VERSION = 'v24.0';

export type OAuthEndpoint = typeof INSTAGRAM_OAUTH_ENDPOINTS[keyof typeof INSTAGRAM_OAUTH_ENDPOINTS];

export interface EndpointConfig {
  url: string;
  method: 'GET' | 'POST';
  contentType?: string;
  requiresAuth?: boolean;
}

export const ENDPOINT_CONFIGS: Record<string, EndpointConfig> = {
  authorization: {
    url: INSTAGRAM_OAUTH_ENDPOINTS.AUTHORIZATION,
    method: 'GET'
  },
  tokenExchange: {
    url: INSTAGRAM_OAUTH_ENDPOINTS.TOKEN_EXCHANGE,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded'
  },
  longLivedToken: {
    url: INSTAGRAM_OAUTH_ENDPOINTS.LONG_LIVED_TOKEN,
    method: 'GET'
  },
  refreshToken: {
    url: INSTAGRAM_OAUTH_ENDPOINTS.REFRESH_TOKEN,
    method: 'GET',
    requiresAuth: true
  },
  userInfo: {
    url: INSTAGRAM_OAUTH_ENDPOINTS.USER_INFO,
    method: 'GET',
    requiresAuth: true
  }
};