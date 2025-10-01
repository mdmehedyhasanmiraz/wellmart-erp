import { supabase } from './supabase';

export const testUserTable = async (): Promise<{ success: boolean; error?: string; userCount?: number }> => {
  try {
    console.log('Testing user table access...');
    
    // Simple count query to test table access
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('User table test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`User table test successful. Found ${count} users.`);
    return { success: true, userCount: count || 0 };
  } catch (error) {
    console.error('User table test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const testUserById = async (userId: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    console.log(`Testing user fetch by ID: ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('User by ID test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('User by ID test successful:', data);
    return { success: true, user: data };
  } catch (error) {
    console.error('User by ID test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
