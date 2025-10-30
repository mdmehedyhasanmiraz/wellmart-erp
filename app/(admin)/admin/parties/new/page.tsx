'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { PartyService } from '@/lib/partyService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BranchService } from '@/lib/branchService';

export default function NewPartyPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [branchCode, setBranchCode] = useState<string>('');
  const [form, setForm] = useState({
    name: '', party_code: '', contact_person: '', phone: '', email: '', address_line1: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    const init = async () => {
      try {
        if (userProfile?.branch_id) {
          const branch = await BranchService.getById(userProfile.branch_id);
          const codePrefix = branch?.code || '';
          setBranchCode(codePrefix);
          const parties = await PartyService.list();
          const nextNum = parties
            .map(p => p.party_code)
            .filter((c): c is string => !!c && c.startsWith(codePrefix))
            .map(c => parseInt(c.slice(codePrefix.length) || '0', 10))
            .reduce((max, n) => (isNaN(n) ? max : Math.max(max, n)), 0) + 1;
          const nextCode = codePrefix + String(nextNum).padStart(4, '0');
          setForm(prev => ({ ...prev, party_code: nextCode }));
        }
      } catch (e) {
        // fallback: leave code empty
      }
    };
    init();
  }, [userProfile?.branch_id]);

  const save = async () => {
    if (!form.name) return alert('Name is required');
    setSaving(true);
    const created = await PartyService.create({
      name: form.name,
      party_code: form.party_code,
      contact_person: form.contact_person,
      phone: form.phone,
      email: form.email,
      address_line1: form.address_line1,
      branch_id: userProfile?.branch_id,
    });
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
              <label className="block text-sm text-gray-600 mb-2">Code</label>
              <input value={form.party_code} onChange={(e) => setField('party_code', e.target.value)}
                readOnly
                placeholder={branchCode ? `${branchCode}0001` : 'Auto' }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
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
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-2">Address</label>
                <input value={form.address_line1} onChange={(e) => setField('address_line1', e.target.value)}
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


