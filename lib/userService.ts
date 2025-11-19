import { supabase } from './supabase';
import { User, UserRole, Branch, CreateUserData, UpdateUserData, DASHBOARD_ROUTES, UserProfile } from '@/types/user';
import { userProfileCache } from './userProfileCache';
import { ProfilePerformanceMonitor } from './profilePerformanceMonitor';

// Types for Supabase query results
interface UserWithBranch {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branches: {
    id: string;
    name: string;
    code: string;
  }[];
}

interface UserBasic {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseQueryResult<T> {
  data: T | null;
  error: Error | null;
}

export class UserService {
  // Get user profile with role information - CACHE-FIRST PERFORMANCE VERSION
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return ProfilePerformanceMonitor.measureAsync('getUserProfile', async () => {
      // ALWAYS check cache first - prioritize performance over freshness
      const cachedProfile = userProfileCache.getFromCacheOnly(userId);
      if (cachedProfile) {
        console.log('🚀 User profile loaded from cache (performance priority)');
        return cachedProfile;
      }

      // Only fetch from database if absolutely no cache exists
      console.log('⚠️ No cache found, fetching from database (optimized for speed)');
      
      try {
        const profile = await this.fastDatabaseFetch(userId);
        
        if (profile) {
          // Cache the profile for 24 hours (performance priority)
          userProfileCache.set(userId, profile);
          console.log('✅ User profile fetched and cached successfully');
          return profile;
        }
        
        return null;
      } catch (error) {
        console.error('Error in getUserProfile:', error);
        return null;
      }
    });
  }

  // ULTRA-FAST database fetch with fallback (for cache misses)
  private static async fastDatabaseFetch(userId: string): Promise<UserProfile | null> {
    try {
      // Method 1: Try optimized join query first (with timeout)
      const startTime = performance.now();
      
      const queryPromise = supabase
        .from('users')
        .select(`
          id, 
          name, 
          email, 
          role, 
          branch_id, 
          is_active, 
          created_at, 
          updated_at,
          branches!inner (
            id,
            name,
            code
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 2000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as SupabaseQueryResult<UserWithBranch>;

      const queryTime = performance.now() - startTime;
      
      if (!error && data) {
        console.log(`⚡ Join query completed in ${queryTime.toFixed(2)}ms`);
        
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          branch_id: data.branch_id,
          branch_name: (data.branches as { name: string }[] | null)?.[0]?.name || undefined,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
          permissions: UserService.getUserPermissions(data.role as UserRole),
          dashboard_route: DASHBOARD_ROUTES[data.role as UserRole]
        };

        return profile;
      }

      // Method 2: Fallback to simple user query (faster, no joins)
      console.log('🔄 Join query failed, trying ultra-fast simple query...');
      const fallbackStartTime = performance.now();
      
      const simpleQueryPromise = supabase
        .from('users')
        .select('id, name, email, role, branch_id, is_active, created_at, updated_at')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      const simpleTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Simple query timeout')), 1000)
      );

      const simpleResult = await Promise.race([simpleQueryPromise, simpleTimeoutPromise]);
      const { data: userData, error: userError } = simpleResult as SupabaseQueryResult<UserBasic>;

      const fallbackTime = performance.now() - fallbackStartTime;
      
      if (userError || !userData) {
        console.error('Both queries failed:', userError);
        return null;
      }

      console.log(`⚡ Ultra-fast fallback query completed in ${fallbackTime.toFixed(2)}ms`);

      // Build profile without branch info (faster)
      const profile: UserProfile = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        branch_id: userData.branch_id,
        branch_name: undefined, // Will be populated later if needed
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        permissions: UserService.getUserPermissions(userData.role as UserRole),
        dashboard_route: DASHBOARD_ROUTES[userData.role as UserRole]
      };

      return profile;
      
    } catch (error) {
      console.error('Fast database fetch error:', error);
      return null;
    }
  }

  // Batch preload multiple user profiles for ultra-fast performance
  static async batchPreloadProfiles(userIds: string[]): Promise<UserProfile[]> {
    return ProfilePerformanceMonitor.measureAsync('batchPreloadProfiles', async () => {
      console.log(`🔄 Batch preloading ${userIds.length} user profiles...`);
      
      const profiles: UserProfile[] = [];
      const uncachedIds: string[] = [];
      
      // Check cache first for all users
      for (const userId of userIds) {
        const cached = userProfileCache.getFromCacheOnly(userId);
        if (cached) {
          profiles.push(cached);
        } else {
          uncachedIds.push(userId);
        }
      }
      
      if (uncachedIds.length === 0) {
        console.log('🚀 All profiles found in cache');
        return profiles;
      }
      
      console.log(`⚡ Fetching ${uncachedIds.length} profiles from database...`);
      
      // Batch fetch uncached profiles
      const batchPromises = uncachedIds.map(async (userId) => {
        try {
          const profile = await this.fastDatabaseFetch(userId);
          if (profile) {
            userProfileCache.set(userId, profile);
            return profile;
          }
          return null;
        } catch (error) {
          console.error(`Error preloading profile for ${userId}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validProfiles = batchResults.filter((profile): profile is UserProfile => profile !== null);
      
      profiles.push(...validProfiles);
      
      console.log(`✅ Batch preload completed: ${profiles.length}/${userIds.length} profiles loaded`);
      return profiles;
    });
  }

