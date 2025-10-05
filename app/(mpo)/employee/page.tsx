'use client';

import { useState, useEffect } from 'react';
import { ProductWithDetails, Employee, Designation } from '@/types/user';
import { ProductService } from '@/lib/productService';
import { EmployeeService } from '@/lib/employeeService';
import { useAuth } from '@/contexts/AuthContext';

// Extended Employee interface that includes manager and designation details
interface EmployeeWithDetails extends Employee {
  designation?: Designation;
  manager?: {
    id: string;
    name: string;
    employee_code: string;
    designation?: Designation;
  };
}

export default function MPODashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    pendingOrders: 0,
    monthlyTarget: 0,
  });
  const [recentProducts, setRecentProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null);
  const [manager, setManager] = useState<EmployeeWithDetails['manager'] | null>(null);
  const [reporters, setReporters] = useState<EmployeeWithDetails[]>([]);

  const { userProfile } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    (async () => {
      if (!userProfile?.email) return;
      const supa = (await import('@/lib/supabase')).supabase;
      // 1) Try by email
      const byEmail = await supa
        .from('employees')
        .select(`
          *,
          designation:designation_id(id, name, code, level, department),
          manager:reports_to_employee_id(id, name, employee_code,
            designation:designation_id(id, name))
        `)
        .eq('email', userProfile.email)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      let empData = byEmail.data as EmployeeWithDetails | null;

      // 2) Fallback by name + branch if not found by email
      if (!empData) {
        let query = supa
          .from('employees')
          .select(`
            *,
            designation:designation_id(id, name, code, level, department),
            manager:reports_to_employee_id(id, name, employee_code,
              designation:designation_id(id, name))
          `)
          .ilike('name', userProfile.name || '')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (userProfile.branch_id) {
          query = query.eq('branch_id', userProfile.branch_id);
        }
        const byName = await query.maybeSingle();
        empData = byName.data as EmployeeWithDetails | null;
      }

      if (empData) {
        setEmployee(empData);
        setManager(empData.manager || null);
        const subs = await EmployeeService.listReporters(empData.id as string);
        setReporters(subs);
      }
    })();
  }, [userProfile?.email, userProfile?.branch_id, userProfile?.name]);

  const fetchDashboardData = async () => {
    try {
      const products = await ProductService.getAllProducts();
      
      setStats({
        totalCustomers: 0, // Will be implemented with customer service
        totalSales: 0, // Will be implemented with sales service
        pendingOrders: 0, // Will be implemented with order service
        monthlyTarget: 10000, // Will be configurable
      });
      
      setRecentProducts(products.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your customers, sales, and product promotions.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-gray-600 text-sm">Performance</p>
            <p className="text-gray-900 font-medium">On Track</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
              <p className="text-green-600 text-sm mt-1">+3 this week</p>
            </div>
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalSales.toLocaleString()}</p>
              <p className="text-green-600 text-sm mt-1">+8% from last month</p>
            </div>
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
              <p className="text-orange-600 text-sm mt-1">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Monthly Target</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.monthlyTarget.toLocaleString()}</p>
              <p className="text-blue-600 text-sm mt-1">75% achieved</p>
            </div>
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Available Products */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Available Products</h2>
          <p className="text-gray-600 text-sm mt-1">Products you can promote to customers</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">📦</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium">{product.name}</h3>
                  <p className="text-gray-600 text-sm">{product.category?.name || 'No Category'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-medium">{ProductService.formatPrice(product.tp)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.stock > 100 ? 'bg-green-500/10 text-green-700' :
                    product.stock > 50 ? 'bg-yellow-500/10 text-yellow-700' :
                    'bg-red-500/10 text-red-700'
                  }`}>
                    {product.stock > 100 ? 'Available' : product.stock > 50 ? 'Limited' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reporting Structure */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">HR Panel</h2>
          <p className="text-gray-600 text-sm mt-1">Your designation, manager, and team</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">My Designation</div>
                <div className="text-gray-900">{employee?.designation?.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Reports To</div>
                {manager ? (
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="text-gray-900">{manager.name}</div>
                      <div className="text-sm text-gray-600">{manager.designation?.name || '—'}</div>
                    </div>
                    <div className="text-xs text-gray-500">Code: {manager.employee_code}</div>
                  </div>
                ) : (
                  <div className="text-gray-600">No manager assigned</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Direct Reports</div>
              {reporters.length > 0 ? (
                <ul className="divide-y divide-gray-100 rounded border">
                  {reporters.map((r) => (
                    <li key={r.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="text-gray-900">{r.name}</div>
                        <div className="text-sm text-gray-600">{r.designation?.name || '—'}</div>
                      </div>
                      <div className="text-xs text-gray-500">Code: {r.employee_code}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-600">No direct reports</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium">Add New Customer</h3>
              <p className="text-gray-600 text-sm">Register a new customer in your territory</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium">Create Sales Order</h3>
              <p className="text-gray-600 text-sm">Process a new order for your customer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium">View Performance</h3>
              <p className="text-gray-600 text-sm">Check your sales performance and targets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
