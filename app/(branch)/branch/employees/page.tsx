'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/user';
import { EmployeeService } from '@/lib/employeeService';

export default function BranchEmployeesPage() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadEmployees = async () => {
      if (!branchId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await EmployeeService.getAll();
        setEmployees(data.filter(emp => emp.branch_id === branchId));
      } catch (error) {
        console.error('Error loading branch employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [branchId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(query) ||
        (emp.employee_code || '').toLowerCase().includes(query) ||
        (emp.designation?.name || '').toLowerCase().includes(query) ||
        (emp.email || '').toLowerCase().includes(query) ||
        (emp.phone || '').toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  if (!branchId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">No Branch Access</h1>
        <p className="text-gray-600 max-w-md">
          Your profile is not assigned to a branch. Please contact an administrator to continue.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">
            Viewing employees assigned to <span className="font-semibold">{userProfile?.branch_name}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, email, phone, designation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="text-xs uppercase font-semibold text-purple-500">Overview</div>
            <div className="mt-2 text-2xl font-bold text-purple-900">{employees.length}</div>
            <div className="text-sm text-purple-700">Employees in this branch</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.designation?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.employee_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.joined_date ? new Date(emp.joined_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        emp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No employees found</div>
            <p className="text-gray-400 mt-2">
              {search ? 'Try adjusting your search query.' : 'Employees will appear here once assigned to your branch.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

