'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Branch } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ReportsService, SalesDaily, ProfitDaily } from '@/lib/reportsService';

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sales, setSales] = useState<SalesDaily[]>([]);
  const [profit, setProfit] = useState<ProfitDaily[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    BranchService.getAll().then((b) => {
      setBranches(b);
      setBranchId('');
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFrom(start.toISOString().slice(0,10));
      setTo(today.toISOString().slice(0,10));
    });
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    Promise.all([
      ReportsService.getSalesSummary(from, to, branchId || undefined),
      ReportsService.getProfitSummary(from, to, branchId || undefined)
    ]).then(([s, p]) => {
      setSales(s);
      setProfit(p);
      setLoading(false);
    });
  }, [from, to, branchId]);

  const totals = useMemo(() => {
    const revenue = profit.reduce((s, r) => s + Number(r.revenue || 0), 0);
    const cogs = profit.reduce((s, r) => s + Number(r.cogs || 0), 0);
    const gross = profit.reduce((s, r) => s + Number(r.gross_profit || 0), 0);
    const orders = sales.reduce((s, r) => s + Number(r.orders_count || 0), 0);
    return { revenue, cogs, gross, orders };
  }, [sales, profit]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Sales and profit-loss summaries</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">Orders</div>
            <div className="text-2xl font-bold">{totals.orders}</div>
          </div>
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-bold">৳{totals.revenue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">COGS</div>
            <div className="text-2xl font-bold">৳{totals.cogs.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">Gross Profit</div>
            <div className="text-2xl font-bold">৳{totals.gross.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Daily Sales</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((r) => (
                    <tr key={`${r.branch_id}-${r.sales_date}`}>
                      <td className="px-4 py-2 text-sm">{r.sales_date}</td>
                      <td className="px-4 py-2 text-sm">{r.orders_count}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.grand_total_sum || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.paid_total_sum || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.due_total_sum || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sales.length === 0 && (<div className="py-10 text-center text-gray-500">No data</div>)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Daily Profit</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">COGS</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {profit.map((r) => (
                    <tr key={`${r.branch_id}-${r.sales_date}`}>
                      <td className="px-4 py-2 text-sm">{r.sales_date}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.revenue || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.cogs || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">৳{Number(r.gross_profit || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profit.length === 0 && (<div className="py-10 text-center text-gray-500">No data</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


