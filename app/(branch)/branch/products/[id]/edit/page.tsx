'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { ProductWithDetails, Branch, UpdateProductData, Company } from '@/types/user';

interface ProductFormData {
  name: string;
  slug: string;
  generic_name: string;
  dosage_form: string;
  pack_size: string;
  sku: string;
  stock: number;
  company_id: string;
  is_active: boolean;
  keywords: string[];
  weight: number;
  weight_unit: string;
  is_featured: boolean;
  flash_sale: boolean;
  flat_rate: boolean;
}

export default function BranchEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    generic_name: '',
    dosage_form: '',
    pack_size: '',
    sku: '',
    stock: 0,
    company_id: '',
    is_active: true,
    keywords: [],
    weight: 0,
    weight_unit: 'kg',
    is_featured: false,
    flash_sale: false,
    flat_rate: false,
  });
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (productId && userProfile?.branch_id) {
      fetchProduct();
    }
  }, [productId, userProfile?.branch_id]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companyList = await ProductService.getAllCompanies();
      setCompanies(companyList.filter(company => company.is_active));
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const [productData, branchData] = await Promise.all([
        ProductService.getProductById(productId),
        BranchService.getById(userProfile!.branch_id!)
      ]);
      
      setProduct(productData);
      setBranch(branchData);
      setIsMainBranch(branchData?.code === 'DHK');
      
      // Check if user can edit this product
      if (branchData?.code !== 'DHK') {
        alert('Only MAIN branch users can edit products');
        router.push('/branch/products');
        return;
      }
      
      // Populate form with existing data
      setFormData({
        name: productData?.name || '',
        slug: productData?.slug || '',
        generic_name: productData?.generic_name || '',
        dosage_form: productData?.dosage_form || '',
        pack_size: productData?.pack_size || '',
        sku: productData?.sku || '',
        stock: productData?.stock || 0,
        company_id: productData?.company_id || '',
        is_active: productData?.is_active ?? true,
        keywords: productData?.keywords || [],
        weight: productData?.weight || 0,
        weight_unit: productData?.weight_unit || 'kg',
        is_featured: productData?.is_featured ?? false,
        flash_sale: productData?.flash_sale ?? false,
        flat_rate: productData?.flat_rate ?? false,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product data');
      router.push('/branch/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Helper function to convert empty strings to null for optional fields
      const emptyToNull = (value: string | undefined): string | null | undefined => {
        if (value === undefined) return undefined;
        return value.trim() === '' ? null : value;
      };

      const updateData: UpdateProductData = {
        name: formData.name,
        slug: formData.slug,
        generic_name: emptyToNull(formData.generic_name) as string | null | undefined,
        dosage_form: emptyToNull(formData.dosage_form) as string | null | undefined,
        pack_size: emptyToNull(formData.pack_size) as string | null | undefined,
        sku: formData.sku || undefined,
        stock: formData.stock,
        company_id: (formData.company_id ? formData.company_id : null) as string | null | undefined,
        is_active: formData.is_active,
        keywords: formData.keywords.length ? formData.keywords : undefined,
        weight: formData.weight || undefined,
        weight_unit: formData.weight_unit || undefined,
        is_featured: formData.is_featured,
        flash_sale: formData.flash_sale,
        flat_rate: formData.flat_rate,
      };

      const updated = await ProductService.updateProduct(productId, updateData);
      if (!updated) {
        throw new Error('Product not updated');
      }
      router.push('/branch/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product || !isMainBranch) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">Access Denied</div>
        <p className="text-gray-400 mt-2">Only MAIN branch users can edit products.</p>
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
    <div className="max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="mt-2 text-gray-600">Update product information and settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/branch/products/${productId}`)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Product
          </button>
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
                Editing product for: <span className="font-medium">{branch.name}</span>
                <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  {branch.code}
                </span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  Can Edit Products
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generic Name
              </label>
              <input
                type="text"
                name="generic_name"
                value={formData.generic_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter generic name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage Form
              </label>
              <select
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select dosage form</option>
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
                <option value="cream">Cream</option>
                <option value="ointment">Ointment</option>
                <option value="drops">Drops</option>
                <option value="powder">Powder</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pack Size
              </label>
              <input
                type="text"
                name="pack_size"
                value={formData.pack_size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 30 tablets, 100ml"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Product SKU"
              />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Weight</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Unit
              </label>
              <select
                name="weight_unit"
                value={formData.weight_unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="oz">Ounce (oz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Company</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active Product
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Featured Product
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="flash_sale"
                checked={formData.flash_sale}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Flash Sale
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="flat_rate"
                checked={formData.flat_rate}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Flat Rate Product
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/branch/products')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            <span>{saving ? 'Saving...' : 'Update Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
