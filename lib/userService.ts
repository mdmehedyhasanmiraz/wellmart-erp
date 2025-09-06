import { supabase } from './supabase';
import { User, UserRole, Branch, CreateUserData, UpdateUserData } from '@/types/user';

export class UserService {
  // Get user profile with role information
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId })
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
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
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          branches (
            id,
            name,
            code
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data.map(user => ({
        ...user,
        branch_name: user.branches?.name
      }));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  // Get users by role
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          branches (
            id,
            name,
            code
          )
        `)
        .eq('role', role)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users by role:', error);
        return [];
      }

      return data.map(user => ({
        ...user,
        branch_name: user.branches?.name
      }));
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return [];
    }
  }

  // Create new user (Admin only)
  static async createUser(userData: CreateUserData): Promise<User | null> {
    try {
      // First create auth user (Admin only operation)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'TempPassword123!', // User must change on first login
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return null;
      }

      // The trigger will automatically create the user profile
      // Let's wait a moment and then fetch the created user
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = await this.getUserProfile(authData.user.id);
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
      case 'mpo':
        return '/mpo/dashboard';
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
      case 'mpo':
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
