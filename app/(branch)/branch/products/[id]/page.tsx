'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { ProductWithDetails, Branch } from '@/types/user';

export default function BranchProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isMainBranch, setIsMainBranch] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const [productData, branchData] = await Promise.all([
        ProductService.getProductById(productId),
        BranchService.getById(userProfile!.branch_id!)
      ]);
      
      setProduct(productData);
      setBranch(branchData);
      setIsMainBranch(branchData?.code === 'DHK');
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product data');
      router.push('/branch/products');
    } finally {
      setLoading(false);
    }
  }, [productId, userProfile?.branch_id, router]);

  useEffect(() => {
    if (productId && userProfile?.branch_id) {
      fetchProduct();
    }
  }, [productId, userProfile?.branch_id, fetchProduct]);

  const handleDelete = async () => {
    if (!isMainBranch) {
      alert('Only DHK branch users can delete products');
      return;
    }
    
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await ProductService.deleteProduct(productId);
        router.push('/branch/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">Product not found</div>
        <button
          onClick={() => router.push('/branch/products')}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-2 text-gray-600">Product details and information</p>
        </div>
        <div className="flex items-center space-x-4">
          {isMainBranch && (
            <>
              <button
                onClick={() => router.push(`/branch/products/${productId}/edit`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Product</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/branch/products')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Products
          </button>
        </div>
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
                Viewing product for: <span className="font-medium">{branch.name}</span>
                <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  {branch.code}
                </span>
                {isMainBranch && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    Can Edit/Delete Product
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Product Name</label>
                <p className="text-gray-900 font-medium">{product.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Generic Name</label>
                <p className="text-gray-900">{product.generic_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">SKU</label>
                <p className="text-gray-900 font-mono">{product.sku || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Slug</label>
                <p className="text-gray-900 font-mono">{product.slug || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dosage Form</label>
                <p className="text-gray-900 capitalize">{product.dosage_form || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Pack Size</label>
                <p className="text-gray-900">{product.pack_size || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Weight</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.weight && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
                  <p className="text-xl font-semibold text-gray-900">
                    {product.weight} {product.weight_unit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Keywords */}
          {product.keywords && product.keywords.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {product.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Product Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Featured</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.is_featured
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_featured ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Flash Sale</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.flash_sale
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.flash_sale ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Flat Rate</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.flat_rate
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.flat_rate ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company</label>
                <p className="text-gray-900">{product.company?.name || 'No Company'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timestamps</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-gray-900">
                  {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">
                  {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
