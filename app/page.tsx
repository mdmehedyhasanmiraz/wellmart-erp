'use client';

import Navigation from './components/Navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

           useEffect(() => {
           if (!loading) {
             if (!user) {
               router.push('/login');
             } else if (userProfile) {
               // Redirect to role-specific dashboard
               if (userProfile.role === 'admin') {
                 router.push('/admin');
               } else if (userProfile.role === 'branch') {
                 router.push('/branch');
               } else if (userProfile.role === 'mpo') {
                 router.push('/mpo');
               } else {
                 router.push('/login');
               }
             }
           }
         }, [user, userProfile, loading, router]);
  const stats = [
    { title: 'Total Sales', value: '$125,430', change: '+12.5%', icon: '💰' },
    { title: 'Inventory Items', value: '2,847', change: '+3.2%', icon: '📦' },
    { title: 'Active Customers', value: '1,234', change: '+8.1%', icon: '👥' },
    { title: 'Pending Orders', value: '47', change: '-2.3%', icon: '📋' },
  ];

  const recentActivities = [
    { id: 1, action: 'New order received', customer: 'ABC Pharmacy', amount: '$2,450', time: '2 hours ago' },
    { id: 2, action: 'Inventory updated', item: 'Vitamin D3 1000IU', quantity: '500 units', time: '4 hours ago' },
    { id: 3, action: 'Payment received', customer: 'XYZ Health Store', amount: '$1,890', time: '6 hours ago' },
    { id: 4, action: 'New supplier added', supplier: 'NutriLife Suppliers', time: '1 day ago' },
  ];

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to Wellmart ERP - Wellcare Nutriscience Ltd</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        {activity.customer && `${activity.customer} - `}
                        {activity.item && `${activity.item} - `}
                        {activity.supplier && `${activity.supplier} - `}
                        {activity.amount && `${activity.amount} - `}
                        {activity.quantity && `${activity.quantity} - `}
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">📦</div>
                  <p className="text-sm font-medium">Add Inventory</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">💰</div>
                  <p className="text-sm font-medium">Create Sale</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="text-sm font-medium">Add Customer</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">📈</div>
                  <p className="text-sm font-medium">View Reports</p>
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    </ProtectedRoute>
  );
}
