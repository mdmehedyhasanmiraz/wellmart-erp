'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { InventoryService } from '@/lib/inventoryService';
import type { ProductBranchStock } from '@/types/user';

export default function BranchInventoryPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProductBranchStock[]>([]);
  const branchId = userProfile?.branch_id;

  const canQuery = useMemo(() => Boolean(branchId), [branchId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canQuery) return;
      setLoading(true);
      const data = await InventoryService.getStocksByBranch(branchId as string);
      if (!active) return;
      setRows(data);
      setLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [canQuery, branchId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">View inventory for your branch only.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-700">
          Branch Scoped: <span className="font-medium">{userProfile?.branch_name || 'N/A'}</span>
        </p>

        {!canQuery && (
          <div className="mt-4 text-sm text-red-600">No branch assigned to your profile.</div>
        )}

        {loading ? (
          <div className="mt-6 text-gray-500 text-sm">Loading stocks…</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4">Min</th>
                  <th className="py-2 pr-4">Max</th>
                  <th className="py-2 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={5}>No stock records found.</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.product_id}-${r.branch_id}`} className="border-t">
                      <td className="py-2 pr-4">{r.product_id}</td>
                      <td className="py-2 pr-4">{r.stock ?? 0}</td>
                      <td className="py-2 pr-4">{r.min_level ?? '-'}</td>
                      <td className="py-2 pr-4">{r.max_level ?? '-'}</td>
                      <td className="py-2 pr-4">{new Date(r.updated_at || '').toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


