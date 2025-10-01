'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DesignationService } from '@/lib/designationService';
import { UpdateDesignationData, Designation } from '@/types/user';

export default function EditDesignationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [form, setForm] = useState<UpdateDesignationData>({
    name: '',
    code: '',
    description: '',
    parent_id: '',
    sort_order: 0,
    department: '',
    reporting_to_id: '',
    min_salary: undefined,
    max_salary: undefined,
    responsibilities: [],
    requirements: [],
    is_active: true,
  });

  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        // Load all designations for dropdowns
        const designationData = await DesignationService.getAll();
        setDesignations(designationData);
        setLoadingDesignations(false);

        // Load current designation data
        const currentDesignation = await DesignationService.getById(id);
        if (currentDesignation) {
          setForm({
            name: currentDesignation.name,
            code: currentDesignation.code,
            description: currentDesignation.description || '',
            parent_id: currentDesignation.parent_id || '',
            sort_order: currentDesignation.sort_order,
            department: currentDesignation.department || '',
            reporting_to_id: currentDesignation.reporting_to_id || '',
            min_salary: currentDesignation.min_salary,
            max_salary: currentDesignation.max_salary,
            responsibilities: currentDesignation.responsibilities || [],
            requirements: currentDesignation.requirements || [],
            is_active: currentDesignation.is_active,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddResponsibility = () => {
    if (responsibilityInput.trim()) {
      setForm(prev => ({
        ...prev,
        responsibilities: [...(prev.responsibilities || []), responsibilityInput.trim()]
      }));
      setResponsibilityInput('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setForm(prev => ({
      ...prev,
      responsibilities: prev.responsibilities?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updated = await DesignationService.update(id, form);
      if (updated) {
        router.push('/admin/designations');
      } else {
        alert('Failed to update designation. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error updating designation:', error);
      alert('Failed to update designation. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Designation</h1>
          <p className="mt-2 text-gray-600">Update designation information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g., Operations, Finance, Technology"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hierarchy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Designation</label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                disabled={loadingDesignations}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">No Parent (Root Level)</option>
                {designations.filter(d => d.id !== id).map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.name} (Level {designation.level})
                  </option>
                ))}
              </select>
              {loadingDesignations && (
                <p className="mt-1 text-sm text-gray-500">Loading designations...</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
              <select
                name="reporting_to_id"
                value={form.reporting_to_id}
                onChange={handleChange}
                disabled={loadingDesignations}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">No Reporting Manager</option>
                {designations.filter(d => d.id !== id).map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.name} (Level {designation.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Salary Range */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
              <input
                name="min_salary"
                type="number"
                value={form.min_salary || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
              <input
                name="max_salary"
                type="number"
                value={form.max_salary || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Responsibilities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                placeholder="Add a responsibility..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResponsibility())}
              />
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Add
              </button>
            </div>
            {form.responsibilities && form.responsibilities.length > 0 && (
              <ul className="space-y-2">
                {form.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900">{responsibility}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                placeholder="Add a requirement..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Add
              </button>
            </div>
            {form.requirements && form.requirements.length > 0 && (
              <ul className="space-y-2">
                {form.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/designations')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Updating...' : 'Update Designation'}
          </button>
        </div>
      </form>
    </div>
  );
}
