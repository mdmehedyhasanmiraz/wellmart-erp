// Simple in-memory cache for user profiles
import type { UserProfile } from '@/types/user'

class UserProfileCache {
  private cache = new Map<string, { profile: UserProfile; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(userId: string, profile: UserProfile): void {
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
}

export const userProfileCache = new UserProfileCache();
