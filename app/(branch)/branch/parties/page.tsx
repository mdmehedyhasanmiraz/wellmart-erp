'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BranchSidebar from '../components/BranchSidebar';
import { Party } from '@/types/user';
import { PartyService } from '@/lib/partyService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchPartiesPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadParties = async () => {
      if (!userProfile?.branch_id) return;
      
      try {
        const allParties = await PartyService.list();
        // Filter parties that belong to this branch or are unassigned
        const branchParties = allParties.filter(party => 
          party.branch_id === userProfile.branch_id || party.branch_id === null
        );
        setParties(branchParties);
      } catch (error) {
        console.error('Error loading parties:', error);
        alert('Failed to load parties');
      } finally {
        setLoading(false);
      }
    };

    loadParties();
  }, [userProfile?.branch_id]);

  const filtered = parties.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.party_code || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <BranchSidebar />
        <div className="p-8 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
              <p className="text-gray-600">Manage customers and suppliers linked to {userProfile?.branch_name || 'your branch'}</p>
            </div>
            <Link
              href="/branch/parties/new"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Add Party
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, code, email, phone, city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.shop_no || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.phone || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.email || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.city || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link href={`/branch/parties/${p.id}`} className="text-purple-600 hover:text-purple-900">View</Link>
                          <Link href={`/branch/parties/${p.id}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No parties found</div>
                <p className="text-gray-400 mt-2">Create your first party to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


