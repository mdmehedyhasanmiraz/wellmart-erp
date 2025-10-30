'use client';

import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { SupplierService } from '@/lib/supplierService';
import { useRouter } from 'next/navigation';

export default function NewSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    address_line1: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name) return alert('Company Name is required');
    setSaving(true);
    try {
      const created = await SupplierService.createSupplier(form);
      if (created) {
        router.push('/admin/suppliers');
      } else {
        alert('Failed to create supplier');
      }
    } catch (error) {
      alert('Failed to create supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
            <p className="text-gray-600">Create a new supplier</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Company Name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Company Address</label>
              <input value={form.address_line1} onChange={(e) => setField('address_line1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Phone</label>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={saving} onClick={save}
              className={`px-6 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {saving ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
