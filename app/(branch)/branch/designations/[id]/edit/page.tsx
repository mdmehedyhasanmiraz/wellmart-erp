'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DesignationService } from '@/lib/designationService';
import { CreateDesignationData, Designation } from '@/types/user';

export default function BranchEditDesignationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [form, setForm] = useState<CreateDesignationData>({
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
  });
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [designationList, current] = await Promise.all([
          DesignationService.getAll(),
          DesignationService.getById(id),
        ]);
        setDesignations(designationList);
        if (current) {
          setForm({
            name: current.name,
            code: current.code,
            description: current.description || '',
            parent_id: current.parent_id || '',
            sort_order: current.sort_order ?? 0,
            department: current.department || '',
            reporting_to_id: current.reporting_to_id || '',
            min_salary: current.min_salary ?? undefined,
            max_salary: current.max_salary ?? undefined,
            responsibilities: current.responsibilities || [],
            requirements: current.requirements || [],
          });
        }
      } catch (error) {
        console.error('Error loading designation', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddResponsibility = () => {
    if (!responsibilityInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), responsibilityInput.trim()],
    }));
    setResponsibilityInput('');
  };

  const handleRemoveResponsibility = (index: number) => {
    setForm((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddRequirement = () => {
    if (!requirementInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      requirements: [...(prev.requirements || []), requirementInput.trim()],
    }));
    setRequirementInput('');
  };

  const handleRemoveRequirement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await DesignationService.update(id, form);
      if (updated) {
        router.push('/branch/designations');
      } else {
        alert('Failed to update designation.');
      }
    } catch (error) {
      console.error('Error updating designation', error);
      alert('Failed to update designation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Designation</h1>
        <p className="mt-2 text-gray-600">Update designation information.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Hierarchy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Designation</label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">No Parent (Root)</option>
                {designations
                  .filter((d) => d.id !== id)
                  .map((designation) => (
                    <option key={designation.id} value={designation.id}>
                      {designation.name} (Level {designation.level})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
              <select
                name="reporting_to_id"
                value={form.reporting_to_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">No Reporting Manager</option>
                {designations
                  .filter((d) => d.id !== id)
                  .map((designation) => (
                    <option key={designation.id} value={designation.id}>
                      {designation.name} (Level {designation.level})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Salary Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
              <input
                name="min_salary"
                type="number"
                min="0"
                step="0.01"
                value={form.min_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
              <input
                name="max_salary"
                type="number"
                min="0"
                step="0.01"
                value={form.max_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus-border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Responsibilities</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={responsibilityInput}
              onChange={(e) => setResponsibilityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddResponsibility();
                }
              }}
              placeholder="Add a responsibility..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button type="button" onClick={handleAddResponsibility} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Add
            </button>
          </div>
          {form.responsibilities && form.responsibilities.length > 0 && (
            <ul className="space-y-2">
              {form.responsibilities.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-900">{item}</span>
                  <button type="button" onClick={() => handleRemoveResponsibility(idx)} className="text-red-600 hover:text-red-800">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
              placeholder="Add a requirement..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button type="button" onClick={handleAddRequirement} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Add
            </button>
          </div>
          {form.requirements && form.requirements.length > 0 && (
            <ul className="space-y-2">
              {form.requirements.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-900">{item}</span>
                  <button type="button" onClick={() => handleRemoveRequirement(idx)} className="text-red-600 hover:text-red-800">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/branch/designations')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update Designation'}
          </button>
        </div>
      </form>
    </div>
  );
}


