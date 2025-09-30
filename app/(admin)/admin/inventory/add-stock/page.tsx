'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Product } from '@/types/user';
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

  const canSubmit = useMemo(() => !!branchId && !!productId && quantity > 0, [branchId, productId, quantity]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const movement = await InventoryService.createMovement({
      product_id: productId,
      from_branch_id: null,
      to_branch_id: branchId,
      quantity,
      type: 'adjustment',
      note,
    });
    setSubmitting(false);
    if (movement) {
      router.push('/admin/inventory');
    } else {
      alert('Failed to add stock');
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
              <select value={productId} onChange={(e) => setProductId(e.target.value)}
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


