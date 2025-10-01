'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackRoute?: string;
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackRoute = '/login' 
}: RoleProtectedRouteProps) {
  const { user, userProfile, loading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we have definitive information
    if (!loading && !profileLoading) {
      if (!user) {
        router.push(fallbackRoute);
        return;
      }

      if (userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to appropriate dashboard based on user role
        const dashboardRoute = userProfile.dashboard_route;
        router.push(dashboardRoute);
        return;
      }
    }
  }, [user, userProfile, loading, profileLoading, allowedRoles, fallbackRoute, router]);

  // Show loading only for initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If profile is still loading, show children but with a warning
  if (profileLoading) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Loading user permissions...
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push(userProfile.dashboard_route)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
