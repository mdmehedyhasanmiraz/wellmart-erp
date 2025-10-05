'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Branch } from '@/types/user';
import { BranchService } from '@/lib/branchService';

export default function BranchSettingsPage() {
  const { userProfile } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranchDetails = async () => {
      if (!userProfile?.branch_id) {
        setLoading(false);
        return;
      }
      
      try {
        const branchData = await BranchService.getById(userProfile.branch_id);
        setBranch(branchData);
      } catch (error) {
        console.error('Error loading branch details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranchDetails();
  }, [userProfile?.branch_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">View your profile and branch information.</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
            <div className="text-gray-900">{userProfile?.name || '—'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <div className="text-gray-900">{userProfile?.email || '—'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
            <div className="text-gray-900 capitalize">{userProfile?.role || '—'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                userProfile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userProfile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Information Section */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Information</h2>
        {!userProfile?.branch_id ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No branch assigned</div>
            <div className="text-sm text-gray-400">Contact your administrator to assign a branch to your account.</div>
          </div>
        ) : branch ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Branch Name</label>
              <div className="text-gray-900 font-medium">{branch.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Branch Code</label>
              <div className="text-gray-900 font-mono">{branch.code}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <div className="text-gray-900">{branch.address || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <div className="text-gray-900">{branch.phone || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <div className="text-gray-900">{branch.email || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Branch Status</label>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
              <div className="text-gray-900">{new Date(branch.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">Branch details not found</div>
            <div className="text-sm text-gray-400">Unable to load branch information.</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="font-medium text-gray-900">Change Password</div>
            <div className="text-sm text-gray-500">Update your account password</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="font-medium text-gray-900">Contact Support</div>
            <div className="text-sm text-gray-500">Get help with your account</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="font-medium text-gray-900">System Info</div>
            <div className="text-sm text-gray-500">View system information</div>
          </button>
        </div>
      </div>
    </div>
  );
}


