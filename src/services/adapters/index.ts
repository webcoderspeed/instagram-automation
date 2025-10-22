/**
 * Social Media Adapters Index
 * 
 * Centralized exports and factory for all social media platform adapters.
 * This file provides a clean interface for creating and managing adapters.
 */

import { BaseSocialMediaAdapter } from './base.adapter';
import { InstagramAdapter } from './instagram.adapter';
import { Platform } from '../../validators/platform.validator';

// Export all adapters
export { BaseSocialMediaAdapter } from './base.adapter';
export { InstagramAdapter } from './instagram.adapter';

// Export all types and interfaces
export * from './base.adapter';

/**
 * Adapter Factory
 * 
 * Creates the appropriate adapter instance based on the platform.
 * This factory pattern makes it easy to add new platforms without
 * changing existing code.
 */
export class AdapterFactory {
  private static adapters = new Map<Platform, () => BaseSocialMediaAdapter>();

  static {
    // Register all available adapters
    this.registerAdapter('instagram', () => new InstagramAdapter());
    
    // Future platforms can be registered here:
    // this.registerAdapter('facebook', () => new FacebookAdapter());
    // this.registerAdapter('twitter', () => new TwitterAdapter());
    // this.registerAdapter('linkedin', () => new LinkedInAdapter());
    // this.registerAdapter('tiktok', () => new TikTokAdapter());
    // this.registerAdapter('youtube', () => new YouTubeAdapter());
  }

  /**
   * Register a new adapter for a platform
   */
  static registerAdapter(platform: Platform, factory: () => BaseSocialMediaAdapter): void {
    this.adapters.set(platform, factory);
  }

  /**
   * Create an adapter instance for the specified platform
   */
  static createAdapter(platform: Platform): BaseSocialMediaAdapter {
    const factory = this.adapters.get(platform);
    
    if (!factory) {
      throw new Error(`No adapter available for platform: ${platform}`);
    }

    return factory();
  }

  /**
   * Get all supported platforms
   */
  static getSupportedPlatforms(): Platform[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a platform is supported
   */
  static isPlatformSupported(platform: Platform): boolean {
    return this.adapters.has(platform);
  }
}

/**
 * Convenience function to create an adapter
 */
export function createAdapter(platform: Platform): BaseSocialMediaAdapter {
  return AdapterFactory.createAdapter(platform);
}

/**
 * Get all supported platforms
 */
export function getSupportedPlatforms(): Platform[] {
  return AdapterFactory.getSupportedPlatforms();
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: Platform): boolean {
  return AdapterFactory.isPlatformSupported(platform);
}