'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, profileLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        setIsRedirecting(true);
        router.push('/login');
      } else if (userProfile && userProfile.role !== 'admin') {
        setIsRedirecting(true);
        router.push(userProfile.dashboard_route);
      }
    }
  }, [user, userProfile, loading, profileLoading, router]);

  // Show loading only for initial auth check, not for profile loading
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-700 text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Allow rendering even if profile is still loading (show basic UI)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <PerformanceMonitor componentName="AdminLayout" />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-72">
          <div className="p-8 w-full">
            {/* Show profile loading indicator only if needed */}
            {profileLoading && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                  <span className="text-blue-700 text-sm">Loading user profile...</span>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
