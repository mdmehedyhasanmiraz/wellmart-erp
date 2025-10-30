'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SupplierService } from '@/lib/supplierService';
import { BranchService } from '@/lib/branchService';
import { Supplier, Branch } from '@/types/user';

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        setLoading(true);
        const [supplierData, branchesData] = await Promise.all([
          SupplierService.getSupplierById(supplierId),
          BranchService.getAll()
        ]);

        if (!supplierData) {
          setError('Supplier not found');
          return;
        }

        setSupplier(supplierData);
        
        // Find the branch if supplier has a branch_id
        if (supplierData.branch_id) {
          const branchData = branchesData.find(b => b.id === supplierData.branch_id);
          setBranch(branchData || null);
        }
      } catch (err) {
        console.error('Error loading supplier:', err);
        setError('Failed to load supplier details');
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId]);

  const handleEdit = () => {
    router.push(`/admin/suppliers/${supplierId}/edit`);
  };

  const handleBack = () => {
    router.push('/admin/suppliers');
  };

  const handleToggleStatus = async () => {
    if (!supplier) return;
    
    try {
      await SupplierService.toggleSupplierStatus(supplierId);
      // Reload the supplier data
      const updatedSupplier = await SupplierService.getSupplierById(supplierId);
      setSupplier(updatedSupplier);
    } catch (err) {
      console.error('Error toggling supplier status:', err);
      alert('Failed to update supplier status');
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;
    
    const confirmed = confirm(`Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await SupplierService.deleteSupplier(supplierId);
      router.push('/admin/suppliers');
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('Failed to delete supplier');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplier Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested supplier could not be found.'}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
                <p className="text-gray-600 mt-1">
                  Supplier Code: {supplier.supplier_code || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  supplier.is_active
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {supplier.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Supplier
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Address</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.address_line1 || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{supplier.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}