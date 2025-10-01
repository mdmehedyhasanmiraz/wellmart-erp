'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DesignationService } from '@/lib/designationService';
import { DesignationWithDetails } from '@/types/user';

export default function DesignationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [designation, setDesignation] = useState<DesignationWithDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await DesignationService.getByIdWithDetails(id);
      setDesignation(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!designation) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">Designation not found</div>
        <button 
          onClick={() => router.push('/admin/designations')} 
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Back to Designations
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{designation.name}</h1>
          <p className="mt-2 text-gray-600">
            {designation.code} - {designation.department || 'No Department'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push(`/admin/designations/${designation.id}/edit`)} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={() => router.push('/admin/designations')} 
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Designation Name</div>
            <div className="text-gray-900 font-medium">{designation.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Designation Code</div>
            <div className="text-gray-900">{designation.code}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Department</div>
            <div className="text-gray-900">{designation.department || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Level</div>
            <div className="text-gray-900">Level {designation.level}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sort Order</div>
            <div className="text-gray-900">{designation.sort_order}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                designation.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {designation.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {designation.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-500">Description</div>
              <div className="text-gray-900">{designation.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* Hierarchy Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Parent Designation</div>
            <div className="text-gray-900">
              {designation.parent ? (
                <div>
                  <div className="font-medium">{designation.parent.name}</div>
                  <div className="text-sm text-gray-500">{designation.parent.code} (Level {designation.parent.level})</div>
                </div>
              ) : (
                'Root Level (No Parent)'
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Reports To</div>
            <div className="text-gray-900">
              {designation.reporting_to ? (
                <div>
                  <div className="font-medium">{designation.reporting_to.name}</div>
                  <div className="text-sm text-gray-500">{designation.reporting_to.code} (Level {designation.reporting_to.level})</div>
                </div>
              ) : (
                'No Reporting Manager'
              )}
            </div>
          </div>
          {designation.children && designation.children.length > 0 && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-500 mb-2">Child Designations</div>
              <div className="space-y-2">
                {designation.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{child.name}</div>
                      <div className="text-sm text-gray-500">{child.code} (Level {child.level})</div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/designations/${child.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Information */}
      {(designation.min_salary || designation.max_salary) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500">Minimum Salary</div>
              <div className="text-gray-900">
                {designation.min_salary ? `৳${designation.min_salary.toLocaleString('en-BD')}` : 'Not specified'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Maximum Salary</div>
              <div className="text-gray-900">
                {designation.max_salary ? `৳${designation.max_salary.toLocaleString('en-BD')}` : 'Not specified'}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-gray-500">Salary Range</div>
              <div className="text-gray-900 font-medium">
                {DesignationService.formatSalaryRange(designation.min_salary, designation.max_salary)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsibilities */}
      {designation.responsibilities && designation.responsibilities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
          <ul className="space-y-2">
            {designation.responsibilities.map((responsibility, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-900">{responsibility}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements */}
      {designation.requirements && designation.requirements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
          <ul className="space-y-2">
            {designation.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-900">{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Created At</div>
            <div className="text-gray-900">
              {new Date(designation.created_at).toLocaleDateString()} at {new Date(designation.created_at).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="text-gray-900">
              {new Date(designation.updated_at).toLocaleDateString()} at {new Date(designation.updated_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
