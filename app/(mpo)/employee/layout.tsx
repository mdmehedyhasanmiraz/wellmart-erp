'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MPOSidebar from './components/MPOSidebar';
import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function MPOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setIsRedirecting(true);
        router.push('/login');
      } else if (userProfile && userProfile.role !== 'employee') {
        setIsRedirecting(true);
        router.push(userProfile.dashboard_route);
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-700 text-lg">Loading Employee Panel...</p>
        </div>
      </div>
    );
  }

  if (!user || (userProfile && userProfile.role !== 'employee')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <PerformanceMonitor componentName="EmployeeLayout" />
      <div className="flex">
        <MPOSidebar />
        <main className="flex-1 ml-72">
          <div className="p-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
