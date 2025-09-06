'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Employee } from '@/types/user';
import { EmployeeService } from '@/lib/employeeService';

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await EmployeeService.getById(id);
      setEmployee(data);
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

  if (!employee) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">Employee not found</div>
        <button onClick={() => router.push('/admin/employees')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">Back to Employees</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
          <p className="mt-2 text-gray-600">{employee.designation || '—'}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push(`/admin/employees/${employee.id}/edit`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Edit</button>
          <button onClick={() => router.push('/admin/employees')} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Employee Code</div>
            <div className="text-gray-900 font-medium">{employee.employee_code}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="text-gray-900">{employee.phone || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-gray-900">{employee.email || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="text-gray-900">{employee.joined_date ? new Date(employee.joined_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Resigned</div>
            <div className="text-gray-900">{employee.resigned_date ? new Date(employee.resigned_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{employee.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


