'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function BranchProductsPage() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600">View products available to your branch. This section is read-only.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-700">
          Branch: <span className="font-medium">{userProfile?.branch_name || 'N/A'}</span>
        </p>
        <div className="mt-4 text-gray-500 text-sm">
          Product list UI goes here. Editing is disabled for branch role.
        </div>
      </div>
    </div>
  );
}


