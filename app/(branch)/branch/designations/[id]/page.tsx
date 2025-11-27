'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Designation } from '@/types/user';
import { DesignationService } from '@/lib/designationService';

export default function BranchDesignationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [designation, setDesignation] = useState<Designation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await DesignationService.getById(id);
        setDesignation(data);
      } catch (error) {
        console.error('Error loading designation', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!designation) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-gray-500 text-lg">Designation not found.</div>
        <button onClick={() => router.push('/branch/designations')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Back to Designations
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{designation.name}</h1>
          <p className="mt-2 text-gray-600">
            Code: {designation.code}
            {designation.department && <span className="text-gray-500"> · {designation.department}</span>}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/branch/designations/${designation.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => router.push('/branch/designations')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Detail label="Department" value={designation.department || '—'} />
        <Detail label="Level" value={`Level ${designation.level}`} />
        <Detail label="Sort Order" value={designation.sort_order?.toString() ?? '—'} />
        <Detail label="Status" value={designation.is_active ? 'Active' : 'Inactive'} />
        {designation.description && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Description</div>
            <div className="text-gray-900">{designation.description}</div>
          </div>
        )}
        {(designation.min_salary || designation.max_salary) && (
          <Detail
            label="Salary Range"
            value={
              designation.min_salary && designation.max_salary
                ? `৳${designation.min_salary.toLocaleString('en-BD')} - ৳${designation.max_salary.toLocaleString('en-BD')}`
                : designation.min_salary
                ? `From ৳${designation.min_salary.toLocaleString('en-BD')}`
                : designation.max_salary
                ? `Up to ৳${designation.max_salary.toLocaleString('en-BD')}`
                : '—'
            }
          />
        )}
      </div>

      {designation.responsibilities && designation.responsibilities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
          <ul className="list-disc list-inside text-gray-900 space-y-1">
            {designation.responsibilities.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {designation.requirements && designation.requirements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
          <ul className="list-disc list-inside text-gray-900 space-y-1">
            {designation.requirements.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}


