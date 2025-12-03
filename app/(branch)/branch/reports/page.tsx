'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ReportsService, SalesDaily, ProfitDaily, PartySalesSummary, EmployeeSalesSummary, PeriodSalesSummary, PeriodGroup } from '@/lib/reportsService';
import { EmployeeService } from '@/lib/employeeService';
import { PartyService } from '@/lib/partyService';
import type { Employee, Party, SalesOrder } from '@/types/user';

export default function BranchReportsPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sales, setSales] = useState<SalesDaily[]>([]);
  const [profit, setProfit] = useState<ProfitDaily[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [partySummary, setPartySummary] = useState<PartySalesSummary[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSalesSummary[]>([]);
  const [periodSummary, setPeriodSummary] = useState<PeriodSalesSummary[]>([]);
  const [periodGroup, setPeriodGroup] = useState<PeriodGroup>('date');
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersForRange, setOrdersForRange] = useState<SalesOrder[]>([]);

  useEffect(() => {
    if (!branchId) return;
    const init = async () => {
      const [e, p] = await Promise.all([EmployeeService.getAll(), PartyService.list()]);
      setEmployees(e.filter((emp) => emp.branch_id === branchId));
      setParties(p.filter((party) => !party.branch_id || party.branch_id === branchId));
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFrom(start.toISOString().slice(0, 10));
      setTo(today.toISOString().slice(0, 10));
    };
    init();
  }, [branchId]);

  useEffect(() => {
    if (!from || !to || !branchId) return;
    const load = async () => {
      setLoading(true);
      setOrdersLoading(true);
      const [s, p, orders] = await Promise.all([
        ReportsService.getSalesSummary(from, to, branchId),
        ReportsService.getProfitSummary(from, to, branchId),
        ReportsService.getSalesOrdersForRange(from, to, branchId),
      ]);
      setSales(s);
      setProfit(p);
      setOrdersForRange(orders);
      const partiesById = parties.reduce<Record<string, string>>((acc, party) => {
        acc[party.id] = party.name;
        return acc;
      }, {});
      const employeesById = employees.reduce<Record<string, string>>((acc, emp) => {
        acc[emp.id] = emp.name;
        return acc;
      }, {});
      setPartySummary(ReportsService.buildPartySummary(orders, partiesById));
      setEmployeeSummary(ReportsService.buildEmployeeSummary(orders, employeesById));
      setPeriodSummary(ReportsService.buildPeriodSummary(orders, periodGroup));
      setLoading(false);
      setOrdersLoading(false);
    };
    load();
  }, [from, to, branchId, parties, employees, periodGroup]);

  const totals = useMemo(() => {
    const revenue = profit.reduce((s, r) => s + Number(r.revenue || 0), 0);
    const cogs = profit.reduce((s, r) => s + Number(r.cogs || 0), 0);
    const gross = profit.reduce((s, r) => s + Number(r.gross_profit || 0), 0);
    const orders = sales.reduce((s, r) => s + Number(r.orders_count || 0), 0);
    return { revenue, cogs, gross, orders };
  }, [sales, profit]);

  if (!branchId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">You must be assigned to a branch to view branch reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Sales and profit summaries for your branch.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Print
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
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

      {/* Daily Sales */}
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
            {sales.length === 0 && <div className="py-10 text-center text-gray-500">No data</div>}
          </div>
        )}
      </div>

      {/* Party-wise Sales */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Party-wise Sales</h2>
        </div>
        {ordersLoading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Party / Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {partySummary.map((row) => (
                  <tr key={row.party_id ?? 'walkin'}>
                    <td className="px-4 py-2 text-sm">{row.customer_name}</td>
                    <td className="px-4 py-2 text-sm">{row.orders}</td>
                    <td className="px-4 py-2 text-sm">৳{row.grand_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.paid_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.due_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {partySummary.length === 0 && <div className="py-10 text-center text-gray-500">No data</div>}
          </div>
        )}
      </div>

      {/* Employee-wise Sales */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Employee-wise Sales</h2>
        </div>
        {ordersLoading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employeeSummary.map((row) => (
                  <tr key={row.employee_id ?? 'none'}>
                    <td className="px-4 py-2 text-sm">{row.employee_name}</td>
                    <td className="px-4 py-2 text-sm">{row.orders}</td>
                    <td className="px-4 py-2 text-sm">৳{row.grand_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.paid_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.due_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employeeSummary.length === 0 && <div className="py-10 text-center text-gray-500">No data</div>}
          </div>
        )}
      </div>

      {/* Period-wise Sales */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Period-wise Sales</h2>
          <select
            value={periodGroup}
            onChange={(e) => {
              const g = e.target.value as PeriodGroup;
              setPeriodGroup(g);
              setPeriodSummary(ReportsService.buildPeriodSummary(ordersForRange, g));
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="date">Date</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        {ordersLoading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {periodSummary.map((row) => (
                  <tr key={row.period}>
                    <td className="px-4 py-2 text-sm">{row.period}</td>
                    <td className="px-4 py-2 text-sm">{row.orders}</td>
                    <td className="px-4 py-2 text-sm">৳{row.grand_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.paid_total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">৳{row.due_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {periodSummary.length === 0 && <div className="py-10 text-center text-gray-500">No data</div>}
          </div>
        )}
      </div>
    </div>
  );
}

