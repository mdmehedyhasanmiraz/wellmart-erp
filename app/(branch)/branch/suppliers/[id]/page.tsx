'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import BranchSidebar from '@/app/(branch)/branch/components/BranchSidebar';
import { Supplier } from '@/types/user';
import { SupplierService } from '@/lib/supplierService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchSupplierViewPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { userProfile } = useAuth();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const supplierData = await SupplierService.getSupplierById(supplierId);
        if (supplierData) {
          // Check if supplier is accessible to this branch
          if (supplierData.branch_id && supplierData.branch_id !== userProfile?.branch_id) {
            alert('You do not have permission to view this supplier');
            router.push('/branch/suppliers');
            return;
          }
          setSupplier(supplierData);
        } else {
          alert('Supplier not found');
          router.push('/branch/suppliers');
        }
      } catch (error) {
        console.error('Error loading supplier:', error);
        alert('Failed to load supplier details');
      } finally {
        setLoading(false);
      }
    };

    if (supplierId && userProfile?.branch_id) {
      loadSupplier();
    }
  }, [supplierId, router, userProfile?.branch_id]);

  const handleToggleStatus = async () => {
    if (!supplier) return;
    
    try {
      await SupplierService.toggleSupplierStatus(supplier.id);
      setSupplier({ ...supplier, is_active: !supplier.is_active });
    } catch (error) {
      console.error('Error toggling supplier status:', error);
      alert('Failed to update supplier status');
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

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <BranchSidebar />
        <div className="p-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Supplier Not Found</h1>
            <p className="text-gray-600 mt-2">The supplier you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/branch/suppliers"
              className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Suppliers
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
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600">Supplier Details</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/branch/suppliers/${supplier.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Supplier
            </Link>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                supplier.is_active
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {supplier.is_active ? 'Deactivate' : 'Activate'}
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
                <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>
              </div>
              {supplier.supplier_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Code</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.supplier_code}</p>
                </div>
              )}
              {supplier.contact_person && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.contact_person}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              {supplier.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.phone}</p>
                </div>
              )}
              {supplier.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.email}</p>
                </div>
              )}
              {supplier.shop_no && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Number</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.shop_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="space-y-4">
              {supplier.address_line1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.address_line1}</p>
                </div>
              )}
              {supplier.address_line2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.address_line2}</p>
                </div>
              )}
              {supplier.city && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.city}</p>
                </div>
              )}
              {supplier.state && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.state}</p>
                </div>
              )}
              {supplier.postal_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.postal_code}</p>
                </div>
              )}
              {supplier.country && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{supplier.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(supplier.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(supplier.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        {(supplier.latitude && supplier.longitude) && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                <p className="mt-1 text-sm text-gray-900">
                  {supplier.latitude}, {supplier.longitude}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
