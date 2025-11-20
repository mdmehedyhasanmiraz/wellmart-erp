'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BranchSidebar from '../components/BranchSidebar';
import { Branch, Company } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';

export default function BranchCompaniesPage() {
  const router = useRouter();
  const { userProfile } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.branch_id) {
        setLoading(false);
        return;
      }

      try {
        const [branchData, companyData] = await Promise.all([
          BranchService.getById(userProfile.branch_id),
          ProductService.getAllCompanies(),
        ]);

        setBranch(branchData);
        setIsMainBranch(branchData?.code === 'DHK');
        setCompanies(companyData);
      } catch (error) {
        console.error('Error loading companies:', error);
        alert('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile?.branch_id]);

  const filteredCompanies = companies.filter(company => {
    const q = search.toLowerCase();
    return (
      company.name.toLowerCase().includes(q) ||
      company.slug.toLowerCase().includes(q) ||
      (company.contact_email || '').toLowerCase().includes(q) ||
      (company.contact_phone || '').toLowerCase().includes(q)
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600">
              Manage manufacturer and brand information for {branch?.name || 'your branch'}
            </p>
          </div>
          {isMainBranch && (
            <Link
              href="/branch/companies/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Company
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Companies</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, slug, email, phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.contact_email || '—'}</div>
                      <div className="text-sm text-gray-500">{company.contact_phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {company.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/branch/companies/${company.id}`)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </button>
                        {isMainBranch && (
                          <button
                            onClick={() => router.push(`/branch/companies/${company.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No companies found</div>
              <p className="text-gray-400 mt-2">Try adjusting your search or add a new company.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

