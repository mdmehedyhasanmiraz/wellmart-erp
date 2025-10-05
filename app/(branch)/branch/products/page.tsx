'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProductWithDetails } from '@/types/user';
import { ProductService } from '@/lib/productService';
import { InventoryService } from '@/lib/inventoryService';
import { BranchService } from '@/lib/branchService';
import { Branch } from '@/types/user';

export default function BranchProductsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stocksByProduct, setStocksByProduct] = useState<Record<string, number>>({});
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isMainBranch, setIsMainBranch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.branch_id) {
        setLoading(false);
        return;
      }
      
      try {
        const [branchData, productsData] = await Promise.all([
          BranchService.getById(userProfile.branch_id),
          ProductService.getAllProducts()
        ]);
        
        setBranch(branchData);
        setIsMainBranch(branchData?.code === 'MAIN');
        setProducts(productsData);
        
        // Fetch total stock per product from batch-level stocks
        const totals = await Promise.all(
          (productsData || []).map(async (p) => {
            try {
              const total = await InventoryService.getTotalStockForProduct(p.id);
              return [p.id, total] as const;
            } catch {
              return [p.id, 0] as const;
            }
          })
        );
        const map: Record<string, number> = {};
        totals.forEach(([id, total]) => {
          map[id] = total || 0;
        });
        setStocksByProduct(map);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile?.branch_id]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category_id === filterCategory;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && product.is_active) ||
                         (filterStatus === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">View products available to your branch</p>
        </div>
        {isMainBranch && (
          <button
            onClick={() => router.push('/branch/products/add')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Product
          </button>
        )}
      </div>

      {/* Branch Info */}
      {branch && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-sm text-emerald-700">
                Viewing products for: <span className="font-medium">{branch.name}</span>
                <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  {branch.code}
                </span>
                {isMainBranch && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    Can Add/Edit Products
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.image_urls[0]}
                            alt={product.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.generic_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category?.name || 'No Category'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-sm font-medium">Trade: ৳{product.tp || 0}</div>
                      <div className="text-sm text-gray-500">MRP: ৳{product.mrp || 0}</div>
                      {/* Purchase price hidden for all branches */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{stocksByProduct[product.id] || 0}</span>
                      <span className="text-xs text-gray-500 ml-1">units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/branch/products/${product.id}`)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        View
                      </button>
                      {isMainBranch && (
                        <>
                          <button
                            onClick={() => router.push(`/branch/products/${product.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-sm">No products found matching your criteria.</div>
          </div>
        )}
      </div>
    </div>
  );
}


