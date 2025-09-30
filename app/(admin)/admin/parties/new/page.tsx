'use client';

import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { PartyService } from '@/lib/partyService';
import { useRouter } from 'next/navigation';

export default function NewPartyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', party_code: '', contact_person: '', phone: '', email: '', shop_no: '',
    address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name) return alert('Name is required');
    setSaving(true);
    const created = await PartyService.create(form);
    setSaving(false);
    if (created) router.push('/admin/parties');
    else alert('Failed to create party');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Party</h1>
            <p className="text-gray-600">Create a new customer party (pharmacy)</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Party Code</label>
              <input value={form.party_code} onChange={(e) => setField('party_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Contact Person</label>
              <input value={form.contact_person} onChange={(e) => setField('contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Phone</label>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Shop No</label>
              <input value={form.shop_no} onChange={(e) => setField('shop_no', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Address Line 1</label>
                <input value={form.address_line1} onChange={(e) => setField('address_line1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Address Line 2</label>
                <input value={form.address_line2} onChange={(e) => setField('address_line2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">City</label>
                <input value={form.city} onChange={(e) => setField('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">State</label>
                <input value={form.state} onChange={(e) => setField('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Postal Code</label>
                <input value={form.postal_code} onChange={(e) => setField('postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Country</label>
                <input value={form.country} onChange={(e) => setField('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={saving} onClick={save}
              className={`px-6 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {saving ? 'Saving...' : 'Save Party'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


