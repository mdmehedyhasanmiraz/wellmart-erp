'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserRole, UserProfile, DASHBOARD_ROUTES } from '@/types/user';
import { UserService } from '@/lib/userService';
import { userProfileCache } from '@/lib/userProfileCache';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserProfile = async (userId: string, retries = 3): Promise<void> => {
    // Check if we already have a profile for this user
    if (userProfile && userProfile.id === userId) {
      console.log('User profile already loaded, skipping fetch');
      return;
    }

    setProfileLoading(true);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching user profile (attempt ${attempt}/${retries})`);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const profilePromise = UserService.getUserProfile(userId);
        const profile = await Promise.race([profilePromise, timeoutPromise]) as User | null;
        
        if (profile) {
          const permissions = UserService.getUserPermissions(profile.role);
          const dashboardRoute = DASHBOARD_ROUTES[profile.role];

          setUserProfile({
            ...profile,
            permissions,
            dashboard_route: dashboardRoute
          });
          console.log('User profile fetched successfully');
          setProfileLoading(false);
          return; // Success, exit retry loop
        } else {
          console.error('getUserProfile returned null - database may be unavailable');
          // Don't create fallback profile, just set loading to false
          // This will prevent redirects and allow the user to stay on current page
          setProfileLoading(false);
          return;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching user profile (attempt ${attempt}/${retries}):`, errorMessage);
        
        // If it's a timeout error and we have more retries, continue
        if (errorMessage === 'Request timeout' && attempt < retries) {
          console.log(`Timeout on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        if (attempt === retries) {
          console.error('Failed to fetch user profile after all retries');
          
          // DON'T create fallback user profile - this causes wrong role assignment
          // Instead, just set loading to false and let the user stay on current page
          console.log('Database unavailable - keeping user on current page without profile');
          setProfileLoading(false);
          return; // Exit the retry loop
        } else {
          // Wait before retry for non-timeout errors
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    setProfileLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Starting sign in process');
      
      // Add timeout to sign in
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 15000)
      );
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Sign in successful, fetching profile');
        // Fetch user profile after successful login
        await fetchUserProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error or timeout occurred' };
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      // Clear user profile cache
      if (user) {
        userProfileCache.clear(user.id);
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    profileLoading,
    signIn,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
