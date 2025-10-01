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
          <p className="mt-2 text-gray-600">
            {employee.designation ? (
              <span>
                {employee.designation.name} ({employee.designation.code})
                {employee.designation.department && (
                  <span className="text-gray-500"> - {employee.designation.department}</span>
                )}
              </span>
            ) : (
              'No designation assigned'
            )}
          </p>
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

      {employee.designation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Designation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500">Designation Name</div>
              <div className="text-gray-900 font-medium">{employee.designation.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Designation Code</div>
              <div className="text-gray-900">{employee.designation.code}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Department</div>
              <div className="text-gray-900">{employee.designation.department || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Level</div>
              <div className="text-gray-900">Level {employee.designation.level}</div>
            </div>
            {employee.designation.description && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">Description</div>
                <div className="text-gray-900">{employee.designation.description}</div>
              </div>
            )}
            {(employee.designation.min_salary || employee.designation.max_salary) && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">Salary Range</div>
                <div className="text-gray-900">
                  {employee.designation.min_salary && employee.designation.max_salary ? (
                    `৳${employee.designation.min_salary.toLocaleString('en-BD')} - ৳${employee.designation.max_salary.toLocaleString('en-BD')}`
                  ) : employee.designation.min_salary ? (
                    `From ৳${employee.designation.min_salary.toLocaleString('en-BD')}`
                  ) : (
                    `Up to ৳${employee.designation.max_salary?.toLocaleString('en-BD')}`
                  )}
                </div>
              </div>
            )}
          </div>
          
          {employee.designation.responsibilities && employee.designation.responsibilities.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Responsibilities</div>
              <ul className="list-disc list-inside text-gray-900 space-y-1">
                {employee.designation.responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            </div>
          )}
          
          {employee.designation.requirements && employee.designation.requirements.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Requirements</div>
              <ul className="list-disc list-inside text-gray-900 space-y-1">
                {employee.designation.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


