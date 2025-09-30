'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Branch, EmployeeAllowance } from '@/types/user';
import { AllowanceService } from '@/lib/allowanceService';
import { BranchService } from '@/lib/branchService';
import Link from 'next/link';

export default function AllowancesPage() {
  const [branchId, setBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [list, setList] = useState<EmployeeAllowance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    BranchService.getAll().then((b) => { setBranches(b); setBranchId(b[0]?.id || ''); });
  }, []);

  useEffect(() => {
    setLoading(true);
    AllowanceService.listAllowances().then((l) => { setList(l); setLoading(false); });
  }, [branchId]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Allowances</h1>
            <p className="text-gray-600">Employee allowances (products, money, gifts)</p>
          </div>
          <Link href="/admin/allowances/new" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">New Allowance</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Allowances</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 text-sm">{a.id.slice(0,8)}</td>
                      <td className="px-4 py-2 text-sm">{a.allowance_date}</td>
                      <td className="px-4 py-2 text-sm">{a.employee_id.slice(0,8)}</td>
                      <td className="px-4 py-2 text-sm">৳{a.total_value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {list.length === 0 && (<div className="py-10 text-center text-gray-500">No allowances yet</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


