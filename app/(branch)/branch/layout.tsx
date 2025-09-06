'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BranchSidebar from './components/BranchSidebar';

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile && userProfile.role !== 'branch') {
        router.push(userProfile.dashboard_route);
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-gray-700 text-lg">Loading Branch Panel...</p>
        </div>
      </div>
    );
  }

  if (!user || (userProfile && userProfile.role !== 'branch')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <BranchSidebar />
        <main className="flex-1 ml-72">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
