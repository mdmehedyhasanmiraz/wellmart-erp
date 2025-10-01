'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductService } from '@/lib/productService';
import { InventoryService } from '@/lib/inventoryService';
import { ProductWithDetails } from '@/types/user';

interface ProductFormData {
  name: string;
  slug: string;
  generic_name: string;
  dosage_form: string;
  pack_size: string;
  sku: string;
  pp: number; // Purchase Price
  tp: number; // Trade Price
  mrp: number; // Maximum Retail Price
  stock: number;
  description: string;
  category_id: string;
  company_id: string;
  is_active: boolean;
  keywords: string[];
  weight: number;
  weight_unit: string;
  is_featured: boolean;
  flash_sale: boolean;
  flat_rate: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    generic_name: '',
    dosage_form: '',
    pack_size: '',
    sku: '',
    pp: 0, // Purchase Price
    tp: 0, // Trade Price
    mrp: 0, // Maximum Retail Price
    stock: 0,
    description: '',
    category_id: '',
    company_id: '',
    is_active: true,
    keywords: [],
    weight: 0,
    weight_unit: 'kg',
    is_featured: false,
    flash_sale: false,
    flat_rate: false,
  });

  
  
  interface ProductBatchInput {
    id?: string;
    batch_number: string;
    quantity_received: number;
    quantity_remaining?: number;
    manufacturing_date?: string;
    expiry_date?: string;
    supplier_batch_number?: string;
    cost_price?: number;
    status?: 'active' | 'expired' | 'recalled' | 'consumed';
  }

  const [batches, setBatches] = useState<ProductBatchInput[]>([]);
  const [branchStocks, setBranchStocks] = useState<Array<{ branch_id: string; stock: number; branches?: { id: string; name: string; code: string } }>>([]);
  const [totalStock, setTotalStock] = useState<number>(0);
  const [stockView, setStockView] = useState<'batch' | 'branch'>('batch');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      const [data, total, branchwise] = await Promise.all([
        InventoryService.getBatchesByProduct(productId),
        InventoryService.getTotalStockForProduct(productId),
        InventoryService.getBranchStocksForProduct(productId),
      ]);
      setBatches(
        (data || []).map((b: any) => ({
          id: b.id,
          batch_number: b.batch_number,
          quantity_received: b.quantity_received,
          quantity_remaining: b.quantity_remaining,
          manufacturing_date: b.manufacturing_date || undefined,
          expiry_date: b.expiry_date || undefined,
          supplier_batch_number: b.supplier_batch_number || undefined,
          cost_price: b.cost_price || undefined,
          status: b.status,
        }))
      );
      setTotalStock(total || 0);
      setBranchStocks(branchwise || []);
    })();
  }, [productId]);

  useEffect(() => {
    const total = batches.reduce((sum, b) => sum + (b.quantity_remaining || b.quantity_received || 0), 0);
    setFormData(prev => ({ ...prev, stock: total }));
  }, [batches]);

  const fetchProduct = async () => {
    try {
      const data = await ProductService.getProductById(productId);
      setProduct(data);
      
      // Populate form with existing data
      setFormData({
        name: data?.name || '',
        slug: data?.slug || '',
        generic_name: data?.generic_name || '',
        dosage_form: data?.dosage_form || '',
        pack_size: data?.pack_size || '',
        sku: data?.sku || '',
        pp: data?.pp || 0, // Purchase Price
        tp: data?.tp || 0, // Trade Price
        mrp: data?.mrp || 0, // Maximum Retail Price
        stock: data?.stock || 0,
        description: data?.description || '',
        category_id: data?.category_id || '',
        company_id: data?.company_id || '',
        is_active: data?.is_active ?? true,
        keywords: data?.keywords || [],
        weight: data?.weight || 0,
        weight_unit: data?.weight_unit || 'kg',
        is_featured: data?.is_featured ?? false,
        flash_sale: data?.flash_sale ?? false,
        flat_rate: data?.flat_rate ?? false,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product data');
      router.push('/admin/products');
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
      await ProductService.updateProduct(productId, formData);
      // update existing batches via InventoryService
      const existing = batches.filter(b => b.id);
      const created = batches.filter(b => !b.id);
      await Promise.all(
        existing.map(b =>
          InventoryService.updateBatch(b.id as string, {
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            manufacturing_date: b.manufacturing_date,
            supplier_batch_number: b.supplier_batch_number,
            cost_price: b.cost_price,
            quantity_received: b.quantity_received,
            quantity_remaining: b.quantity_remaining,
            status: b.status,
          })
        )
      );
      await Promise.all(
        created.map(b =>
          InventoryService.createBatch({
            product_id: productId,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            manufacturing_date: b.manufacturing_date,
            supplier_batch_number: b.supplier_batch_number,
            cost_price: b.cost_price,
            quantity_received: b.quantity_received || 0,
          })
        )
      );
      router.push('/admin/products');
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
    <div className="max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="mt-2 text-gray-600">Update product information and settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/admin/products/${productId}`)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Product
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Product SKU"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter product description"
            />
          </div>
        </div>

        {/* Inventory - Batch/Branch */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button type="button" onClick={() => setStockView('batch')} className={`px-4 py-2 text-sm font-medium border ${stockView==='batch' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'}`}>By Batch</button>
              <button type="button" onClick={() => setStockView('branch')} className={`px-4 py-2 text-sm font-medium border -ml-px ${stockView==='branch' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'}`}>By Branch</button>
            </div>
          </div>

          {stockView === 'branch' ? (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchStocks.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.branches?.name || row.branch_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.branches?.code || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFG</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXP</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batches.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <input
                            type="text"
                            value={b.batch_number}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, batch_number: e.target.value }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <input
                            type="number"
                            min={0}
                            value={b.quantity_received}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, quantity_received: parseInt(e.target.value||'0',10) }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <input
                            type="number"
                            min={0}
                            value={b.quantity_remaining ?? 0}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, quantity_remaining: parseInt(e.target.value||'0',10) }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <input
                            type="date"
                            value={b.manufacturing_date || ''}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, manufacturing_date: e.target.value }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <input
                            type="date"
                            value={b.expiry_date || ''}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, expiry_date: e.target.value }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <select
                            value={b.status || 'active'}
                            onChange={(e) => setBatches(prev => prev.map((x,i)=> i===idx? { ...x, status: e.target.value as any }: x))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="recalled">Recalled</option>
                            <option value="consumed">Consumed</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setBatches(prev => prev.filter((_, i) => i !== idx))}
                            className="px-3 py-1 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-sm text-gray-600">Total remaining stock from batches: <span className="font-semibold">{batches.reduce((s, b) => s + (b.quantity_remaining || b.quantity_received || 0), 0)}</span></div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      const batch_number = await InventoryService.generateBatchNumber(productId);
                      setBatches(prev => [...prev, { batch_number, quantity_received: 0, quantity_remaining: 0 }]);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Add Batch
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price (PP) *
              </label>
              <input
                type="number"
                name="pp"
                value={formData.pp}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Price (TP) *
              </label>
              <input
                type="number"
                name="tp"
                value={formData.tp}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Retail Price (MRP) *
              </label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                readOnly
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="oz">Ounce (oz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Categories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {/* Categories will be populated from API */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select company</option>
                {/* Companies will be populated from API */}
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
