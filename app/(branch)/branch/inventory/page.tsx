'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InventoryService } from '@/lib/inventoryService';
import { BatchService } from '@/lib/batchService';
import type { ProductBranchBatchStock } from '@/types/user';

type EditFormState = {
  batch_number: string;
  expiry_date: string;
  manufacturing_date: string;
  purchase_price: number;
  trade_price: number;
  mrp: number;
  status: 'active' | 'expired' | 'recalled' | 'consumed';
};

export default function BranchInventoryPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProductBranchBatchStock[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProductBranchBatchStock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductBranchBatchStock | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    batch_number: '',
    expiry_date: '',
    manufacturing_date: '',
    purchase_price: 0,
    trade_price: 0,
    mrp: 0,
    status: 'active'
  });
  const branchId = userProfile?.branch_id;

  const canQuery = useMemo(() => Boolean(branchId), [branchId]);

  const loadRows = useCallback(async () => {
    if (!branchId) return;
    const data = await InventoryService.getBatchInventoryByBranch(branchId);
    setRows(data);
  }, [branchId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canQuery || !branchId) return;
      setLoading(true);
      try {
        const data = await InventoryService.getBatchInventoryByBranch(branchId);
        if (!active) return;
        setRows(data);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [canQuery, branchId]);

  const openEditModal = (row: ProductBranchBatchStock) => {
    if (!row.product_batches) {
      alert('Batch details not available for this record.');
      return;
    }
    setSelectedRow(row);
    setEditForm({
      batch_number: row.product_batches.batch_number || '',
      expiry_date: row.product_batches.expiry_date || '',
      manufacturing_date: row.product_batches.manufacturing_date || '',
      purchase_price: row.product_batches.purchase_price ?? 0,
      trade_price: row.product_batches.trade_price ?? 0,
      mrp: row.product_batches.mrp ?? 0,
      status: (row.product_batches.status as EditFormState['status']) || 'active'
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedRow(null);
  };

  const handleEditChange = <K extends keyof EditFormState>(field: K, value: EditFormState[K]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedRow?.product_batches?.id) {
      alert('Unable to determine batch ID for saving.');
      return;
    }

    const batchNumber = editForm.batch_number.trim();
    if (!batchNumber) {
      alert('Batch number is required.');
      return;
    }

    setSaving(true);
    try {
      await InventoryService.updateBatch(selectedRow.product_batches.id, {
        batch_number: batchNumber,
        expiry_date: editForm.expiry_date || undefined,
        manufacturing_date: editForm.manufacturing_date || undefined,
        purchase_price: editForm.purchase_price,
        trade_price: editForm.trade_price,
        mrp: editForm.mrp,
        status: editForm.status
      });
      await loadRows();
      closeEditModal();
    } catch (error) {
      console.error('Failed to update batch', error);
      alert('Failed to update batch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteTarget?.product_batches?.id) {
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      await BatchService.deleteBatch(deleteTarget.product_batches.id);
      await loadRows();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete batch', error);
      alert('Failed to delete batch. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">View inventory for your branch only.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-700">
          Branch Scoped: <span className="font-medium">{userProfile?.branch_name || 'N/A'}</span>
        </p>

        {!canQuery && (
          <div className="mt-4 text-sm text-red-600">No branch assigned to your profile.</div>
        )}

        {loading ? (
          <div className="mt-6 text-gray-500 text-sm">Loading stocks…</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Batch</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">PP</th>
                  <th className="py-2 pr-4">TP</th>
                  <th className="py-2 pr-4">MRP</th>
                  <th className="py-2 pr-4">Expiry</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={8}>No batch records found.</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.id}`} className="border-t">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{r.products?.name || 'Unknown product'}</div>
                        <div className="text-xs text-gray-500">{r.products?.sku}</div>
                      </td>
                      <td className="py-2 pr-4">{r.product_batches?.batch_number || '-'}</td>
                      <td className="py-2 pr-4">{r.quantity ?? 0}</td>
                      <td className="py-2 pr-4">
                        {r.product_batches?.purchase_price !== undefined
                          ? `BDT ${r.product_batches.purchase_price?.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        {r.product_batches?.trade_price !== undefined
                          ? `BDT ${r.product_batches.trade_price?.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        {r.product_batches?.mrp !== undefined
                          ? `BDT ${r.product_batches.mrp?.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        {r.product_batches?.expiry_date
                          ? new Date(r.product_batches.expiry_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">{new Date(r.updated_at || '').toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="px-3 py-1 text-xs font-medium rounded border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Batch</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={editForm.batch_number}
                  onChange={(e) => handleEditChange('batch_number', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditChange('status', e.target.value as EditFormState['status'])}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="recalled">Recalled</option>
                  <option value="consumed">Consumed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Manufacturing Date</label>
                <input
                  type="date"
                  value={editForm.manufacturing_date || ''}
                  onChange={(e) => handleEditChange('manufacturing_date', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiry_date || ''}
                  onChange={(e) => handleEditChange('expiry_date', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Purchase Price (PP)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.purchase_price}
                  onChange={(e) => handleEditChange('purchase_price', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Trade Price (TP)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.trade_price}
                  onChange={(e) => handleEditChange('trade_price', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">MRP</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.mrp}
                  onChange={(e) => handleEditChange('mrp', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  saving ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete Batch</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete batch{' '}
              <span className="font-semibold">{deleteTarget.product_batches?.batch_number}</span> for{' '}
              <span className="font-semibold">{deleteTarget.products?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                disabled={deleting}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  deleting ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}


