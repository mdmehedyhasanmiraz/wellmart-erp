'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, Product, CreateBatchData } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';
import { InventoryService } from '@/lib/inventoryService';

export default function BranchAddStockPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  
  // Batch-related state
  const [useBatch, setUseBatch] = useState<boolean>(true);
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [manufacturingDate, setManufacturingDate] = useState<string>('');
  const [supplierBatchNumber, setSupplierBatchNumber] = useState<string>('');
  const [tradePrice, setTradePrice] = useState<number>(0);
  const [loadingBatchNumber, setLoadingBatchNumber] = useState<boolean>(false);

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
        setProducts(productsData);
        
        // Pre-select first product if available
        if (productsData.length > 0) {
          setProductId(productsData[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile?.branch_id]);

  const canSubmit = useMemo(() => {
    if (!branch?.id || !productId || quantity <= 0) return false;
    if (useBatch && !batchNumber.trim()) return false;
    return true;
  }, [branch?.id, productId, quantity, useBatch, batchNumber]);

  const generateBatchNumber = async () => {
    if (!productId) return;
    
    setLoadingBatchNumber(true);
    try {
      const generatedNumber = await InventoryService.generateBatchNumber(productId);
      setBatchNumber(generatedNumber);
    } catch (error) {
      console.error('Error generating batch number:', error);
    } finally {
      setLoadingBatchNumber(false);
    }
  };

  const handleProductChange = (newProductId: string) => {
    setProductId(newProductId);
    if (useBatch) {
      generateBatchNumber();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !branch?.id) return;
    setSubmitting(true);
    
    try {
      let batchId: string | undefined;
      
      // Create batch if using batch management
      if (useBatch && batchNumber.trim()) {
        const batchData: CreateBatchData = {
          product_id: productId,
          batch_number: batchNumber.trim(),
          expiry_date: expiryDate || undefined,
          manufacturing_date: manufacturingDate || undefined,
          supplier_batch_number: supplierBatchNumber.trim() || undefined,
          cost_price: tradePrice > 0 ? tradePrice : undefined,
          quantity_received: quantity
        };
        
        const batch = await InventoryService.createBatch(batchData);
        if (!batch) {
          alert('Failed to create batch');
          setSubmitting(false);
          return;
        }
        
        batchId = batch.id;
        
        // Update batch stock for the branch
        await InventoryService.updateBatchStock(productId, branch.id, batchId, quantity);
      }
      
      // Create inventory movement
      const movement = await InventoryService.createBatchMovement({
        product_id: productId,
        from_branch_id: null,
        to_branch_id: branch.id,
        quantity,
        note: note || (useBatch ? `Added ${quantity} units to batch ${batchNumber}` : 'Stock adjustment'),
        batch_id: batchId
      });
      
      if (movement) {
        router.push('/branch/inventory');
      } else {
        alert('Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // Check if user's branch code is "DHK"
  const isMainBranch = branch?.code === 'DHK';

  if (!isMainBranch) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Restricted Access</h3>
              <p className="text-red-700 mt-1">
                The &quot;Add Stock&quot; feature is only available to users from the DHK Branch.
                Your current branch: <span className="font-medium">{branch?.name || 'Unknown'}</span>
              </p>
              <p className="text-red-600 text-sm mt-2">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
        <p className="text-gray-600">Receive stock into your branch inventory.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Branch Information */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-sm text-emerald-700">
                Adding stock to: <span className="font-medium">{branch?.name}</span>
                <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  {branch?.code}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Product *</label>
            <select value={productId} onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Select a product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Quantity *</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
        </div>

        {/* Batch Management Toggle */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useBatch}
              onChange={(e) => {
                setUseBatch(e.target.checked);
                if (e.target.checked && productId) {
                  generateBatchNumber();
                }
              }}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Use Batch Management</span>
          </label>
        </div>

        {/* Batch Information */}
        {useBatch && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Batch Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Batch Number *</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Auto-generated batch number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={generateBatchNumber}
                    disabled={!productId || loadingBatchNumber}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loadingBatchNumber ? '...' : 'Generate'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Supplier Batch Number</label>
                <input
                  type="text"
                  value={supplierBatchNumber}
                  onChange={(e) => setSupplierBatchNumber(e.target.value)}
                  placeholder="Optional supplier batch number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Manufacturing Date</label>
                <input
                  type="date"
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Trade Price (৳)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(Number(e.target.value))}
                  placeholder="Optional trade price per unit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-2">Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note about this stock addition"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>

        <div className="flex justify-end">
          <button disabled={!canSubmit || submitting} onClick={handleSubmit}
            className={`px-6 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {submitting ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}


