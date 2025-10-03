'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function BranchAddStockPage() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
        <p className="text-gray-600">Receive stock into your branch inventory.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-700">
          Branch: <span className="font-medium">{userProfile?.branch_name || 'N/A'}</span>
        </p>
        <div className="mt-4 text-gray-500 text-sm">
          Add stock form UI goes here. Ensure branch_id is attached to transactions.
        </div>
      </div>
    </div>
  );
}


