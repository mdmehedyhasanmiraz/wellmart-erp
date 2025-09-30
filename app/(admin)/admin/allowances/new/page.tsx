'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Employee, EmployeeAllowanceItem, AllowanceItemType, Product } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { AllowanceService } from '@/lib/allowanceService';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductService } from '@/lib/productService';

type NewItem = {
  item_type: AllowanceItemType;
  product_id?: string | null;
  description?: string;
  quantity: number;
  unit_value: number;
};

export default function NewAllowancePage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [allowanceDate, setAllowanceDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [items, setItems] = useState<NewItem[]>([{ item_type: 'money', quantity: 1, unit_value: 0 }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const [b, p] = await Promise.all([BranchService.getAll(), ProductService.getAllProducts()]);
      setBranches(b);
      setBranchId(b[0]?.id || '');
      setProducts(p);
      const today = new Date();
      setAllowanceDate(today.toISOString().slice(0,10));
    };
    init();
  }, []);

  useEffect(() => {
    if (!branchId) return;
    supabase.from('employees').select('*').eq('is_active', true).then(({ data }) => {
      setEmployees((data || []) as Employee[]);
      setEmployeeId((data && data[0]?.id) || '');
    });
  }, [branchId]);

  const total = useMemo(() => items.reduce((s, i) => s + (i.unit_value * i.quantity), 0), [items]);

  const setItem = (idx: number, update: Partial<NewItem>) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...update } : it));
  const addItem = () => setItems((prev) => [...prev, { item_type: 'money', quantity: 1, unit_value: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const canSave = useMemo(() => !!employeeId && items.length > 0 && items.every(i => i.quantity > 0 && i.unit_value >= 0 && (!!i.description || !!i.product_id || i.item_type !== 'product')), [employeeId, items]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const allowance = await AllowanceService.createAllowance({ employee_id: employeeId, branch_id: branchId, allowance_date: allowanceDate, note });
    if (!allowance) { setSaving(false); alert('Failed to create allowance'); return; }
    const ok = await AllowanceService.addItems(allowance.id, items as unknown as Array<Omit<EmployeeAllowanceItem, 'id' | 'allowance_id' | 'total_value'>>);
    setSaving(false);
    if (ok) router.push('/admin/allowances');
    else alert('Failed to add items');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Allowance</h1>
            <p className="text-gray-600">Provide allowances to employees</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Date</label>
              <input type="date" value={allowanceDate} onChange={(e) => setAllowanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Items</h2>
              <button onClick={addItem} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Value</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <select value={it.item_type} onChange={(e) => setItem(idx, { item_type: e.target.value as AllowanceItemType })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option value="money">Money</option>
                          <option value="product">Product</option>
                          <option value="gift">Gift</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {it.item_type === 'product' ? (
                          <select value={it.product_id || ''} onChange={(e) => setItem(idx, { product_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="">Select product</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input value={it.description || ''} onChange={(e) => setItem(idx, { description: e.target.value })}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} value={it.quantity} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={it.unit_value} onChange={(e) => setItem(idx, { unit_value: Number(e.target.value) })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeItem(idx)} className="text-red-600 text-sm">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-gray-600">Total Value</div>
            <div className="text-2xl font-bold">৳{total.toFixed(2)}</div>
          </div>

          <div className="flex justify-end">
            <button disabled={!canSave || saving} onClick={save}
              className={`px-6 py-2 rounded-lg text-white ${!canSave || saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {saving ? 'Saving...' : 'Save Allowance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


