'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CreateEmployeeData, Designation, Employee } from '@/types/user';
import { EmployeeService } from '@/lib/employeeService';
import { DesignationService } from '@/lib/designationService';
import { supabase } from '@/lib/supabase';

type ManagerOption = { id: string; name: string; employee_code: string };

export default function BranchEditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeeData>({
    name: '',
    designation_id: '',
    employee_code: '',
    branch_id: branchId || '',
    reports_to_employee_id: '',
    phone: '',
    email: '',
    present_address: '',
    permanent_address: '',
    blood_group: '',
    date_of_birth: '',
    marriage_date: '',
    joined_date: '',
    resigned_date: '',
    is_active: true,
  });

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const data = await DesignationService.getAll();
        setDesignations(data);
      } catch (error) {
        console.error('Error loading designations', error);
      } finally {
        setLoadingDesignations(false);
      }
    };
    loadDesignations();
  }, []);

  useEffect(() => {
    const loadEmployee = async () => {
      if (!id || !branchId) {
        setLoading(false);
        return;
      }
      try {
        const data = await EmployeeService.getById(id);
        if (!data || data.branch_id !== branchId) {
          setEmployee(null);
        } else {
          setEmployee(data);
          setForm({
            name: data.name,
            designation_id: data.designation_id || '',
            employee_code: data.employee_code,
            branch_id: branchId,
            reports_to_employee_id: data.reports_to_employee_id || '',
            phone: data.phone || '',
            email: data.email || '',
            present_address: data.present_address || '',
            permanent_address: data.permanent_address || '',
            blood_group: data.blood_group || '',
            date_of_birth: data.date_of_birth || '',
            marriage_date: data.marriage_date || '',
            joined_date: data.joined_date || '',
            resigned_date: data.resigned_date || '',
            is_active: data.is_active,
          });
        }
      } catch (error) {
        console.error('Error loading employee', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id, branchId]);

  useEffect(() => {
    const loadManagers = async () => {
      if (!branchId || !form.designation_id) {
        setManagers([]);
        return;
      }
      const designation = await DesignationService.getById(form.designation_id);
      if (!designation?.reporting_to_id) {
        setManagers([]);
        return;
      }
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_code')
        .eq('designation_id', designation.reporting_to_id)
        .eq('branch_id', branchId)
        .eq('is_active', true);
      if (error) {
        console.error('Error loading managers', error);
        setManagers([]);
        return;
      }
      setManagers((data || []) as ManagerOption[]);
    };

    loadManagers();
  }, [form.designation_id, branchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !employee) return;
    setSaving(true);
    try {
      const payload: CreateEmployeeData = {
        ...form,
        branch_id: branchId,
      };
      const updated = await EmployeeService.update(employee.id, payload);
      if (updated) {
        router.push('/branch/employees');
      } else {
        alert('Failed to update employee.');
      }
    } catch (error) {
      console.error('Error updating employee', error);
      alert('Failed to update employee.');
    } finally {
      setSaving(false);
    }
  };

  const heading = useMemo(() => {
    if (employee) return `Editing ${employee.name}`;
    if (!branchId) return 'No Branch Access';
    return 'Edit Employee';
  }, [employee, branchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!branchId) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-gray-500 text-lg">You are not assigned to a branch.</div>
        <button onClick={() => router.push('/branch/employees')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Back to Employees
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-gray-500 text-lg">Employee not found in your branch.</div>
        <button onClick={() => router.push('/branch/employees')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
        <p className="mt-2 text-gray-600">Update employee information for your branch.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code *</label>
              <input
                name="employee_code"
                value={form.employee_code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <select
                name="designation_id"
                value={form.designation_id}
                onChange={handleChange}
                disabled={loadingDesignations}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a designation</option>
                {designations.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.name} ({designation.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
              <select
                name="reports_to_employee_id"
                value={form.reports_to_employee_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select manager (optional)</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.employee_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Present Address</label>
              <input
                name="present_address"
                value={form.present_address || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
              <input
                name="permanent_address"
                value={form.permanent_address || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <input
                name="blood_group"
                value={form.blood_group || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marriage Date</label>
              <input
                name="marriage_date"
                type="date"
                value={form.marriage_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
              <input
                name="joined_date"
                type="date"
                value={form.joined_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resigned Date</label>
              <input
                name="resigned_date"
                type="date"
                value={form.resigned_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="is_active"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/branch/employees')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Update Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}