  // Preload user profile into cache for better performance
  static async preloadUserProfile(userId: string): Promise<UserProfile | null> {
    return ProfilePerformanceMonitor.measureAsync('preloadUserProfile', async () => {
      // Check if already in cache
      const cachedProfile = userProfileCache.getFromCacheOnly(userId);
      if (cachedProfile) {
        console.log('🚀 Profile already cached, no preload needed');
        return cachedProfile;
      }

      console.log('🔄 Preloading user profile into cache...');
      return await this.getUserProfile(userId);
    });
  }

  // Force refresh user profile from database (bypass cache)
  static async refreshUserProfile(userId: string): Promise<UserProfile | null> {
    return ProfilePerformanceMonitor.measureAsync('refreshUserProfile', async () => {
      console.log('🔄 Force refreshing user profile from database...');
      
      // Clear cache first
      userProfileCache.clear(userId);
      
      // Fetch fresh from database
      return await this.getUserProfile(userId);
    });
  }

  // Check if user has specific role
  static async userHasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('user_has_role', { user_id: userId, required_role: role });

      if (error) {
        console.error('Error checking user role:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in userHasRole:', error);
      return false;
    }
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('Fetching all users...');
      
      // First try to get users without the join to see if that works
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      if (!usersData || usersData.length === 0) {
        console.log('No users found');
        return [];
      }

      console.log(`Found ${usersData.length} users`);

      // Now try to get branch information for users that have branch_id
      const usersWithBranches = await Promise.all(
        usersData.map(async (user) => {
          if (user.branch_id) {
            try {
              const { data: branchData } = await supabase
                .from('branches')
                .select('id, name, code')
                .eq('id', user.branch_id)
                .single();
              
              return {
                ...user,
                branch_name: branchData?.name || null,
                branches: branchData ? {
                  id: branchData.id,
                  name: branchData.name,
                  code: branchData.code
                } : null
              };
            } catch (branchError) {
              console.warn(`Could not fetch branch for user ${user.id}:`, branchError);
              return {
                ...user,
                branch_name: null,
                branches: null
              };
            }
          }
          
          return {
            ...user,
            branch_name: null,
            branches: null
          };
        })
      );

      console.log('Successfully processed all users');
      return usersWithBranches;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  // Get users by role
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      console.log(`Fetching users with role: ${role}`);
      
      // First get users by role without join
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return [];
      }

      if (!usersData || usersData.length === 0) {
        console.log(`No users found with role: ${role}`);
        return [];
      }

      console.log(`Found ${usersData.length} users with role: ${role}`);

      // Get branch information for users that have branch_id
      const usersWithBranches = await Promise.all(
        usersData.map(async (user) => {
          if (user.branch_id) {
            try {
              const { data: branchData } = await supabase
                .from('branches')
                .select('id, name, code')
                .eq('id', user.branch_id)
                .single();
              
              return {
                ...user,
                branch_name: branchData?.name || null,
                branches: branchData ? {
                  id: branchData.id,
                  name: branchData.name,
                  code: branchData.code
                } : null
              };
            } catch (branchError) {
              console.warn(`Could not fetch branch for user ${user.id}:`, branchError);
              return {
                ...user,
                branch_name: null,
                branches: null
              };
            }
          }
          
          return {
            ...user,
            branch_name: null,
            branches: null
          };
        })
      );

      return usersWithBranches;
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return [];
    }
  }

  // Create new user (Admin only)
  static async createUser(userData: CreateUserData): Promise<User | null> {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        let msg: { error?: string } | null = null;
        try {
          msg = await res.json();
        } catch {}
        const errorMsg = msg?.error || res.statusText || 'Failed to create user';
        console.error('Admin user creation failed:', errorMsg);
        // Throw error so it can be caught by the UI
        throw new Error(errorMsg);
      }
      const json = await res.json();
      const createdId = json?.user?.id as string | undefined;
      if (!createdId) return null;
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = await this.getUserProfile(createdId);
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      return null;
    }
  }

  // Update user
  static async updateUser(userId: string, userData: UpdateUserData): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return null;
    }
  }

  // Deactivate user
  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deactivateUser:', error);
      return false;
    }
  }

  // Get all branches
  static async getAllBranches(): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching branches:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getAllBranches:', error);
      return [];
    }
  }

  // Get user's dashboard route based on role
  static getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'branch':
        return '/branch';
      case 'employee':
        return '/employee';
      default:
        return '/';
    }
  }

  // Update user password (Admin only)
  static async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/admin/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update password' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user password:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Get user permissions based on role
  static getUserPermissions(role: UserRole): string[] {
    switch (role) {
      case 'admin':
        return [
          'view_all_users',
          'create_users',
          'update_users',
          'delete_users',
          'manage_branches',
          'view_all_reports',
          'manage_inventory',
          'manage_sales',
          'manage_purchases',
          'manage_customers',
          'manage_suppliers'
        ];
      case 'branch':
        return [
          'view_branch_users',
          'view_branch_reports',
          'manage_branch_inventory',
          'manage_branch_sales',
          'view_branch_customers',
          'view_branch_suppliers'
        ];
      case 'employee':
        return [
          'view_own_profile',
          'view_assigned_customers',
          'create_sales_orders',
          'view_sales_reports'
        ];
      default:
        return [];
    }
  }
}
