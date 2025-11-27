'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/user';
import { EmployeeService } from '@/lib/employeeService';

export default function BranchEmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !branchId) {
      setLoading(false);
      if (!branchId) {
        setError('You are not assigned to a branch.');
      }
      return;
    }

    const loadData = async () => {
      try {
        const data = await EmployeeService.getById(id);
        if (!data || data.branch_id !== branchId) {
          setError('Employee not found in your branch.');
        } else {
          setEmployee(data);
        }
      } catch (err) {
        console.error('Error loading employee', err);
        setError('Failed to load employee.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, branchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-gray-500 text-lg">{error || 'Employee not found'}</div>
        <button
          onClick={() => router.push('/branch/employees')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
          <p className="mt-2 text-gray-600">
            {employee.designation ? (
              <>
                {employee.designation.name} ({employee.designation.code})
                {employee.designation.department && (
                  <span className="text-gray-500"> - {employee.designation.department}</span>
                )}
              </>
            ) : (
              'No designation assigned'
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/branch/employees/${employee.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => router.push('/branch/employees')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Detail label="Employee Code" value={employee.employee_code} />
          <Detail label="Phone" value={employee.phone} />
          <Detail label="Email" value={employee.email} />
          <Detail label="Reports To" value={employee.manager?.name} />
          <Detail label="Joined Date" value={formatDate(employee.joined_date)} />
          <Detail label="Resigned Date" value={formatDate(employee.resigned_date)} />
          <Detail label="Date of Birth" value={formatDate(employee.date_of_birth)} />
          <Detail label="Marriage Date" value={formatDate(employee.marriage_date)} />
          <Detail label="Blood Group" value={employee.blood_group} />
          <div className="md:col-span-2">
            <Detail label="Present Address" value={employee.present_address} />
          </div>
          <div className="md:col-span-2">
            <Detail label="Permanent Address" value={employee.permanent_address} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value && value !== '' ? value : '—'}</div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}


