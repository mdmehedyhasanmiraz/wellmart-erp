'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BranchSidebar from '../../components/BranchSidebar';
import { Product, Branch, Party, Employee, SalesOrderItem, ProductBranchBatchStock, SalesOrder } from '@/types/user';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { PartyService } from '@/lib/partyService';
import { EmployeeService } from '@/lib/employeeService';
import { SalesService } from '@/lib/salesService';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryService } from '@/lib/inventoryService';

interface Line {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  batch_number: string;
}

export default function BranchNewSalePage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [branchId, setBranchId] = useState<string>('');
  const [partyId, setPartyId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [taxTotal, setTaxTotal] = useState<number>(0);
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([{ product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [batchStocks, setBatchStocks] = useState<Record<string, ProductBranchBatchStock[]>>({});

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.branch_id) return;
      
      const [p, b, parties, e] = await Promise.all([
        ProductService.getAllProducts(), 
        BranchService.getAll(), 
        PartyService.list(),
        EmployeeService.getAll()
      ]);
      setProducts(p);
      setBranches(b);
      setParties(parties.filter(party => party.branch_id === userProfile.branch_id || party.branch_id === null));
      setEmployees(e.filter(emp => emp.branch_id === userProfile.branch_id));
      setBranchId(userProfile.branch_id);
      setLoading(false);
    };
    load();
  }, [userProfile?.branch_id]);

  useEffect(() => {
    if (partyId) {
      const party = parties.find(p => p.id === partyId);
      if (party) {
        setCustomerName(party.name);
        setCustomerPhone(party.phone || '');
      }
    }
  }, [partyId, parties]);

  const loadBatchStocks = async (productId: string) => {
    if (!branchId || !productId) return;
    try {
      const stocks = await InventoryService.getBatchStocksByBranch(productId, branchId);
      setBatchStocks(prev => ({ ...prev, [productId]: stocks }));
    } catch (error) {
      console.error('Error loading batch stocks:', error);
    }
  };

  const setLine = (idx: number, updates: Partial<Line>) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...updates } : l));
  };

  const addLine = () => {
    setLines(prev => [...prev, { product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, discount_percent: 0, batch_number: '' }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleProductChange = async (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    setLine(idx, { 
      product_id: productId, 
      unit_price: product?.tp || 0, // Use trade price (tp) for sales
      batch_number: ''
    });
    await loadBatchStocks(productId);
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => {
      const product = products.find(p => p.id === l.product_id);
      if (!product) return sum;
      const lineTotal = (l.unit_price * l.quantity) - l.discount_amount - (l.unit_price * l.quantity * l.discount_percent / 100);
      return sum + lineTotal;
    }, 0);
    
    const grandTotal = subtotal - discountTotal + taxTotal + shippingTotal;
    const due = grandTotal - paidTotal;
    
    return { subtotal, grandTotal, due };
  }, [lines, products, discountTotal, taxTotal, shippingTotal, paidTotal]);

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
    const order: SalesOrder | null = await SalesService.createOrder({
      branch_id: branchId,
      party_id: partyId || undefined,
      employee_id: employeeId || undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      discount_total: discountTotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      paid_total: paidTotal,
      due_total: totals.due,
      note,
      status: 'posted',
    } as Partial<SalesOrder>);
    if (!order) { setSubmitting(false); alert('Failed to create order'); return; }
    const ok = await SalesService.addItems(order.id, lines as unknown as Array<Omit<SalesOrderItem, 'id' | 'order_id' | 'total'>>);
    setSubmitting(false);
    if (ok) {
      router.push('/branch/sales');
    } else {
      alert('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <BranchSidebar />
        <div className="p-8 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
            <p className="text-gray-600">Create a new sales order for {userProfile?.branch_name || 'your branch'}</p>
          </div>
          <button
            onClick={() => router.push('/branch/sales')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Sales
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Party</label>
                <select value={partyId} onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Walk-in Customer</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.branch_id === null ? '(No Branch)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Employee</label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
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
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <button onClick={addLine} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Add Item
              </button>
            </div>
            <div className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Product</label>
                    <select value={line.product_id} onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Batch</label>
                    <select value={line.batch_number} onChange={(e) => setLine(idx, { batch_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="">Select Batch</option>
                      {batchStocks[line.product_id]?.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.product_batches?.batch_number} (Qty: {stock.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Quantity</label>
                    <input type="number" min="1" value={line.quantity} onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Unit Price</label>
                    <input type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => setLine(idx, { unit_price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Discount</label>
                    <input type="number" min="0" step="0.01" value={line.discount_amount} onChange={(e) => setLine(idx, { discount_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeLine(idx)} disabled={lines.length === 1}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Discount Total</label>
                <input type="number" min="0" step="0.01" value={discountTotal} onChange={(e) => setDiscountTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tax Total</label>
                <input type="number" min="0" step="0.01" value={taxTotal} onChange={(e) => setTaxTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Shipping Total</label>
                <input type="number" min="0" step="0.01" value={shippingTotal} onChange={(e) => setShippingTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Paid Amount</label>
                <input type="number" min="0" step="0.01" value={paidTotal} onChange={(e) => setPaidTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Subtotal</div>
                <div className="text-xl font-bold text-gray-900">BDT {totals.subtotal.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Grand Total</div>
                <div className="text-xl font-bold text-purple-600">BDT {totals.grandTotal.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Due</div>
                <div className="text-xl font-bold text-red-600">BDT {totals.due.toFixed(2)}</div>
              </div>
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
              {submitting ? 'Processing...' : 'Make Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
