'use client';

import { useAuth } from '@/contexts/AuthContext';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import { UserRole } from '@/types/user';

export default function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 w-full">
        {/* Admin Header */}
        <div className="bg-red-600 text-white w-full">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">👑</span>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-red-100">Welcome, {userProfile?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-100">Administrator</p>
                <p className="text-xs text-red-200">{userProfile?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-green-600 mt-1">+12 this month</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Branches</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-blue-600 mt-1">All operational</p>
                </div>
                <div className="text-3xl">🏢</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-green-600">99.9%</p>
                  <p className="text-sm text-gray-600 mt-1">Uptime</p>
                </div>
                <div className="text-3xl">💚</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                  <p className="text-sm text-green-600 mt-1">+15% this quarter</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">👤</div>
                    <p className="text-sm font-medium">Add User</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">👥</div>
                    <p className="text-sm font-medium">View Users</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">🏢</div>
                    <p className="text-sm font-medium">Manage Branches</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">⚙️</div>
                    <p className="text-sm font-medium">System Settings</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📊</span>
                      <div>
                        <p className="text-sm font-medium">System Reports</p>
                        <p className="text-xs text-gray-500">View comprehensive reports</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🔒</span>
                      <div>
                        <p className="text-sm font-medium">Security Settings</p>
                        <p className="text-xs text-gray-500">Manage access controls</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">💾</span>
                      <div>
                        <p className="text-sm font-medium">Backup & Restore</p>
                        <p className="text-xs text-gray-500">Data management</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
