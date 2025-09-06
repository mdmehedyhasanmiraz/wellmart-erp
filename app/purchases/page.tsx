import Navigation from '../components/Navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function PurchasesPage() {
  const purchaseOrders = [
    { id: 'PO001', supplier: 'NutriLife Suppliers', date: '2024-01-15', items: 12, total: 4500.00, status: 'Received' },
    { id: 'PO002', supplier: 'ProteinPlus Ltd', date: '2024-01-14', items: 8, total: 3200.00, status: 'In Transit' },
    { id: 'PO003', supplier: 'HealthFirst Inc', date: '2024-01-13', items: 15, total: 2800.00, status: 'Pending' },
    { id: 'PO004', supplier: 'Vitamins Direct', date: '2024-01-12', items: 6, total: 1200.00, status: 'Received' },
    { id: 'PO005', supplier: 'NutriLife Suppliers', date: '2024-01-11', items: 10, total: 2100.00, status: 'Processing' },
  ];

  const suppliers = [
    { name: 'NutriLife Suppliers', orders: 15, total: 12500.00, rating: 4.8 },
    { name: 'ProteinPlus Ltd', orders: 8, total: 8900.00, rating: 4.6 },
    { name: 'HealthFirst Inc', orders: 12, total: 6700.00, rating: 4.7 },
    { name: 'Vitamins Direct', orders: 6, total: 3200.00, rating: 4.5 },
  ];

  const totalPurchases = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = purchaseOrders.filter(order => order.status === 'Pending').length;
  const inTransitOrders = purchaseOrders.filter(order => order.status === 'In Transit').length;

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600 mt-2">Manage your purchase orders and supplier relationships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">${totalPurchases.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">+8.2% from last month</p>
              </div>
              <div className="text-3xl">🛒</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
                <p className="text-sm text-blue-600 mt-1">This month</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-yellow-600">{inTransitOrders}</p>
                <p className="text-sm text-gray-600 mt-1">Orders shipping</p>
              </div>
              <div className="text-3xl">🚚</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">{pendingOrders}</p>
                <p className="text-sm text-gray-600 mt-1">Awaiting approval</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Purchase Orders Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  New Purchase Order
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.items}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'Received' ? 'bg-green-100 text-green-800' :
                            order.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Pending' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Suppliers</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.orders} orders • ⭐ {supplier.rating}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${supplier.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm font-medium">Create PO</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-medium">Purchase Report</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">🏭</div>
                <p className="text-sm font-medium">Manage Suppliers</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-sm font-medium">Payment Tracking</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
