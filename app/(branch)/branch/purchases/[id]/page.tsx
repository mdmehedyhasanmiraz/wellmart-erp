'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BranchSidebar from '@/app/(branch)/branch/components/BranchSidebar';
import { PurchaseOrder, PurchaseOrderItem, Product, Supplier, Employee, PurchasePayment } from '@/types/user';
import { PurchaseService } from '@/lib/purchaseService';
import { ProductService } from '@/lib/productService';
import { SupplierService } from '@/lib/supplierService';
import { EmployeeService } from '@/lib/employeeService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchPurchaseViewPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { userProfile } = useAuth();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.branch_id) {
        console.error('No branch ID found for user');
        setLoading(false);
        return;
      }

      try {
        const [orderData, itemsData, paymentsData, productsData, suppliersData, employeesData] = await Promise.all([
          PurchaseService.getOrderById(orderId),
          PurchaseService.getOrderItems(orderId),
          PurchaseService.getOrderPayments(orderId),
          ProductService.getAllProducts(),
          SupplierService.getSuppliersByBranch(userProfile.branch_id),
          EmployeeService.getAll(),
        ]);

        // Check if order belongs to user's branch
        if (orderData && orderData.branch_id !== userProfile.branch_id) {
          alert('You can only view purchase orders from your own branch');
          router.push('/branch/purchases');
          return;
        }

        setOrder(orderData);
        setItems(itemsData);
        setPayments(paymentsData);
        setProducts(productsData);
        setSuppliers(suppliersData);
        setEmployees(employeesData.filter(emp => emp.branch_id === userProfile.branch_id));
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load purchase order data');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && userProfile?.branch_id) {
      loadData();
    }
  }, [orderId, userProfile?.branch_id, router]);

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
            <h1 className="text-2xl font-bold text-gray-900">Purchase Order Not Found</h1>
            <p className="text-gray-600 mt-2">The purchase order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <button
              onClick={() => router.push('/branch/purchases')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Purchases
            </button>
          </div>
        </div>
      </div>
    );
  }

  const supplier = suppliers.find(s => s.id === order.supplier_id);
  const employee = employees.find(e => e.id === order.employee_id);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <BranchSidebar />
      <div className="p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Order Details</h1>
            <p className="text-gray-600">Order #{order.id.slice(0, 8)} for {userProfile?.branch_name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open(`/api/purchase-invoice?orderId=${order.id}`, '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Invoice
            </button>
            <Link
              href={`/branch/purchases/${order.id}/edit`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Edit Order
            </Link>
            <button
              onClick={() => router.push('/branch/purchases')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Purchases
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <p className="mt-1 text-sm text-gray-900">{userProfile?.branch_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{order.supplier_name || 'Walk-in Supplier'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <p className="mt-1 text-sm text-gray-900">{employee?.name || 'N/A'}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated At</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(order.updated_at).toLocaleString()}</p>
              </div>
              {order.note && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <p className="mt-1 text-sm text-gray-900">{order.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Images */}
          {order.image_urls && order.image_urls.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Invoice Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.image_urls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Invoice ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div className="overflow-x-auto">
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
              <p className="text-gray-500">No payments recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
