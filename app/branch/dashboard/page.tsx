'use client';

import { useAuth } from '@/contexts/AuthContext';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import { UserRole } from '@/types/user';

export default function BranchDashboard() {
  const { userProfile } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['branch']}>
      <div className="min-h-screen bg-gray-50">
        {/* Branch Header */}
        <div className="bg-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏢</span>
                <div>
                  <h1 className="text-2xl font-bold">Branch Dashboard</h1>
                  <p className="text-green-100">Welcome, {userProfile?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-100">Branch Manager</p>
                <p className="text-xs text-green-200">{userProfile?.branch_name || 'Main Branch'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Branch Sales</p>
                  <p className="text-2xl font-bold text-gray-900">$45,230</p>
                  <p className="text-sm text-green-600 mt-1">+8.2% this month</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">MPOs</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-blue-600 mt-1">Active in branch</p>
                </div>
                <div className="text-3xl">👤</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                  <p className="text-sm text-purple-600 mt-1">Active accounts</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-orange-600 mt-1">Items in stock</p>
                </div>
                <div className="text-3xl">📦</div>
              </div>
            </div>
          </div>

          {/* Branch Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Branch Management</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">👤</div>
                    <p className="text-sm font-medium">Manage MPOs</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">👥</div>
                    <p className="text-sm font-medium">View Customers</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <p className="text-sm font-medium">Branch Inventory</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm font-medium">Branch Reports</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New MPO assigned</p>
                      <p className="text-sm text-gray-600">John Doe joined the team</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Sales target achieved</p>
                      <p className="text-sm text-gray-600">Monthly target exceeded by 15%</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Inventory restocked</p>
                      <p className="text-sm text-gray-600">Vitamin D3 1000IU - 500 units</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
