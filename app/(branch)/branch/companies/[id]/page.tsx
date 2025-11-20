'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import BranchSidebar from '../../components/BranchSidebar';
import { Company, Branch } from '@/types/user';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchCompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId || !userProfile?.branch_id) {
        setLoading(false);
        return;
      }

      try {
        const [companyData, branchData] = await Promise.all([
          ProductService.getCompanyById(companyId),
          BranchService.getById(userProfile.branch_id),
        ]);

        if (!companyData) {
          alert('Company not found');
          router.push('/branch/companies');
          return;
        }

        setCompany(companyData);
        setBranch(branchData);
        setIsMainBranch(branchData?.code === 'DHK');
      } catch (error) {
        console.error('Error loading company:', error);
        alert('Failed to load company details');
        router.push('/branch/companies');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [companyId, userProfile?.branch_id, router]);

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

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-2">Company details and contact information</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/branch/companies"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Companies
            </Link>
            {isMainBranch && (
              <Link
                href={`/branch/companies/${company.id}/edit`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Edit Company
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
    </div>
  );
}

