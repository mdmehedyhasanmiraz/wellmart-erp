'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/app/(admin)/admin/components/AdminSidebar';
import { Party, Branch, Employee } from '@/types/user';
import { PartyService } from '@/lib/partyService';
import { BranchService } from '@/lib/branchService';
import { EmployeeService } from '@/lib/employeeService';

export default function AdminPartyViewPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.id as string;
  
  const [party, setParty] = useState<Party | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParty = async () => {
      try {
        const partyData = await PartyService.getById(partyId);
        if (partyData) {
          setParty(partyData);
          
          // Load related data if available
          if (partyData.branch_id) {
            const branches = await BranchService.getAll();
            const foundBranch = branches.find(b => b.id === partyData.branch_id);
            setBranch(foundBranch || null);
          }
          
          if (partyData.employee_id) {
            const employees = await EmployeeService.getAll();
            const foundEmployee = employees.find(e => e.id === partyData.employee_id);
            setEmployee(foundEmployee || null);
          }
        } else {
          alert('Party not found');
          router.push('/admin/parties');
        }
      } catch (error) {
        console.error('Error loading party:', error);
        alert('Failed to load party details');
      } finally {
        setLoading(false);
      }
    };

    if (partyId) {
      loadParty();
    }
  }, [partyId, router]);

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
        <AdminSidebar />
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
        <AdminSidebar />
        <div className="p-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Party Not Found</h1>
            <p className="text-gray-600 mt-2">The party you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/admin/parties"
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
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{party.name}</h1>
            <p className="text-gray-600">Party Details</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/parties/${party.id}/edit`}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{party.name}</p>
              </div>
              {party.party_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Party Code</label>
                  <p className="mt-1 text-sm text-gray-900">{party.party_code}</p>
                </div>
              )}
              {party.contact_person && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">{party.contact_person}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  party.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {party.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              {party.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{party.phone}</p>
                </div>
              )}
              {party.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{party.email}</p>
                </div>
              )}
              {party.shop_no && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Number</label>
                  <p className="mt-1 text-sm text-gray-900">{party.shop_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="space-y-4">
              {party.address_line1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <p className="mt-1 text-sm text-gray-900">{party.address_line1}</p>
                </div>
              )}
              {party.address_line2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <p className="mt-1 text-sm text-gray-900">{party.address_line2}</p>
                </div>
              )}
              {party.city && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="mt-1 text-sm text-gray-900">{party.city}</p>
                </div>
              )}
              {party.state && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <p className="mt-1 text-sm text-gray-900">{party.state}</p>
                </div>
              )}
              {party.postal_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <p className="mt-1 text-sm text-gray-900">{party.postal_code}</p>
                </div>
              )}
              {party.country && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{party.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Information</h2>
            <div className="space-y-4">
              {branch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Branch</label>
                  <p className="mt-1 text-sm text-gray-900">{branch.name}</p>
                </div>
              )}
              {employee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Employee</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.name}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(party.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(party.updated_at).toLocaleString()}
                </p>
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
