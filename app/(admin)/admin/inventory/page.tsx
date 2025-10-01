'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Branch, Product, ProductBranchStock } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { InventoryService } from '@/lib/inventoryService';
import { ProductService } from '@/lib/productService';
import Link from 'next/link';

type StockRow = ProductBranchStock & { product?: Product };

export default function AdminInventoryPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const [b] = await Promise.all([BranchService.getAll()]);
      setBranches(b);
      const defaultBranch = b[0]?.id || '';
      setSelectedBranchId(defaultBranch);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    setLoading(true);
    const load = async () => {
      try {
        console.log('Loading inventory for branch:', selectedBranchId);
        const [stockRows, allProducts] = await Promise.all([
          InventoryService.getStocksByBranch(selectedBranchId),
          ProductService.getAllProducts(),
        ]);
        
        console.log('Stock rows loaded:', stockRows.length);
        console.log('Products loaded:', allProducts.length);
        
        const pById: Record<string, Product> = {};
        allProducts.forEach((p) => {
          pById[p.id] = p;
        });
        setProductsById(pById);
        setStocks(stockRows.map((s) => ({ ...s, product: pById[s.product_id] })));
      } catch (error) {
        console.error('Error loading inventory:', error);
        setStocks([]);
        setProductsById({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBranchId]);

  const totals = useMemo(() => {
    const totalItems = stocks.length;
    const totalUnits = stocks.reduce((sum, s) => sum + (s.stock || 0), 0);
    const lowStock = stocks.filter((s) => (s.min_level ?? 0) > 0 && s.stock <= (s.min_level ?? 0)).length;
    return { totalItems, totalUnits, lowStock };
  }, [stocks]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Inventory</h1>
            <p className="text-gray-600">View and manage per-branch stock</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/admin/inventory/add-stock" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Add Stock</Link>
            <Link href="/admin/inventory/transfers" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Transfers</Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded border">
                  <div className="text-xl font-bold">{totals.totalItems}</div>
                  <div className="text-xs text-gray-500">Items</div>
                </div>
                <div className="text-center p-3 rounded border">
                  <div className="text-xl font-bold">{totals.totalUnits}</div>
                  <div className="text-xs text-gray-500">Units</div>
                </div>
                <div className="text-center p-3 rounded border">
                  <div className="text-xl font-bold text-red-600">{totals.lowStock}</div>
                  <div className="text-xs text-gray-500">Low</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Stock Items</h2>
          </div>
          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stocks.map((s) => (
                    <tr key={s.id} className={s.min_level && s.stock <= s.min_level ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        <div className="font-medium">{s.product?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{s.product?.generic_name}</div>
                      </td>
                      <td className="px-4 py-2 text-sm">{s.product?.sku}</td>
                      <td className="px-4 py-2 font-semibold">{s.stock}</td>
                      <td className="px-4 py-2 text-sm">{s.min_level ?? '-'}</td>
                      <td className="px-4 py-2 text-sm">{s.max_level ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stocks.length === 0 && (
                <div className="py-10 text-center text-gray-500">No stock rows for this branch.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


