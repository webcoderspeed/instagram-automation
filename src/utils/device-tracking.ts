/**
 * Device Tracking Utilities
 * Functions for device fingerprinting, IP geolocation, and user agent parsing
 */

import crypto from 'crypto';
import { Request } from 'express';

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = getClientIP(req);
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
  
  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    req.get('X-Client-IP') ||
    'unknown'
  );
}

/**
 * Parse user agent to extract browser and OS info
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Device detection
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  
  return { browser, os, device };
}

/**
 * Location data interface
 */
export interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
  isp: string;
  lat: number;
  lon: number;
}

/**
 * Get location from IP using free ip-api.com service
 */
export async function getLocationFromIP(ip: string): Promise<LocationData | null> {
  // Handle local/private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      country: 'Local',
      region: 'Local',
      city: 'Local',
      timezone: 'Local',
      isp: 'Local Network',
      lat: 0,
      lon: 0
    };
  }

  try {
    // Using ip-api.com free service (15 requests per minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,isp,lat,lon`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.warn(`IP geolocation failed for ${ip}: ${data.message}`);
      return null;
    }
    
    return {
      country: data.country || 'Unknown',
      region: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'Unknown',
      isp: data.isp || 'Unknown',
      lat: data.lat || 0,
      lon: data.lon || 0
    };
  } catch (error) {
    console.error(`Error fetching location for IP ${ip}:`, error);
    return null;
  }
}

/**
 * Format location data for display
 */
export function formatLocationForDisplay(location: LocationData | null): string {
  if (!location) {
    return 'Unknown Location';
  }
  
  const parts = [location.city, location.region, location.country].filter(part => part && part !== 'Unknown');
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
}

/**
 * Check if login is from a suspicious location/device
 */
export function isSuspiciousLogin(
  currentIP: string,
  currentFingerprint: string,
  lastLoginIP?: string,
  trustedDevices: string[] = []
): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check if device is trusted
  if (!trustedDevices.includes(currentFingerprint)) {
    reasons.push('New device detected');
  }
  
  // Check if IP changed significantly (basic check)
  if (lastLoginIP && lastLoginIP !== currentIP && lastLoginIP !== 'unknown') {
    reasons.push('Different IP address');
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Format user agent for display
 */
export function formatUserAgentForDisplay(userAgent: string): string {
  const parsed = parseUserAgent(userAgent);
  return `${parsed.browser} on ${parsed.os} (${parsed.device})`;
}