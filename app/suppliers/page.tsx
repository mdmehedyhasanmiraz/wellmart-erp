import Navigation from '../components/Navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function SuppliersPage() {
  const suppliers = [
    { id: 'S001', name: 'NutriLife Suppliers', email: 'orders@nutrilife.com', phone: '+1-555-0201', address: '100 Industrial Blvd, City, State', contactPerson: 'John Smith', rating: 4.8, totalOrders: 25, totalValue: 45000.00, status: 'Active' },
    { id: 'S002', name: 'ProteinPlus Ltd', email: 'sales@proteinplus.com', phone: '+1-555-0202', address: '200 Manufacturing St, City, State', contactPerson: 'Sarah Johnson', rating: 4.6, totalOrders: 18, totalValue: 32000.00, status: 'Active' },
    { id: 'S003', name: 'HealthFirst Inc', email: 'info@healthfirst.com', phone: '+1-555-0203', address: '300 Wellness Ave, City, State', contactPerson: 'Mike Davis', rating: 4.7, totalOrders: 22, totalValue: 28000.00, status: 'Active' },
    { id: 'S004', name: 'Vitamins Direct', email: 'contact@vitaminsdirect.com', phone: '+1-555-0204', address: '400 Supplement Rd, City, State', contactPerson: 'Lisa Wilson', rating: 4.5, totalOrders: 12, totalValue: 15000.00, status: 'Inactive' },
    { id: 'S005', name: 'Organic Solutions', email: 'orders@organicsolutions.com', phone: '+1-555-0205', address: '500 Green St, City, State', contactPerson: 'David Brown', rating: 4.9, totalOrders: 8, totalValue: 12000.00, status: 'Active' },
  ];

  const recentOrders = [
    { supplier: 'NutriLife Suppliers', product: 'Vitamin D3 1000IU', quantity: 1000, amount: 15990.00, date: '2024-01-15', status: 'Delivered' },
    { supplier: 'ProteinPlus Ltd', product: 'Whey Protein 2kg', quantity: 200, amount: 9198.00, date: '2024-01-14', status: 'In Transit' },
    { supplier: 'HealthFirst Inc', product: 'Omega-3 Fish Oil', quantity: 500, amount: 11250.00, date: '2024-01-13', status: 'Delivered' },
    { supplier: 'Vitamins Direct', product: 'Multivitamin Complex', quantity: 300, amount: 5625.00, date: '2024-01-12', status: 'Processing' },
  ];

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(supplier => supplier.status === 'Active').length;
  const totalValue = suppliers.reduce((sum, supplier) => sum + supplier.totalValue, 0);
  const avgRating = (suppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / suppliers.length).toFixed(1);

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600 mt-2">Manage your supplier relationships and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
                <p className="text-sm text-green-600 mt-1">+2 new this quarter</p>
              </div>
              <div className="text-3xl">🏭</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-600">{activeSuppliers}</p>
                <p className="text-sm text-gray-600 mt-1">Currently active</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-blue-600 mt-1">Purchased this year</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{avgRating}⭐</p>
                <p className="text-sm text-gray-600 mt-1">Supplier quality</p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Suppliers Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Supplier Directory</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Supplier
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <p>{supplier.contactPerson}</p>
                            <p>{supplier.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.totalOrders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.totalValue.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="text-yellow-400">⭐</span>
                            <span className="ml-1">{supplier.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                          <button className="text-purple-600 hover:text-purple-900">Orders</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{order.supplier}</p>
                        <p className="text-xs text-gray-500">{order.product}</p>
                        <p className="text-xs text-gray-500">Qty: {order.quantity} • {order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${order.amount.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Suppliers by Value</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {suppliers
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, 5)
                  .map((supplier, index) => (
                    <div key={supplier.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                          <p className="text-xs text-gray-500">{supplier.totalOrders} orders • ⭐ {supplier.rating}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${supplier.totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">🏭</div>
                  <p className="text-sm font-medium">Add Supplier</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm font-medium">Create PO</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm font-medium">Performance Report</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">⭐</div>
                  <p className="text-sm font-medium">Rate Supplier</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
