'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BranchSidebar from '@/app/(branch)/branch/components/BranchSidebar';
import { PurchaseOrder, PurchaseOrderItem, Product, Supplier, Employee, PurchasePayment } from '@/types/user';
import { PurchaseService } from '@/lib/purchaseService';
import { ProductService } from '@/lib/productService';
import { SupplierService } from '@/lib/supplierService';
import { EmployeeService } from '@/lib/employeeService';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchEditPurchasePage() {
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
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    method: 'cash',
    reference: '',
  });

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
          alert('You can only edit purchase orders from your own branch');
          router.push('/branch/purchases');
          return;
        }

        setOrder(orderData);
        setItems(itemsData);
        setPayments(paymentsData);
        setProducts(productsData);
        setSuppliers(suppliersData);
        setEmployees(employeesData.filter(emp => emp.branch_id === userProfile.branch_id));
        
        if (orderData?.image_urls) {
          setUploadedImages(orderData.image_urls);
        }
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    setUploadingImages(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const imageUrl = await PurchaseService.uploadFile(file);
        return imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(url => url !== null) as string[];
      setUploadedImages(prev => [...prev, ...validUrls]);
      
      if (validUrls.length < files.length) {
        alert('Some images failed to upload. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
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

  const handleAddPayment = async () => {
    if (!order || newPayment.amount <= 0) return;

    try {
      const success = await PurchaseService.addPayment(order.id, {
        amount: newPayment.amount,
        method: newPayment.method,
        reference: newPayment.reference || undefined,
        paid_at: new Date().toISOString(),
      });

      if (success) {
        // Reload payments
        const updatedPayments = await PurchaseService.getOrderPayments(order.id);
        setPayments(updatedPayments);
        
        // Reset form
        setNewPayment({ amount: 0, method: 'cash', reference: '' });
        
        // Update order totals
        const updatedOrder = await PurchaseService.getOrderById(order.id);
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

  const handleSaveImages = async () => {
    if (!order) return;

    try {
      setSaving(true);
      const success = await PurchaseService.updateOrder(order.id, {
        image_urls: uploadedImages,
      });

      if (success) {
        alert('Images saved successfully');
      } else {
        alert('Failed to save images');
      }
    } catch (error) {
      console.error('Error saving images:', error);
      alert('Failed to save images');
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Purchase Order Not Found</h1>
            <p className="text-gray-600 mt-2">The purchase order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Purchase Order</h1>
            <p className="text-gray-600">Order #{order.id.slice(0, 8)} for {userProfile?.branch_name}</p>
          </div>
          <button
            onClick={() => router.push('/branch/purchases')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Purchases
          </button>
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
            </div>
          </div>

          {/* Invoice Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invoice Images</h2>
              <button
                onClick={handleSaveImages}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-white ${
                  saving ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Images'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
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
                  {uploadingImages ? 'Uploading...' : 'Add Images'}
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
