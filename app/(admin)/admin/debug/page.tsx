'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '../components/AdminSidebar';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

interface DebugInfo {
  timestamp: string;
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  databaseConnection: boolean;
  databaseLatency: number;
  cacheStatus: {
    hasUser: boolean;
    hasProfile: boolean;
    profileRole?: string;
    profileIsActive?: boolean;
  };
  errors: string[];
}

export default function DebugPage() {
  const { user, userProfile, session, loading, profileLoading, refreshUserProfile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDatabaseConnection = async () => {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const latency = Date.now() - startTime;
      return { success: !error, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { success: false, latency };
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    
    addLog('Starting authentication diagnostics...');
    
    try {
      // Test database connection
      addLog('Testing database connection...');
      const dbTest = await testDatabaseConnection();
      addLog(`Database connection: ${dbTest.success ? 'SUCCESS' : 'FAILED'} (${dbTest.latency}ms)`);
      
        // Test user profile fetch
        if (user) {
          addLog('Testing user profile fetch...');
          const profileStartTime = Date.now();
          try {
            const { error } = await supabase
              .from('users')
              .select('id, name, email, role, branch_id, is_active, created_at, updated_at')
              .eq('id', user.id)
              .eq('is_active', true)
              .single();
            
            const profileLatency = Date.now() - profileStartTime;
            addLog(`User profile fetch: ${error ? 'FAILED' : 'SUCCESS'} (${profileLatency}ms)`);
            if (error) {
              addLog(`Profile fetch error: ${error.message}`);
            }
          } catch (error) {
            addLog(`Profile fetch exception: ${error}`);
          }
        }
      
        // Test branch fetch if user has branch_id
        if (userProfile?.branch_id) {
          addLog('Testing branch fetch...');
          const branchStartTime = Date.now();
          try {
            const { error } = await supabase
              .from('branches')
              .select('name')
              .eq('id', userProfile.branch_id)
              .single();
            
            const branchLatency = Date.now() - branchStartTime;
            addLog(`Branch fetch: ${error ? 'FAILED' : 'SUCCESS'} (${branchLatency}ms)`);
            if (error) {
              addLog(`Branch fetch error: ${error.message}`);
            }
          } catch (error) {
            addLog(`Branch fetch exception: ${error}`);
          }
        }
      
      // Collect debug info
      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role,
          branch_id: user.user_metadata?.branch_id,
          created_at: user.created_at
        } : null,
        userProfile: userProfile ? {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          branch_id: userProfile.branch_id,
          branch_name: userProfile.branch_name,
          is_active: userProfile.is_active,
          dashboard_route: userProfile.dashboard_route,
          permissions: userProfile.permissions
        } : null,
        session: session ? {
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
          expires_at: session.expires_at,
          expires_in: session.expires_in
        } : null,
        loading,
        profileLoading,
        databaseConnection: dbTest.success,
        databaseLatency: dbTest.latency,
        cacheStatus: {
          hasUser: !!user,
          hasProfile: !!userProfile,
          profileRole: userProfile?.role,
          profileIsActive: userProfile?.is_active
        },
        errors: []
      };
      
      setDebugInfo(info);
      addLog('Diagnostics completed successfully');
      
    } catch (error) {
      addLog(`Diagnostics failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = async () => {
    addLog('Clearing user profile cache...');
    try {
      if (user) {
        // Clear cache by refreshing profile
        await refreshUserProfile();
        addLog('Cache cleared and profile refreshed');
      }
    } catch (error) {
      addLog(`Cache clear failed: ${error}`);
    }
  };

  const forceRefresh = async () => {
    addLog('Force refreshing page...');
    window.location.reload();
  };

  useEffect(() => {
    addLog('Debug page loaded');
    addLog(`Current user: ${user ? user.email : 'None'}`);
    addLog(`Current profile: ${userProfile ? `${userProfile.name} (${userProfile.role})` : 'None'}`);
    addLog(`Loading states: auth=${loading}, profile=${profileLoading}`);
  }, [user, userProfile, loading, profileLoading]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Authentication Debug</h1>
            <p className="text-gray-600">Diagnose authentication and database issues</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Control Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Controls</h2>
            <div className="flex space-x-4">
              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg text-white ${
                  isRunning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRunning ? 'Running...' : 'Run Diagnostics'}
              </button>
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Clear Cache
              </button>
              <button
                onClick={forceRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Force Refresh
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Auth Loading:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {loading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Profile Loading:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  profileLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {profileLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">User:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user ? user.email : 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium">Profile Role:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  userProfile?.role === 'admin' ? 'bg-green-100 text-green-800' : 
                  userProfile?.role ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userProfile?.role || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Click &quot;Run Diagnostics&quot; to start.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Test Database</h3>
                <p className="text-sm text-gray-600 mb-3">Test database connectivity and response time</p>
                <button
                  onClick={async () => {
                    addLog('Testing database connection...');
                    const test = await testDatabaseConnection();
                    addLog(`Result: ${test.success ? 'SUCCESS' : 'FAILED'} (${test.latency}ms)`);
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test DB
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Check Session</h3>
                <p className="text-sm text-gray-600 mb-3">Verify current session validity</p>
                <button
                  onClick={() => {
                    addLog('Checking session...');
                    if (session) {
                      addLog(`Session valid: ${session.expires_at > Date.now() / 1000 ? 'YES' : 'NO'}`);
                      addLog(`Expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
                    } else {
                      addLog('No session found');
                    }
                  }}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Check Session
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Profile Refresh</h3>
                <p className="text-sm text-gray-600 mb-3">Force refresh user profile</p>
                <button
                  onClick={async () => {
                    addLog('Refreshing user profile...');
                    try {
                      await refreshUserProfile();
                      addLog('Profile refresh completed');
                    } catch (error) {
                      addLog(`Profile refresh failed: ${error}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Refresh Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
