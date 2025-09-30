'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Party } from '@/types/user';
import { PartyService } from '@/lib/partyService';
import Link from 'next/link';

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    PartyService.list().then((p) => { setParties(p); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
            <p className="text-gray-600">Manage customer parties (pharmacies)</p>
          </div>
          <Link href="/admin/parties/new" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Add Party</Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Parties</h2>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parties.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-sm">{p.name}</td>
                      <td className="px-4 py-2 text-sm">{p.shop_no || '-'}</td>
                      <td className="px-4 py-2 text-sm">{p.phone || '-'}</td>
                      <td className="px-4 py-2 text-sm">{p.city || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parties.length === 0 && (<div className="py-10 text-center text-gray-500">No parties found</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


