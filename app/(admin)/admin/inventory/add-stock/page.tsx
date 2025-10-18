'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Product, ProductBatch, CreateBatchData } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';
import { InventoryService } from '@/lib/inventoryService';
import { useRouter } from 'next/navigation';

export default function AddStockPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Batch-related state
  const [useBatch, setUseBatch] = useState<boolean>(true);
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [manufacturingDate, setManufacturingDate] = useState<string>('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [loadingBatchNumber, setLoadingBatchNumber] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const [b, p] = await Promise.all([BranchService.getAll(), ProductService.getAllProducts()]);
      setBranches(b);
      setProducts(p);
      setBranchId(b[0]?.id || '');
      setProductId(p[0]?.id || '');
    };
    load();
  }, []);

  const canSubmit = useMemo(() => {
    if (!branchId || !productId || quantity <= 0) return false;
    if (useBatch && !batchNumber.trim()) return false;
    return true;
  }, [branchId, productId, quantity, useBatch, batchNumber]);

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
    if (!canSubmit) return;
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
          cost_price: costPrice > 0 ? costPrice : undefined,
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
        await InventoryService.updateBatchStock(productId, branchId, batchId, quantity);
      }
      
          // Create inventory movement
          const movement = await InventoryService.createBatchMovement({
            product_id: productId,
            from_branch_id: null,
            to_branch_id: branchId,
            quantity,
            note: note || (useBatch ? `Added ${quantity} units to batch ${batchNumber}` : 'Stock adjustment'),
            batch_id: batchId
          });
      
      if (movement) {
        router.push('/admin/inventory');
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
            <p className="text-gray-600">Increase stock for a product in a branch</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Product</label>
              <select value={productId} onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <label className="block text-sm text-gray-600 mb-2">Manufacturing Date</label>
                  <input
                    type="date"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Cost Price (৳)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    placeholder="Optional cost price per unit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div className="flex justify-end">
            <button disabled={!canSubmit || submitting} onClick={handleSubmit}
              className={`px-6 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
              {submitting ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


