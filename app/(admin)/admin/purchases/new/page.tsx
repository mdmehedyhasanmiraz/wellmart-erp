'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Product, PurchaseOrder, PurchaseOrderItem, Employee } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';
import { PurchaseService } from '@/lib/purchaseService';
import { InventoryService } from '@/lib/inventoryService';
import { EmployeeService } from '@/lib/employeeService';
import { useRouter } from 'next/navigation';
import { Supplier, ProductBranchBatchStock } from '@/types/user';
import { SupplierService } from '@/lib/supplierService';

type Line = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  batch_number?: string;
};

export default function NewPurchasePage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [taxTotal, setTaxTotal] = useState<number>(0);
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([{ product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [batchStocks, setBatchStocks] = useState<Record<string, ProductBranchBatchStock[]>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [productQueries, setProductQueries] = useState<string[]>(['']);
  const [productTotals, setProductTotals] = useState<Record<string, number>>({});
  const [productAnchors, setProductAnchors] = useState<Array<{ left: number; top: number; width: number; height: number } | null>>([null]);

  useEffect(() => {
    const load = async () => {
      const [b, p, s, e] = await Promise.all([
        BranchService.getAll(), 
        ProductService.getAllProducts(), 
        SupplierService.getAllSuppliers(),
        EmployeeService.getAll()
      ]);
      setBranches(b);
      setProducts(p);
      setSuppliers(s);
      setEmployees(e);
      setBranchId(b[0]?.id || '');
      setSupplierId(s[0]?.id || '');
    };
    load();
  }, []);

  // Filter employees when branch changes
  useEffect(() => {
    if (branchId && employees.length > 0) {
      const branchEmployees = employees.filter(emp => emp.branch_id === branchId && emp.is_active);
      if (branchEmployees.length > 0) {
        setEmployeeId(branchEmployees[0].id);
      } else {
        setEmployeeId('');
      }
    }
  }, [branchId, employees]);

  // Filter suppliers when branch changes and auto-populate supplier details
  useEffect(() => {
    if (branchId && suppliers.length > 0) {
      // Show suppliers assigned to current branch OR suppliers without branch assignment
      const branchSuppliers = suppliers.filter(supplier => 
        (supplier.branch_id === branchId || supplier.branch_id === null) && supplier.is_active
      );
      
      if (branchSuppliers.length > 0) {
        setSupplierId(branchSuppliers[0].id);
        // Auto-populate supplier details from first supplier
        const firstSupplier = branchSuppliers[0];
        setSupplierName(firstSupplier.name);
        setSupplierPhone(firstSupplier.phone || '');
      } else {
        setSupplierId('');
        setSupplierName('');
        setSupplierPhone('');
      }
    }
  }, [branchId, suppliers]);

  const totals = useMemo(() => {
    const lineTotals = lines.map((l) => {
      const base = l.unit_price * l.quantity;
      const percent = base * (l.discount_percent / 100);
      return Math.max(base - l.discount_amount - percent, 0);
    });
    const subtotal = lineTotals.reduce((s, t) => s + t, 0);
    const grand = Math.max(subtotal - discountTotal + taxTotal + shippingTotal, 0);
    const due = Math.max(grand - paidTotal, 0);
    return { subtotal, grand, due };
  }, [lines, discountTotal, taxTotal, shippingTotal, paidTotal]);

  const setLine = (idx: number, update: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...update } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    // keep productQueries in sync with lines length
    setProductQueries((prev) => {
      const next = [...prev];
      if (next.length < lines.length) {
        while (next.length < lines.length) next.push('');
      } else if (next.length > lines.length) {
        next.length = lines.length;
      }
      return next;
    });
    setProductAnchors((prev) => {
      const next = [...prev];
      if (next.length < lines.length) {
        while (next.length < lines.length) next.push(null);
      } else if (next.length > lines.length) {
        next.length = lines.length;
      }
      return next;
    });
  }, [lines.length]);

  const loadBatchStocks = async (productId: string) => {
    if (!productId || !branchId) return;
    try {
      const stocks = await InventoryService.getBatchStocksByBranch(productId, branchId);
      setBatchStocks(prev => ({ ...prev, [productId]: stocks }));
    } catch (error) {
      console.error('Error loading batch stocks:', error);
    }
  };

  const handleProductChange = async (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    setLine(idx, { 
      product_id: productId, 
      unit_price: product?.pp || 0, // Use purchase price (pp) instead of trade price (tp)
      batch_number: ''
    });
    setProductQueries((prev) => prev.map((q, i) => (i === idx ? '' : q)));
    setProductAnchors((prev) => prev.map((a, i) => (i === idx ? null : a)));
    // prefetch total stock for display next time
    if (branchId && productId && !productTotals[productId]) {
      try {
        const stocks = await InventoryService.getBatchStocksByBranch(productId, branchId);
        const total = (stocks || []).reduce((s, r) => s + (r.quantity || 0), 0);
        setProductTotals((prev) => ({ ...prev, [productId]: total }));
      } catch {}
    }
    await loadBatchStocks(productId);
  };

  const ensureTotalsFor = async (ids: string[]) => {
    const missing = ids.filter((id) => productTotals[id] === undefined);
    if (!branchId || missing.length === 0) return;
    try {
      const results = await Promise.all(missing.map(async (id) => {
        const stocks = await InventoryService.getBatchStocksByBranch(id, branchId);
        const total = (stocks || []).reduce((s, r) => s + (r.quantity || 0), 0);
        return { id, total } as const;
      }));
      setProductTotals((prev) => {
        const next = { ...prev };
        results.forEach(({ id, total }) => { next[id] = total; });
        return next;
      });
    } catch {}
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    setUploadingImages(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const imageUrl = await PurchaseService.uploadFile(file);
      return imageUrl;
    });

    try {
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(url => url !== null) as string[];
      setUploadedImages(prev => [...prev, ...validUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageRemove = async (index: number) => {
    const imageUrl = uploadedImages[index];
    const success = await PurchaseService.deleteFile(imageUrl);
    
    if (success) {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } else {
      alert('Failed to delete image');
    }
  };

  const canSubmit = useMemo(() => {
    if (!branchId) return false;
    if (lines.length === 0) return false;
    for (const l of lines) {
      if (!l.product_id || l.quantity <= 0 || l.unit_price < 0) return false;
    }
    return true;
  }, [branchId, lines]);

  const handleSubmit = async () => {
    if (!canSubmit || !branchId) return;
    setSubmitting(true);
    const order: PurchaseOrder | null = await PurchaseService.createOrder({
      branch_id: branchId,
      supplier_id: supplierId || undefined,
      employee_id: employeeId || undefined,
      supplier_name: supplierName,
      supplier_phone: supplierPhone,
      discount_total: discountTotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      paid_total: paidTotal,
      due_total: totals.due,
      note,
      image_urls: uploadedImages.length > 0 ? uploadedImages : undefined,
      status: 'posted',
    });
    if (!order) { setSubmitting(false); alert('Failed to create order'); return; }
    const ok = await PurchaseService.addItems(order.id, lines as unknown as Array<Omit<PurchaseOrderItem, 'id' | 'order_id' | 'total'>>);
    setSubmitting(false);
    if (ok) {
      router.push('/admin/purchases');
    } else {
      alert('Failed to add items');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
            <p className="text-gray-600">Create a purchase order</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Supplier</label>
              <select value={supplierId} onChange={(e) => {
                const selectedSupplierId = e.target.value;
                setSupplierId(selectedSupplierId);
                
                // Auto-populate supplier details from selected supplier
                if (selectedSupplierId) {
                  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
                  if (selectedSupplier) {
                    setSupplierName(selectedSupplier.name);
                    setSupplierPhone(selectedSupplier.phone || '');
                  }
                } else {
                  setSupplierName('');
                  setSupplierPhone('');
                }
              }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select a supplier</option>
                {(() => {
                  // Show suppliers assigned to current branch OR suppliers without branch assignment
                  const filteredSuppliers = suppliers.filter(supplier => 
                    (supplier.branch_id === branchId || supplier.branch_id === null) && supplier.is_active
                  );
                  return filteredSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.branch_id ? `(${branches.find(b => b.id === s.branch_id)?.name || 'Unknown Branch'})` : '(No Branch)'}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Supplier Name</label>
              <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Supplier Phone</label>
              <input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select employee</option>
                {employees
                  .filter(emp => emp.branch_id === branchId && emp.is_active)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Items</h2>
              <button onClick={addLine} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Add Line</button>
            </div>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (PP)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc Amt</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={l.product_id ? (products.find(p => p.id === l.product_id)?.name || '') : productQueries[idx]}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductQueries((prev) => prev.map((q, i) => (i === idx ? val : q)));
                              if (l.product_id) setLine(idx, { product_id: '', unit_price: 0 });
                              const rect = (e.target as HTMLInputElement).getBoundingClientRect();
                              setProductAnchors((prev) => prev.map((a, i) => (i === idx ? { left: rect.left + window.scrollX, top: rect.bottom + window.scrollY, width: rect.width, height: rect.height } : a)));
                            }}
                            placeholder="Type product name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {(!l.product_id && productQueries[idx].trim().length > 0 && productAnchors[idx]) && createPortal(
                            <div
                              className="z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                              style={{ position: 'fixed', top: productAnchors[idx]!.top, left: productAnchors[idx]!.left, width: productAnchors[idx]!.width }}
                            >
                              {(() => {
                                const q = productQueries[idx].toLowerCase();
                                const list = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 10);
                                ensureTotalsFor(list.map(l => l.id));
                                if (list.length === 0) return <div className="px-3 py-2 text-sm text-gray-500">No products</div>;
                                return list.map((p) => (
                                  <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => handleProductChange(idx, p.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                                  >
                                    <span className="text-gray-900 text-sm">{p.name}</span>
                                    <span className="text-xs text-gray-500 ml-3">Stock: {productTotals[p.id] !== undefined ? productTotals[p.id] : '…'}</span>
                                  </button>
                                ));
                              })()}
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={l.batch_number || ''} 
                          onChange={(e) => setLine(idx, { batch_number: e.target.value })}
                          placeholder="Enter batch number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={!l.product_id}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} value={l.quantity} onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.unit_price} readOnly
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.discount_amount} onChange={(e) => setLine(idx, { discount_amount: Number(e.target.value) })}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.discount_percent} onChange={(e) => setLine(idx, { discount_percent: Number(e.target.value) })}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeLine(idx)} className="text-red-600 text-sm">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Order Discount Total</label>
              <input type="number" min={0} value={discountTotal} onChange={(e) => setDiscountTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Tax Total</label>
              <input type="number" min={0} value={taxTotal} onChange={(e) => setTaxTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Shipping Total</label>
              <input type="number" min={0} value={shippingTotal} onChange={(e) => setShippingTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Paid Amount</label>
              <input type="number" min={0} max={totals.grand} value={paidTotal} onChange={(e) => setPaidTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div className="p-3 border rounded-lg text-right">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="text-lg font-semibold">BDT {totals.subtotal.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Grand Total</div>
              <div className="text-xl font-bold">BDT {totals.grand.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Paid</div>
              <div className="text-lg font-semibold text-green-600">BDT {paidTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Due</div>
              <div className="text-xl font-bold text-red-600">BDT {totals.due.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Invoice Files</label>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages}
                />
                <label
                  htmlFor="image-upload"
                  className={`px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-500 transition-colors ${
                    uploadingImages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImages ? 'Uploading...' : 'Choose Images'}
                </label>
                <span className="text-sm text-gray-500">
                  Upload invoice images (JPG, PNG, etc.)
                </span>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Invoice ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={!canSubmit || submitting} onClick={handleSubmit}
              className={`px-6 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {submitting ? 'Processing...' : 'Make Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
