'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Company } from '@/types/user';
import { ProductService } from '@/lib/productService';

export default function AdminCompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const companyData = await ProductService.getCompanyById(companyId);
        if (!companyData) {
          alert('Company not found');
          router.push('/admin/companies');
          return;
        }
        setCompany(companyData);
      } catch (error) {
        console.error('Error loading company:', error);
        alert('Failed to load company details');
        router.push('/admin/companies');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [companyId, router]);

  const handleToggleStatus = async () => {
    if (!company) return;
    setToggling(true);
    try {
      const updated = await ProductService.updateCompany(company.id, { is_active: !company.is_active });
      if (!updated) {
        throw new Error('Company not updated');
      }
      setCompany(updated);
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update company status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="mt-2 text-gray-600">Company information and contacts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/companies"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Companies
          </Link>
          <Link
            href={`/admin/companies/${company.id}/edit`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Edit Company
          </Link>
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              company.is_active
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {company.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Slug</p>
            <p className="text-gray-900">{company.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {company.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {company.description && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-gray-900">{company.description}</p>
            </div>
          )}
        </div>
      </div>

  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Website</p>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                {company.website}
              </a>
            ) : (
              <p className="text-gray-500">Not provided</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Contact Email</p>
            <p className="text-gray-900">{company.contact_email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Contact Phone</p>
            <p className="text-gray-900">{company.contact_phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-900 whitespace-pre-wrap">{company.address || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {company.logo_url && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
          <div className="flex items-center space-x-6">
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-24 h-24 object-contain border border-gray-200 rounded-lg bg-white"
            />
            <div>
              <p className="text-sm text-gray-500">Logo URL</p>
              <a href={company.logo_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                {company.logo_url}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

