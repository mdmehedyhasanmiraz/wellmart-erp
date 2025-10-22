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

  const fetchUserProfile = async (userId: string): Promise<void> => {
    // Check if we already have a profile for this user
    if (userProfile && userProfile.id === userId) {
      console.log('User profile already loaded, skipping fetch');
      return;
    }

    // Check cache first
    const cachedProfile = userProfileCache.get(userId);
    if (cachedProfile) {
      console.log('User profile loaded from cache');
      setUserProfile(cachedProfile);
      return;
    }

    setProfileLoading(true);
    
    try {
      console.log('Fetching user profile from database');
      const profile = await UserService.getUserProfile(userId);
      
      if (profile) {
        setUserProfile(profile);
        console.log('User profile fetched successfully');
      } else {
        console.log('No user profile found');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
      return { success: false, error: error instanceof Error ? error.message : 'Network error occurred' };
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
