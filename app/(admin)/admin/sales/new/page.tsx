'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Branch, Product, SalesOrder, SalesOrderItem } from '@/types/user';
import { BranchService } from '@/lib/branchService';
import { ProductService } from '@/lib/productService';
import { SalesService } from '@/lib/salesService';
import { InventoryService } from '@/lib/inventoryService';
import { useRouter } from 'next/navigation';
import { Party, ProductBranchBatchStock } from '@/types/user';
import { PartyService } from '@/lib/partyService';

type Line = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  batch_number?: string;
};

export default function NewSalesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [taxTotal, setTaxTotal] = useState<number>(0);
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([{ product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [batchStocks, setBatchStocks] = useState<Record<string, ProductBranchBatchStock[]>>({});

  useEffect(() => {
    const load = async () => {
      const [b, p, pr] = await Promise.all([BranchService.getAll(), ProductService.getAllProducts(), PartyService.list()]);
      setBranches(b);
      setProducts(p);
      setParties(pr);
      setBranchId(b[0]?.id || '');
      setPartyId(pr[0]?.id || '');
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const lineTotals = lines.map((l) => {
      const base = l.unit_price * l.quantity;
      const percent = base * (l.discount_percent / 100);
      return Math.max(base - l.discount_amount - percent, 0);
    });
    const subtotal = lineTotals.reduce((s, t) => s + t, 0);
    const grand = Math.max(subtotal - discountTotal + taxTotal + shippingTotal, 0);
    return { subtotal, grand };
  }, [lines, discountTotal, taxTotal, shippingTotal]);

  const setLine = (idx: number, update: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...update } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

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
      unit_price: product?.tp || 0,
      batch_number: ''
    });
    await loadBatchStocks(productId);
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
    if (!canSubmit) return;
    setSubmitting(true);
    const order: SalesOrder | null = await SalesService.createOrder({
      branch_id: branchId,
      party_id: partyId || undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      discount_total: discountTotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      note,
    });
    if (!order) { setSubmitting(false); alert('Failed to create order'); return; }
    const ok = await SalesService.addItems(order.id, lines as unknown as Array<Omit<SalesOrderItem, 'id' | 'order_id' | 'total'>>);
    setSubmitting(false);
    if (ok) {
      router.push('/admin/sales');
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
            <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-gray-600">Create a sales invoice</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Customer (Party)</label>
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {parties.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Customer Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Customer Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Items</h2>
              <button onClick={addLine} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm">Add Line</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (TP)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc Amt</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <select value={l.product_id} onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.batch_number || ''} onChange={(e) => setLine(idx, { batch_number: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={!l.product_id}>
                          <option value="">Select batch</option>
                          {batchStocks[l.product_id]?.map((stock) => (
                            <option key={stock.batch_id} value={stock.product_batches?.batch_number || ''}>
                              {stock.product_batches?.batch_number} ({stock.quantity} units)
                            </option>
                          ))}
                        </select>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="p-3 border rounded-lg text-right">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="text-lg font-semibold">৳{totals.subtotal.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Grand Total</div>
              <div className="text-2xl font-bold">৳{totals.grand.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div className="flex justify-end">
            <button disabled={!canSubmit || submitting} onClick={handleSubmit}
              className={`px-6 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {submitting ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


