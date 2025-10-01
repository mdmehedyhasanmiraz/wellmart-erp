import { supabase } from './supabase';

export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Connection test successful');
    return { success: true };
  } catch (error) {
    console.error('Connection test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
};

export const testAuthConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Supabase auth connection...');
    
    // Test auth service
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Auth connection test successful');
    return { success: true };
  } catch (error) {
    console.error('Auth connection test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown auth connection error' 
    };
  }
};
