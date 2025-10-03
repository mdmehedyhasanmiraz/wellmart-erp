'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/types/user';
import { ProductService } from '@/lib/productService';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSales: 0,
    lowStockItems: 0,
  });
  const [recentProducts, setRecentProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const products = await ProductService.getAllProducts();
      const lowStockItems = products.filter(p => p.stock < 100);
      
      setStats({
        totalProducts: products.length,
        totalUsers: 0, // Will be implemented with user service
        totalSales: 0, // Will be implemented with sales service
        lowStockItems: lowStockItems.length,
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
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm">Last updated</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold  mt-2">{stats.totalProducts}</p>
              <p className="text-green-400 text-sm mt-1">+12% from last month</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold  mt-2">{stats.totalUsers}</p>
              <p className="text-green-400 text-sm mt-1">+8% from last month</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold  mt-2">${stats.totalSales.toLocaleString()}</p>
              <p className="text-green-400 text-sm mt-1">+15% from last month</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold  mt-2">{stats.lowStockItems}</p>
              <p className="text-red-400 text-sm mt-1">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
        <div className="p-6 border-b border-white/20 w-full">
          <h2 className="text-xl font-bold ">Recent Products</h2>
          <p className="text-sm mt-1">Latest products added to your inventory</p>
        </div>
        <div className="p-6 w-full">
          <div className="space-y-4">
            {recentProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => router.push(`/admin/products/${product.id}`)}
                className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className=" font-bold text-sm">📦</span>
                </div>
                <div className="flex-1">
                  <h3 className=" font-medium">{product.name}</h3>
                  <p className="text-sm">{product.category?.name || 'No Category'}</p>
                </div>
                <div className="text-right">
                  <p className=" font-medium">{ProductService.formatPrice(product.tp)}</p>
                  <p className="text-sm">Stock: {product.stock}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.stock > 100 ? 'bg-green-500/20 text-green-400' :
                    product.stock > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {product.stock > 100 ? 'In Stock' : product.stock > 50 ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div 
          onClick={() => router.push('/admin/products/add')}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className=" font-medium">Add New Product</h3>
              <p className="text-sm">Create a new product in your inventory</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className=" font-medium">Manage Users</h3>
              <p className="text-sm">Add or manage system users</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className=" font-medium">View Reports</h3>
              <p className="text-sm">Analyze your business performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
