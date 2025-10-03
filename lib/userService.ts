import { supabase } from './supabase';
import { User, UserRole, Branch, CreateUserData, UpdateUserData } from '@/types/user';
import { userProfileCache } from './userProfileCache';

export class UserService {
  // Get user profile with role information
  static async getUserProfile(userId: string): Promise<User | null> {
    // Check cache first
    const cachedProfile = userProfileCache.get(userId);
    if (cachedProfile) {
      console.log('User profile loaded from cache');
      return cachedProfile;
    }

    const maxRetries = 2; // Reduced retries
    const retryDelay = 500; // Reduced delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching user profile (attempt ${attempt}/${maxRetries})`);
        
        // Create timeout promise with shorter timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 5000); // Reduced to 5 seconds
        });

        // Try simple query first (without joins) - this should be fast
        const simpleQueryPromise = supabase
          .from('users')
          .select('id, name, email, role, branch_id, is_active, created_at, updated_at') // Only select needed fields
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        const { data, error } = await Promise.race([simpleQueryPromise, timeoutPromise]) as {
          data: Pick<User, 'id' | 'name' | 'email' | 'role' | 'branch_id' | 'is_active' | 'created_at' | 'updated_at'> | null,
          error: { message?: string } | null
        };

        if (error) {
          console.error(`Error fetching user profile (attempt ${attempt}/${maxRetries}):`, error);
          
          if (attempt === maxRetries) {
            console.error('Failed to fetch user profile after all retries');
            // Return a minimal profile to prevent app crashes
            const fallbackProfile = {
              id: userId,
              name: 'Unknown User',
              email: '',
              role: 'user' as UserRole,
              branch_id: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              branch_name: null
            };
            userProfileCache.set(userId, fallbackProfile);
            return fallbackProfile;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }

        if (data) {
          console.log('User profile fetched successfully');
          
          // If we have branch_id, try to get branch name separately (with timeout)
          if (data.branch_id) {
            try {
              const branchTimeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Branch query timeout')), 3000); // 3 second timeout for branch
              });

              const branchQueryPromise = supabase
                .from('branches')
                .select('name')
                .eq('id', data.branch_id)
                .single();
              
              const { data: branchData } = await Promise.race([branchQueryPromise, branchTimeoutPromise]) as { data: { name: string } | null };
              
              const profile = {
                ...data,
                branch_name: branchData?.name
              };
              
              // Cache the profile
              userProfileCache.set(userId, profile);
              return profile;
            } catch (branchError) {
              console.warn('Could not fetch branch name:', branchError);
              const profile = {
                ...data,
                branch_name: null
              };
              userProfileCache.set(userId, profile);
              return profile;
            }
          }
          
          // Cache the profile
          const profile = {
            ...data,
            branch_name: null
          };
          userProfileCache.set(userId, profile);
          return profile;
        }

        throw new Error('No user data returned');
      } catch (error) {
        console.error(`Error in getUserProfile (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          console.error('Failed to fetch user profile after all retries');
          // Return a minimal profile to prevent app crashes
          const fallbackProfile = {
            id: userId,
            name: 'Unknown User',
            email: '',
            role: 'user' as UserRole,
            branch_id: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            branch_name: null
          };
          userProfileCache.set(userId, fallbackProfile);
          return fallbackProfile;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    return null;
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
        let msg: unknown = null;
        try {
          msg = await res.json();
        } catch {}
        console.error('Admin user creation failed:', msg?.error || res.statusText);
        return null;
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
        return '/admin/dashboard';
      case 'branch':
        return '/branch/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/';
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
