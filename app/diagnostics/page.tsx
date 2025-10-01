'use client';

import { useState } from 'react';
import { testConnection, testAuthConnection } from '@/lib/connectionTest';
import { testUserTable, testUserById } from '@/lib/userTableTest';
import { checkEnvironment } from '@/lib/envCheck';
import { supabase } from '@/lib/supabase';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    try {
      // 1. Environment Check
      addResult('Environment Check', true, 'Starting...');
      const envCheck = checkEnvironment();
      addResult('Environment Check', envCheck.hasUrl && envCheck.hasKey, 
        envCheck.hasUrl && envCheck.hasKey ? 'All environment variables present' : 'Missing environment variables',
        envCheck);

      // 2. Basic Supabase Connection
      addResult('Supabase Connection', true, 'Testing...');
      const connectionTest = await testConnection();
      addResult('Supabase Connection', connectionTest.success, 
        connectionTest.success ? 'Connected successfully' : connectionTest.error || 'Connection failed');

      // 3. Auth Service Test
      addResult('Auth Service', true, 'Testing...');
      const authTest = await testAuthConnection();
      addResult('Auth Service', authTest.success, 
        authTest.success ? 'Auth service available' : authTest.error || 'Auth service failed');

      // 4. User Table Test
      addResult('User Table', true, 'Testing...');
      const userTableTest = await testUserTable();
      addResult('User Table', userTableTest.success, 
        userTableTest.success ? `User table accessible (${userTableTest.userCount} users)` : userTableTest.error || 'User table failed');

      // 5. Test with sample user ID (if we have users)
      if (userTableTest.success && userTableTest.userCount && userTableTest.userCount > 0) {
        addResult('Sample User Fetch', true, 'Testing...');
        const sampleUserTest = await testUserById('00000000-0000-0000-0000-000000000000'); // Dummy ID
        addResult('Sample User Fetch', sampleUserTest.success, 
          sampleUserTest.success ? 'User fetch works' : 'User fetch failed (expected with dummy ID)');
      }

      // 6. Test auth sign in with dummy credentials
      addResult('Auth Sign In Test', true, 'Testing with dummy credentials...');
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        addResult('Auth Sign In Test', true, 
          error ? 'Auth service responding (expected failure with wrong credentials)' : 'Unexpected success');
      } catch (error) {
        addResult('Auth Sign In Test', false, 'Auth sign in test failed');
      }

    } catch (error) {
      addResult('Diagnostic Error', false, `Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase Connection Diagnostics</h1>
            
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </button>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.test}
                    </h3>
                    <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅' : '❌'}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                  {result.data && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  <li>• Verify your Supabase project is active and accessible</li>
                  <li>• Check if your database has the required tables (users, branches)</li>
                  <li>• Ensure Row Level Security (RLS) policies are properly configured</li>
                  <li>• Check browser network tab for detailed error messages</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
