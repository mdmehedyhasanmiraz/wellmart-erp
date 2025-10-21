'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/app/(admin)/admin/components/AdminSidebar';
import { SalesOrder, SalesOrderItem, Product, Branch, Party, Employee, SalesPayment } from '@/types/user';
import { SalesService } from '@/lib/salesService';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { PartyService } from '@/lib/partyService';
import { EmployeeService } from '@/lib/employeeService';

export default function EditSalesPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [payments, setPayments] = useState<SalesPayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [shippingTotal, setShippingTotal] = useState(0);
  const [note, setNote] = useState('');

  // Payment form states
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState('cash');
  const [newPaymentReference, setNewPaymentReference] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all necessary data
        const [orderData, itemsData, paymentsData, productsData, branchesData, partiesData, employeesData] = await Promise.all([
          SalesService.getOrderById(orderId),
          SalesService.getOrderItems(orderId),
          SalesService.getOrderPayments(orderId),
          ProductService.getAllProducts(),
          BranchService.getAll(),
          PartyService.list(),
          EmployeeService.getAll()
        ]);

        if (!orderData) {
          alert('Order not found');
          router.push('/admin/sales');
          return;
        }

        setOrder(orderData);
        setItems(itemsData || []);
        setPayments(paymentsData || []);
        setProducts(productsData);
        setBranches(branchesData);
        setParties(partiesData);
        setEmployees(employeesData);

        // Populate form with order data
        setCustomerName(orderData.customer_name || '');
        setCustomerPhone(orderData.customer_phone || '');
        setDiscountTotal(orderData.discount_total || 0);
        setTaxTotal(orderData.tax_total || 0);
        setShippingTotal(orderData.shipping_total || 0);
        setNote(orderData.note || '');

      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load order data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, router]);

  const handleSave = async () => {
    if (!order) return;
    
    setSaving(true);
    try {
      const updated = await SalesService.updateOrder(orderId, {
        customer_name: customerName,
        customer_phone: customerPhone,
        discount_total: discountTotal,
        tax_total: taxTotal,
        shipping_total: shippingTotal,
        note,
      });

      if (updated) {
        alert('Order updated successfully');
        router.push('/admin/sales');
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!order || newPaymentAmount <= 0) return;

    setSaving(true);
    try {
      const success = await SalesService.addPayment(orderId, {
        amount: newPaymentAmount,
        method: newPaymentMethod,
        reference: newPaymentReference,
      });

      if (success) {
        // Reload payments
        const paymentsData = await SalesService.getOrderPayments(orderId);
        setPayments(paymentsData || []);
        
        // Reset form
        setNewPaymentAmount(0);
        setNewPaymentReference('');
        
        alert('Payment added successfully');
      } else {
        alert('Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const grandTotal = Math.max(subtotal - discountTotal + taxTotal + shippingTotal, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const dueTotal = Math.max(grandTotal - totalPaid, 0);
    
    return { subtotal, grandTotal, totalPaid, dueTotal };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="p-8 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="p-8 w-full">
          <div className="text-center text-gray-500">Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open(`/api/invoice?orderId=${order.id}`, '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Invoice
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} transition-colors`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Customer Phone</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Discount</label>
                  <input
                    type="number"
                    min="0"
                    value={discountTotal}
                    onChange={(e) => setDiscountTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Tax</label>
                  <input
                    type="number"
                    min="0"
                    value={taxTotal}
                    onChange={(e) => setTaxTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Shipping</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingTotal}
                    onChange={(e) => setShippingTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Management */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Management</h2>
            
            {/* Add New Payment */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Add New Payment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={totals.dueTotal}
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Reference</label>
                  <input
                    value={newPaymentReference}
                    onChange={(e) => setNewPaymentReference(e.target.value)}
                    placeholder="Transaction ID, Check #, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleAddPayment}
                  disabled={saving || newPaymentAmount <= 0}
                  className={`w-full px-4 py-2 rounded-lg text-white ${saving || newPaymentAmount <= 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
                >
                  {saving ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="font-medium mb-3">Payment History</h3>
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">BDT {payment.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">
                          {payment.method} • {new Date(payment.paid_at).toLocaleDateString()}
                        </div>
                        {payment.reference && (
                          <div className="text-xs text-gray-500">Ref: {payment.reference}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No payments recorded</div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm">
                      {products.find(p => p.id === item.product_id)?.name || 'Unknown Product'}
                    </td>
                    <td className="px-4 py-2 text-sm">{item.batch_number || '-'}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">BDT {item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">BDT {item.discount_amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">BDT {item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="text-lg font-semibold">BDT {totals.subtotal.toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Grand Total</div>
              <div className="text-lg font-semibold">BDT {totals.grandTotal.toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Paid</div>
              <div className="text-lg font-semibold text-green-600">BDT {totals.totalPaid.toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600">Due Amount</div>
              <div className="text-lg font-semibold text-red-600">BDT {totals.dueTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
