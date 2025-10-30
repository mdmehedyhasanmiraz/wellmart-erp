'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { SalesService } from '@/lib/salesService';
import { SalesOrder } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await SalesService.listOrders();
      setOrders(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
            <p className="text-gray-600">Manage collections against sales invoices</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Invoices</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grand</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 text-sm font-mono">{o.id.slice(0,8)}...</td>
                      <td className="px-4 py-2 text-sm">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{o.customer_name || 'Walk-in Customer'}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(o.grand_total||0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-green-700">৳{Number(o.paid_total||0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-red-700">৳{Number(o.due_total||0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => router.push(`/admin/sales/${o.id}/edit`)}
                          className="px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 text-xs"
                        >
                          Add Collection
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="py-10 text-center text-gray-500">No invoices found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


