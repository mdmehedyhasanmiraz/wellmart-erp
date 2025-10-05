'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Branch, UpdateUserData, User } from '@/types/user';
import { UserService } from '@/lib/userService';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<UpdateUserData>({});
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      const list = await UserService.getAllBranches();
      setBranches(list);
      const { data } = await (await import('@/lib/supabase')).supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setEmail(data.email || '');
        setForm({
          name: data.name,
          phone: data.phone,
          role: data.role,
          branch_id: data.branch_id,
          is_active: data.is_active,
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'is_active') {
      setForm(prev => ({ ...prev, is_active: (e.target as HTMLInputElement).checked }));
      return;
    }
    if (name === 'role') {
      const nextRole = value as UpdateUserData['role'];
      setForm(prev => ({ ...prev, role: nextRole, branch_id: nextRole === 'branch' ? prev.branch_id : undefined }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await UserService.updateUser(id, form);
      if (updated) router.push('/admin/users');
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
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-2 text-gray-600">Update user information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input value={email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input name="name" value={form.name || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select name="role" value={form.role || 'employee'} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="admin">Admin</option>
                <option value="branch">Branch</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select name="branch_id" value={form.branch_id || ''} onChange={handleChange} disabled={form.role !== 'branch'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">None</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_active" name="is_active" checked={!!form.is_active} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button type="button" onClick={() => router.push('/admin/users')} className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Saving...' : 'Update User'}</button>
        </div>
      </form>
    </div>
  );
}


