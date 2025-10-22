import { supabase } from './supabase';
import { User, UserRole, Branch, CreateUserData, UpdateUserData, DASHBOARD_ROUTES, UserProfile } from '@/types/user';
import { userProfileCache } from './userProfileCache';
import { ProfilePerformanceMonitor } from './profilePerformanceMonitor';

export class UserService {
  // Get user profile with role information - OPTIMIZED VERSION
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return ProfilePerformanceMonitor.measureAsync('getUserProfile', async () => {
      // Check cache first
      const cachedProfile = userProfileCache.get(userId);
      if (cachedProfile) {
        console.log('User profile loaded from cache');
        return cachedProfile;
      }

      try {
        console.log('Fetching user profile from database');
        
        // Single optimized query with join to get user and branch data in one request
        const { data, error } = await supabase
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
            branches:branch_id (
              id,
              name,
              code
            )
          `)
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }

        if (!data) {
          console.log('No user found with ID:', userId);
          return null;
        }

        // Build profile with branch information
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          branch_id: data.branch_id,
          branch_name: (data.branches as { name: string }[] | null)?.[0]?.name || undefined,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
          permissions: UserService.getUserPermissions(data.role),
          dashboard_route: DASHBOARD_ROUTES[data.role as UserRole]
        };

        // Cache the profile for 5 minutes
        userProfileCache.set(userId, profile);
        console.log('User profile fetched and cached successfully');
        
        return profile;
      } catch (error) {
        console.error('Error in getUserProfile:', error);
        return null;
      }
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
