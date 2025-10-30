'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BranchSidebar from '../../components/BranchSidebar';
import { Branch } from '@/types/user';
import { PartyService } from '@/lib/partyService';
import { BranchService } from '@/lib/branchService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchNewPartyPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branchCode, setBranchCode] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    party_code: '',
    contact_person: '',
    phone: '',
    email: '',
    address_line1: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (!userProfile?.branch_id) return;
        const branch = await BranchService.getById(userProfile.branch_id);
        const prefix = branch?.code || '';
        setBranchCode(prefix);
        const parties = await PartyService.list();
        const next = parties
          .map(p => p.party_code)
          .filter((c): c is string => !!c && c.startsWith(prefix))
          .map(c => parseInt(c.slice(prefix.length) || '0', 10))
          .reduce((m, n) => (isNaN(n) ? m : Math.max(m, n)), 0) + 1;
        const nextCode = prefix + String(next).padStart(4, '0');
        setForm(prev => ({ ...prev, party_code: nextCode }));
      } catch (e) {
        // ignore
      }
    };
    init();
  }, [userProfile?.branch_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Party name is required');
      return;
    }

    setLoading(true);
    try {
      const success = await PartyService.create({
        name: form.name,
        party_code: form.party_code,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
        address_line1: form.address_line1,
        branch_id: userProfile?.branch_id,
      });
      if (success) {
        router.push('/branch/parties');
      } else {
        alert('Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      alert('Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Party</h1>
            <p className="text-gray-600">Create a new customer party for {userProfile?.branch_name || 'your branch'}</p>
          </div>
          <button
            onClick={() => router.push('/branch/parties')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Parties
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Party</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={form.party_code}
                  readOnly
                  placeholder={branchCode ? `${branchCode}0001` : 'Auto'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => handleChange('address_line1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/branch/parties')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-white ${
                loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
