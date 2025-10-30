'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Link from 'next/link';
import { Branch, BranchTransfer } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { InventoryService } from '@/lib/inventoryService';

type TransferStatus = '' | 'pending' | 'approved' | 'completed' | 'cancelled'

export default function TransfersPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus>('');
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      const b = await BranchService.getAll();
      setBranches(b);
      setBranchFilter(b[0]?.id || '');
    };
    load();
  }, []);

  useEffect(() => {
    const loadTransfers = async () => {
      if (!branchFilter) return;
      setLoading(true);
      const data = await InventoryService.listTransfers({ branchId: branchFilter, status: statusFilter || undefined });
      setTransfers(data);
      setLoading(false);
    };
    loadTransfers();
  }, [branchFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Transfers</h1>
            <p className="text-gray-600">Create and manage branch-to-branch transfers</p>
          </div>
          <Link href="/admin/transfers/new" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">New Transfer</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Branch</label>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TransferStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Transfers</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-sm">{t.id.slice(0, 8)}</td>
                      <td className="px-4 py-2 text-sm">{branches.find(b => b.id === t.from_branch_id)?.name || '-'}</td>
                      <td className="px-4 py-2 text-sm">{branches.find(b => b.id === t.to_branch_id)?.name || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'approved' ? 'bg-blue-100 text-blue-800' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-2 text-sm">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => window.open(`/api/transfer-invoice?transferId=${t.id}`, '_blank')}
                          className="px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 text-xs"
                        >
                          See invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transfers.length === 0 && (<div className="py-10 text-center text-gray-500">No transfers</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


