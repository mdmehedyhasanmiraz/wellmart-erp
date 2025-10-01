'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeService } from '@/lib/employeeService';
import { DesignationService } from '@/lib/designationService';
import { CreateEmployeeData, Designation } from '@/types/user';

export default function AddEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [form, setForm] = useState<CreateEmployeeData>({
    name: '',
    designation_id: '',
    employee_code: '',
    branch_id: '',
    phone: '',
    email: '',
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
        console.error('Error loading designations:', error);
      } finally {
        setLoadingDesignations(false);
      }
    };

    loadDesignations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await EmployeeService.create(form);
      if (created) router.push('/admin/employees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Employee</h1>
          <p className="mt-2 text-gray-600">Create a new employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <select 
                name="designation_id" 
                value={form.designation_id} 
                onChange={handleChange}
                disabled={loadingDesignations}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a designation</option>
                {designations.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.name} ({designation.code}) - {designation.department || 'No Department'}
                  </option>
                ))}
              </select>
              {loadingDesignations && (
                <p className="mt-1 text-sm text-gray-500">Loading designations...</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code *</label>
              <input name="employee_code" value={form.employee_code} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <input name="branch_id" value={form.branch_id} onChange={handleChange} placeholder="Select branch (ID)" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joined</label>
              <input name="joined_date" value={form.joined_date} onChange={handleChange} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resigned</label>
              <input name="resigned_date" value={form.resigned_date} onChange={handleChange} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button type="button" onClick={() => router.push('/admin/employees')} className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}


