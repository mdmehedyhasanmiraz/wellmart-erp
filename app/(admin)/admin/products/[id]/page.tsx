'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductService } from '@/lib/productService';
import { ProductWithDetails } from '@/types/user';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await ProductService.getProductById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product data');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await ProductService.deleteProduct(productId);
        router.push('/admin/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">Product not found</div>
        <button
          onClick={() => router.push('/admin/products')}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
          <button
            onClick={() => router.push(`/admin/products/${productId}/edit`)}
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
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>

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
            
            {product.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                 <label className="block text-sm font-medium text-gray-500 mb-1">Regular Price (BDT)</label>
                 <p className="text-2xl font-bold text-gray-900">{ProductService.formatPrice(product.price_regular)}</p>
               </div>
              
              {product.price_offer && product.price_offer !== product.price_regular && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Offer Price (BDT)</label>
                  <p className="text-2xl font-bold text-green-600">{ProductService.formatPrice(product.price_offer)}</p>
                  <p className="text-sm text-gray-500">
                    Save {ProductService.formatPrice(product.price_regular - product.price_offer)}
                  </p>
                </div>
              )}
              
                             <div>
                 <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Price (BDT)</label>
                 <p className="text-xl font-semibold text-gray-900">{ProductService.formatPrice(product.price_purchase || 0)}</p>
               </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Inventory Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Stock</label>
                <p className={`text-2xl font-bold ${
                  product.stock === 0 ? 'text-red-600' :
                  product.stock < 100 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {product.stock}
                </p>
                <p className={`text-sm ${
                  product.stock === 0 ? 'text-red-500' :
                  product.stock < 100 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {product.stock === 0 ? 'Out of Stock' :
                   product.stock < 100 ? 'Low Stock' :
                   'In Stock'}
                </p>
              </div>
              
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
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
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
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Image</h2>
            {product.image_urls && product.image_urls.length > 0 ? (
              <div className="space-y-4">
                {product.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-4xl">📦</span>
              </div>
            )}
          </div>

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
            </div>
          </div>

          {/* Category & Company */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Category & Company</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <p className="text-gray-900">{product.category?.name || 'No Category'}</p>
              </div>
              
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
