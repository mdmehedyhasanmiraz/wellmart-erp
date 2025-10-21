'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Branch, PurchaseOrder } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { PurchaseService } from '@/lib/purchaseService';
import Link from 'next/link';

export default function PurchasesListPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    BranchService.getAll().then((b) => {
      setBranches(b);
      setBranchId(b[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    PurchaseService.getOrdersByBranch(branchId).then((o) => {
      // Filter by status if selected
      const filteredOrders = status ? o.filter(order => order.status === status) : o;
      setOrders(filteredOrders);
      setLoading(false);
    });
  }, [branchId, status]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
            <p className="text-gray-600">Purchase orders and invoices</p>
          </div>
          <Link href="/admin/purchases/new" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">New Purchase</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Purchase Orders</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 text-sm">{o.id.slice(0,8)}</td>
                      <td className="px-4 py-2 text-sm">{o.supplier_name || '-'}</td>
                      <td className="px-4 py-2 text-sm">BDT {o.grand_total?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">BDT {o.paid_total?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">BDT {o.due_total?.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${o.status === 'posted' ? 'bg-green-100 text-green-800' : o.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : o.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/api/purchase-invoice?orderId=${o.id}`, '_blank')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            See Invoice
                          </button>
                          <Link
                            href={`/admin/purchases/${o.id}/edit`}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (<div className="py-10 text-center text-gray-500">No purchase orders</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
