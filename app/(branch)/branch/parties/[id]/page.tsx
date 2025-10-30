'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import BranchSidebar from '@/app/(branch)/branch/components/BranchSidebar';
import { Party } from '@/types/user';
import { PartyService } from '@/lib/partyService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchPartyViewPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.id as string;
  const { userProfile } = useAuth();
  
  const [party, setParty] = useState<Party | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParty = async () => {
      try {
        const partyData = await PartyService.getById(partyId);
        if (partyData) {
          // Check if party is accessible to this branch
          if (partyData.branch_id && partyData.branch_id !== userProfile?.branch_id) {
            alert('You do not have permission to view this party');
            router.push('/branch/parties');
            return;
          }
          
          setParty(partyData);
          
          // simplified view, no extra related fetches
        } else {
          alert('Party not found');
          router.push('/branch/parties');
        }
      } catch (error) {
        console.error('Error loading party:', error);
        alert('Failed to load party details');
      } finally {
        setLoading(false);
      }
    };

    if (partyId && userProfile?.branch_id) {
      loadParty();
    }
  }, [partyId, router, userProfile?.branch_id]);

  const handleToggleStatus = async () => {
    if (!party) return;
    
    try {
      const success = await PartyService.update(party.id, { is_active: !party.is_active });
      if (success) {
        setParty({ ...party, is_active: !party.is_active });
      } else {
        alert('Failed to update party status');
      }
    } catch (error) {
      console.error('Error toggling party status:', error);
      alert('Failed to update party status');
    }
  };

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

  if (!party) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <BranchSidebar />
        <div className="p-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Party Not Found</h1>
            <p className="text-gray-600 mt-2">The party you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/branch/parties"
              className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Parties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{party.name}</h1>
            <p className="text-gray-600">Party Details</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/branch/parties/${party.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Party
            </Link>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                party.is_active
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {party.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Party</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{party.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <p className="mt-1 text-sm text-gray-900">{party.party_code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{party.contact_person || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{party.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{party.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{party.address_line1 || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Location Information */}
        {(party.latitude && party.longitude) && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                <p className="mt-1 text-sm text-gray-900">
                  {party.latitude}, {party.longitude}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
