'use client';

import { useAuth } from '@/contexts/AuthContext';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import { UserRole } from '@/types/user';

export default function MPODashboard() {
  const { userProfile } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['mpo']}>
      <div className="min-h-screen bg-gray-50">
        {/* MPO Header */}
        <div className="bg-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">👤</span>
                <div>
                  <h1 className="text-2xl font-bold">MPO Dashboard</h1>
                  <p className="text-purple-100">Welcome, {userProfile?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-100">Medical Promotion Officer</p>
                <p className="text-xs text-purple-200">{userProfile?.branch_name || 'Field Sales'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MPO Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900">$2,450</p>
                  <p className="text-sm text-green-600 mt-1">+12% vs yesterday</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visits Today</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-blue-600 mt-1">Target: 10</p>
                </div>
                <div className="text-3xl">🏥</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-purple-600 mt-1">In your territory</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders Pending</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-orange-600 mt-1">Awaiting approval</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>
          </div>

          {/* MPO Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <p className="text-sm font-medium">New Order</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">👥</div>
                    <p className="text-sm font-medium">View Customers</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm font-medium">Sales Report</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <p className="text-sm font-medium">Check-in</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">ABC Pharmacy</p>
                      <p className="text-sm text-gray-600">9:00 AM - Product presentation</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">XYZ Health Store</p>
                      <p className="text-sm text-gray-600">11:00 AM - Order collection</p>
                      <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Wellness Center</p>
                      <p className="text-sm text-gray-600">2:00 PM - Follow-up visit</p>
                      <p className="text-xs text-gray-500">Upcoming</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Health Plus</p>
                      <p className="text-sm text-gray-600">4:00 PM - New product launch</p>
                      <p className="text-xs text-gray-500">Upcoming</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <p className="text-sm text-gray-600 mt-1">Monthly Target</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">92%</div>
                  <p className="text-sm text-gray-600 mt-1">Visit Completion</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">4.8</div>
                  <p className="text-sm text-gray-600 mt-1">Customer Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
