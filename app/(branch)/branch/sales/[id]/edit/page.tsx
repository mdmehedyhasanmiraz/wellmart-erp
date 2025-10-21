'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BranchSidebar from '@/app/(branch)/branch/components/BranchSidebar';
import { SalesOrder, SalesOrderItem, Product, Branch, Party, Employee, SalesPayment } from '@/types/user';
import { SalesService } from '@/lib/salesService';
import { ProductService } from '@/lib/productService';
import { BranchService } from '@/lib/branchService';
import { PartyService } from '@/lib/partyService';
import { EmployeeService } from '@/lib/employeeService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchEditSalePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { userProfile } = useAuth();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [payments, setPayments] = useState<SalesPayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    method: 'cash',
    reference: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!userProfile?.branch_id) {
          console.error('No branch ID found for user');
          return;
        }

        const [orderData, itemsData, paymentsData, productsData, branchesData, partiesData, employeesData] = await Promise.all([
          SalesService.getOrderById(orderId),
          SalesService.getOrderItems(orderId),
          SalesService.getOrderPayments(orderId),
          ProductService.getAllProducts(),
          BranchService.getAll(),
          PartyService.getAllParties(),
          EmployeeService.getAll(),
        ]);

        // Verify the order belongs to the user's branch
        if (orderData && orderData.branch_id !== userProfile.branch_id) {
          alert('You can only edit sales orders from your own branch');
          router.push('/branch/sales');
          return;
        }

        setOrder(orderData);
        setItems(itemsData);
        setPayments(paymentsData);
        setProducts(productsData);
        setBranches(branchesData);
        setParties(partiesData.filter(party => party.branch_id === userProfile.branch_id || party.branch_id === null));
        setEmployees(employeesData.filter(emp => emp.branch_id === userProfile.branch_id));
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load sales order data');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && userProfile?.branch_id) {
      loadData();
    }
  }, [orderId, userProfile?.branch_id, router]);

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || 'Unknown Branch';
  };

  const getPartyName = (partyId?: string) => {
    if (!partyId) return 'Walk-in Customer';
    return parties.find(p => p.id === partyId)?.name || 'Unknown Party';
  };

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return 'N/A';
    return employees.find(e => e.id === employeeId)?.name || 'Unknown Employee';
  };

  const handleAddPayment = async () => {
    if (!order || newPayment.amount <= 0) return;

    try {
      const success = await SalesService.addPayment(order.id, {
        amount: newPayment.amount,
        method: newPayment.method,
        reference: newPayment.reference || undefined,
        paid_at: new Date().toISOString(),
      });

      if (success) {
        // Reload payments
        const updatedPayments = await SalesService.getOrderPayments(order.id);
        setPayments(updatedPayments);
        
        // Reset form
        setNewPayment({ amount: 0, method: 'cash', reference: '' });
        
        // Update order totals
        const updatedOrder = await SalesService.getOrderById(order.id);
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
      } else {
        alert('Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <BranchSidebar />
        <div className="p-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Sales Order Not Found</h1>
            <p className="text-gray-600 mt-2">The sales order you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => router.push('/branch/sales')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Sales
            </button>
          </div>
        </div>
      </div>
    );
  }

  const branch = branches.find(b => b.id === order.branch_id);
  const party = parties.find(p => p.id === order.party_id);
  const employee = employees.find(e => e.id === order.employee_id);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Sales Order</h1>
            <p className="text-gray-600">Order #{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={() => router.push('/branch/sales')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Sales
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <p className="mt-1 text-sm text-gray-900">{branch?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="mt-1 text-sm text-gray-900">{order.customer_name || getPartyName(order.party_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <p className="mt-1 text-sm text-gray-900">{getEmployeeName(order.employee_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'posted' ? 'bg-green-100 text-green-800' : 
                  order.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grand Total</label>
                <p className="mt-1 text-sm text-gray-900">BDT {order.grand_total.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Amount</label>
                <p className="mt-1 text-sm text-gray-900">BDT {order.due_total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product?.name || 'Unknown Product'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.batch_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          BDT {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          BDT {item.total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            
            {payments.length > 0 ? (
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.paid_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          BDT {payment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No payments recorded yet.</p>
            )}

            {/* Add New Payment */}
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold mb-4">Add New Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={order.due_total}
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                  <input
                    type="text"
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Optional reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPayment}
                    disabled={newPayment.amount <= 0}
                    className={`w-full px-4 py-2 rounded-lg text-white ${
                      newPayment.amount <= 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
