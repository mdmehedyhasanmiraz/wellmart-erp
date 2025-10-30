'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { InventoryService } from '@/lib/inventoryService';
import { BranchService } from '@/lib/branchService';
import type { BranchTransfer, Branch } from '@/types/user';

export default function BranchTransfersPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;
  const canQuery = useMemo(() => Boolean(branchId), [branchId]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BranchTransfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      const data = await BranchService.getAll();
      setBranches(data);
    };
    loadBranches();
  }, []);

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

  const markCompleted = async (transferId: string) => {
    if (!confirm('Mark this transfer as completed?')) return;
    setCompletingId(transferId);
    try {
      const resp = await fetch('/api/transfers/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, actorId: userProfile?.id, actorBranchId: branchId }),
      });
      if (resp.ok) {
        setRows(prev => prev.map(r => r.id === transferId ? { ...r, status: 'completed' } as BranchTransfer : r));
      } else {
        const data = await resp.json().catch(() => ({}));
        alert(data?.error || 'Failed to complete transfer');
      }
    } catch (e) {
      alert('Failed to complete transfer');
    } finally {
      setCompletingId(null);
    }
  };

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || branchId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-gray-600">Manage stock transfers to and from your branch.</p>
        </div>
        <Link href="/branch/transfers/new" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
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
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4 font-medium">Transfer ID</th>
                  <th className="py-3 pr-4 font-medium">From Branch</th>
                  <th className="py-3 pr-4 font-medium">To Branch</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Created</th>
                  <th className="py-3 pr-4 font-medium">Note</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-gray-500 text-center" colSpan={6}>No transfers found.</td>
                  </tr>
                ) : (
                  rows.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-xs">{t.id.slice(0, 8)}...</td>
                      <td className="py-3 pr-4">{getBranchName(t.from_branch_id)}</td>
                      <td className="py-3 pr-4">{getBranchName(t.to_branch_id)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{new Date(t.created_at || '').toLocaleDateString()}</td>
                      <td className="py-3 pr-4 text-gray-600">{t.note || '—'}</td>
                      <td className="py-3 pr-4 space-x-2">
                        <button
                          onClick={() => window.open(`/api/transfer-invoice?transferId=${t.id}`, '_blank')}
                          className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                        >
                          See invoice
                        </button>
                        {branchId === t.to_branch_id && t.status !== 'completed' && (
                          <button
                            onClick={() => markCompleted(t.id)}
                            disabled={completingId === t.id}
                            className={`px-3 py-1.5 rounded text-white text-xs ${completingId === t.id ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                            {completingId === t.id ? 'Completing…' : 'Mark completed'}
                          </button>
                        )}
                      </td>
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


