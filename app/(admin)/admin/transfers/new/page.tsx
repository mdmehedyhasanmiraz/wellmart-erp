'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Product, BranchTransfer, ProductBatch, ProductBranchBatchStock } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';
import { InventoryService } from '@/lib/inventoryService';
import { useRouter } from 'next/navigation';

type NewItem = { 
  product_id: string; 
  quantity: number; 
  batch_id?: string;
  available_batches?: ProductBranchBatchStock[];
};

export default function NewTransferPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fromBranch, setFromBranch] = useState<string>('');
  const [toBranch, setToBranch] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [items, setItems] = useState<NewItem[]>([{ product_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const [b, p] = await Promise.all([BranchService.getAll(), ProductService.getAllProducts()]);
      setBranches(b);
      setProducts(p);
      if (b.length > 1) {
        setFromBranch(b[0].id);
        setToBranch(b[1].id);
      } else if (b.length === 1) {
        setFromBranch(b[0].id);
      }
    };
    load();
  }, []);

  const canSubmit = useMemo(() => {
    if (!fromBranch || !toBranch || fromBranch === toBranch) return false;
    if (items.length === 0) return false;
    for (const it of items) {
      if (!it.product_id || !it.quantity || it.quantity <= 0) return false;
      if (!it.batch_id) return false; // Require batch selection
    }
    return true;
  }, [fromBranch, toBranch, items]);

  const loadBatchesForItem = async (productId: string, itemIndex: number) => {
    if (!productId || !fromBranch) return;
    
    setLoadingBatches(true);
    try {
      const batches = await InventoryService.getBatchStocksByBranch(productId, fromBranch);
      setItems(prev => prev.map((item, idx) => 
        idx === itemIndex 
          ? { ...item, available_batches: batches, batch_id: batches.length > 0 ? batches[0].batch_id : undefined }
          : item
      ));
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const setItem = (idx: number, update: Partial<NewItem>) => {
    setItems((prev) => {
      const newItems = prev.map((it, i) => i === idx ? { ...it, ...update } : it);
      
      // If product changed, load batches for that item
      if (update.product_id && update.product_id !== prev[idx].product_id) {
        loadBatchesForItem(update.product_id, idx);
      }
      
      return newItems;
    });
  };

  useEffect(() => {
    // when from branch changes, reload batches for all items with a product
    if (!fromBranch) return;
    items.forEach((it, idx) => {
      if (it.product_id) {
        loadBatchesForItem(it.product_id, idx);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBranch]);
  
  const addItem = () => setItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    
    try {
      const transfer: BranchTransfer | null = await InventoryService.createBatchTransfer({
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        note,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          batch_id: item.batch_id!
        }))
      });
      
      if (transfer) {
        try {
          window.open(`/api/transfer-invoice?transferId=${transfer.id}`, '_blank');
        } catch {}
        router.push('/admin/transfers');
      } else {
        alert('Failed to create transfer');
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Failed to create transfer');
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
            <h1 className="text-2xl font-bold text-gray-900">New Transfer</h1>
            <p className="text-gray-600">Create a transfer between branches</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">From Branch</label>
              <select value={fromBranch} onChange={(e) => setFromBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">To Branch</label>
              <select value={toBranch} onChange={(e) => setToBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Items</h2>
              <button onClick={addItem} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <select 
                          value={it.product_id} 
                          onChange={(e) => setItem(idx, { product_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select 
                          value={it.batch_id || ''} 
                          onChange={(e) => setItem(idx, { batch_id: e.target.value })}
                          disabled={!it.product_id || loadingBatches}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select batch</option>
                          {it.available_batches?.map((batch) => (
                            <option key={batch.batch_id} value={batch.batch_id}>
                              {batch.product_batches?.batch_number || 'Unknown Batch'} 
                              {batch.product_batches?.expiry_date && ` (Exp: ${new Date(batch.product_batches.expiry_date).toLocaleDateString()})`}
                            </option>
                          ))}
                        </select>
                        {loadingBatches && (
                          <div className="text-xs text-gray-500 mt-1">Loading batches...</div>
                        )}
                        {it.product_id && !loadingBatches && (!it.available_batches || it.available_batches.length === 0) && (
                          <div className="text-xs text-red-500 mt-1">No batches available for this product</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-600">
                          {it.batch_id && it.available_batches?.find(b => b.batch_id === it.batch_id)?.quantity || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min={1} 
                          max={it.batch_id ? it.available_batches?.find(b => b.batch_id === it.batch_id)?.quantity || 0 : undefined}
                          value={it.quantity} 
                          onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={!canSubmit || submitting} onClick={handleSubmit}
              className={`px-6 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {submitting ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


