'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Employee, Designation } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { EmployeeService } from '@/lib/employeeService';

// Extended Employee interface that includes manager and designation details
interface EmployeeWithDetails extends Employee {
  manager?: {
    id: string;
    name: string;
    employee_code: string;
    designation?: Designation;
  };
}

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null);
  const [subordinates, setSubordinates] = useState<EmployeeWithDetails[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('users')
        .select(`*, branches ( id, name, code )`)
        .eq('id', id)
        .single();
      if (data) {
        const u = { ...data, branch_name: data.branches?.name } as User;
        setUser(u);

        // If this is an employee user, try to load their employee record by email
        if (u.role === 'employee' && u.email) {
          const { data: emp } = await supabase
            .from('employees')
            .select(`
              *,
              designation:designation_id(id, name, code, level, department),
              manager:reports_to_employee_id(id, name, employee_code,
                designation:designation_id(id, name))
            `)
            .eq('email', u.email)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          if (emp) {
            setEmployee(emp as unknown as Employee);
            const reporters = await EmployeeService.listReporters(emp.id);
            setSubordinates(reporters);
          }
        }
      }
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

  if (!user) {
    return (
      <div className="text-center py-12 w-full">
        <div className="text-gray-500 text-lg">User not found</div>
        <button onClick={() => router.push('/admin/users')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">Back to Users</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="mt-2 text-gray-600 capitalize">Role: {user.role}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push(`/admin/users/${user.id}/edit`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Edit</button>
          <button onClick={() => router.push('/admin/users')} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-gray-900">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="text-gray-900">{user.phone || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Branch</div>
            <div className="text-gray-900">{user.branch_name || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>

      {user.role === 'employee' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">HR Panel</h2>
          {employee ? (
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Designation</div>
                <div className="text-gray-900">{employee.designation?.name || '—'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Reports To</div>
                {employee.manager ? (
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="text-gray-900">{employee.manager.name}</div>
                      <div className="text-sm text-gray-600">{employee.manager.designation?.name || '—'}</div>
                    </div>
                    <div className="text-xs text-gray-500">Code: {employee.manager.employee_code}</div>
                  </div>
                ) : (
                  <div className="text-gray-600">No manager assigned</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Direct Reports</div>
                {subordinates.length > 0 ? (
                  <ul className="divide-y divide-gray-100 rounded border">
                    {subordinates.map((s) => (
                      <li key={s.id} className="flex items-center justify-between p-3">
                        <div>
                          <div className="text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.designation?.name || '—'}</div>
                        </div>
                        <div className="text-xs text-gray-500">Code: {s.employee_code}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-600">No direct reports</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-600">No employee record found for this user.</div>
          )}
        </div>
      )}
    </div>
  );
}


