'use client';

export default function BranchUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">View-only access to user profiles associated with your branch.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          This section is read-only for branch role. Editing, creating, or deleting users is disabled.
        </div>
        <div className="mt-4 text-gray-500 text-sm">Users table UI goes here.</div>
      </div>
    </div>
  );
}


