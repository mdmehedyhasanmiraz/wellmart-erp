'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/app/(admin)/admin/components/AdminSidebar';
import { SalesOrder, SalesOrderItem, SalesPayment } from '@/types/user';
import { SalesService } from '@/lib/salesService';
import { useParams, useRouter } from 'next/navigation';

export default function SalesViewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [payments, setPayments] = useState<SalesPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      const [o, it, pm] = await Promise.all([
        SalesService.getOrder(orderId),
        SalesService.getItems(orderId),
        SalesService.getPayments(orderId),
      ]);
      setOrder(o);
      setItems(it);
      setPayments(pm);
      setLoading(false);
    };
    load();
  }, [orderId]);

  const post = async () => {
    if (!order) return;
    const ok = await SalesService.postOrder(order.id);
    if (ok) router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          </div>
        ) : !order ? (
          <div>Not found</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice #{order.id.slice(0,8)}</h1>
                <p className="text-gray-600">Status: {order.status}</p>
              </div>
              {order.status === 'draft' && (
                <button onClick={post} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Post Invoice</button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold mb-3">Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (TP)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discounts</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2 text-sm">{it.product_id.slice(0,8)}</td>
                        <td className="px-3 py-2 text-sm">{it.batch_id || '-'}</td>
                        <td className="px-3 py-2 text-sm">{it.quantity}</td>
                        <td className="px-3 py-2 text-sm">৳{it.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm">৳{it.discount_amount.toFixed(2)} / {it.discount_percent}%</td>
                        <td className="px-3 py-2 text-sm">৳{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold mb-3">Payments</h2>
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{new Date(p.paid_at).toLocaleString()} — {p.method}</span>
                    <span>৳{p.amount.toFixed(2)}</span>
                  </li>
                ))}
                {payments.length === 0 && <li className="text-gray-500">No payments yet</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


