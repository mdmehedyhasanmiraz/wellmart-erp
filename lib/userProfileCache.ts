// Enhanced in-memory cache for user profiles with better performance
import type { UserProfile } from '@/types/user'

class UserProfileCache {
  private cache = new Map<string, { profile: UserProfile; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - prioritize cache performance
  private readonly MAX_CACHE_SIZE = 100; // Increased cache size

  set(userId: string, profile: UserProfile): void {
    // If cache is getting too large, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(userId, {
      profile,
      timestamp: Date.now()
    });
  }

  get(userId: string): UserProfile | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(userId);
      return null;
    }

    return cached.profile;
  }

  clear(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  has(userId: string): boolean {
    const cached = this.cache.get(userId);
    if (!cached) return false;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(userId);
      return false;
    }

    return true;
  }

  // Get cache statistics for debugging
  getStats(): { size: number; maxSize: number; duration: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      duration: this.CACHE_DURATION
    };
  }

  // Force get from cache without expiration check (for performance priority)
  getFromCacheOnly(userId: string): UserProfile | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    // Return cached profile regardless of expiration for performance
    return cached.profile;
  }

  // Check if profile exists in cache (regardless of expiration)
  hasInCache(userId: string): boolean {
    return this.cache.has(userId);
  }

  // Preload profile if not in cache
  async preload(userId: string, fetchFn: () => Promise<UserProfile | null>): Promise<UserProfile | null> {
    const cached = this.get(userId);
    if (cached) {
      return cached;
    }

    try {
      const profile = await fetchFn();
      if (profile) {
        this.set(userId, profile);
      }
      return profile;
    } catch (error) {
      console.error('Error preloading user profile:', error);
      return null;
    }
  }
}

export const userProfileCache = new UserProfileCache();
