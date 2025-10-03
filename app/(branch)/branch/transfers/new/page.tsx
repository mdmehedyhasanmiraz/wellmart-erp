'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function BranchNewTransferPage() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Transfer</h1>
          <p className="text-gray-600">Create a stock transfer from your branch.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-700">
          Source Branch: <span className="font-medium">{userProfile?.branch_name || 'N/A'}</span>
        </p>
        <div className="mt-4 text-gray-500 text-sm">Transfer form UI goes here.</div>
      </div>
    </div>
  );
}


