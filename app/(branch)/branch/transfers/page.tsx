'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { InventoryService } from '@/lib/inventoryService';
import type { BranchTransfer } from '@/types/user';

export default function BranchTransfersPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;
  const canQuery = useMemo(() => Boolean(branchId), [branchId]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BranchTransfer[]>([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canQuery) return;
      setLoading(true);
      const data = await InventoryService.listTransfers({ branchId: branchId as string });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-gray-600">Manage stock transfers to and from your branch.</p>
        </div>
        <Link href="/branch/transfers/new" className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700">
          New Transfer
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-6">
        {!canQuery && (
          <div className="text-sm text-red-600">No branch assigned to your profile.</div>
        )}

        {loading ? (
          <div className="text-gray-500 text-sm">Loading transfers…</div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">From</th>
                  <th className="py-2 pr-4">To</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={5}>No transfers found.</td>
                  </tr>
                ) : (
                  rows.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2 pr-4">{t.id}</td>
                      <td className="py-2 pr-4">{t.from_branch_id}</td>
                      <td className="py-2 pr-4">{t.to_branch_id}</td>
                      <td className="py-2 pr-4 capitalize">{t.status}</td>
                      <td className="py-2 pr-4">{new Date(t.created_at || '').toLocaleString()}</td>
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


