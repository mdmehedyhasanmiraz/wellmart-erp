import Navigation from '../components/Navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function SalesPage() {
  const salesData = [
    { id: 'SO001', customer: 'ABC Pharmacy', date: '2024-01-15', items: 5, total: 2450.00, status: 'Completed' },
    { id: 'SO002', customer: 'XYZ Health Store', date: '2024-01-14', items: 3, total: 1890.00, status: 'Completed' },
    { id: 'SO003', customer: 'Wellness Center', date: '2024-01-14', items: 8, total: 3200.00, status: 'Pending' },
    { id: 'SO004', customer: 'Health Plus', date: '2024-01-13', items: 2, total: 890.00, status: 'Completed' },
    { id: 'SO005', customer: 'NutriMart', date: '2024-01-13', items: 6, total: 1560.00, status: 'Processing' },
  ];

  const topProducts = [
    { name: 'Vitamin D3 1000IU', sales: 125, revenue: 1998.75 },
    { name: 'Whey Protein 2kg', sales: 89, revenue: 4093.11 },
    { name: 'Omega-3 Fish Oil', sales: 156, revenue: 3510.00 },
    { name: 'Multivitamin Complex', sales: 203, revenue: 3806.25 },
  ];

  const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
  const completedSales = salesData.filter(sale => sale.status === 'Completed').length;
  const pendingSales = salesData.filter(sale => sale.status === 'Pending').length;

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your sales orders and revenue</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">${totalSales.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">+12.5% from last month</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{salesData.length}</p>
                <p className="text-sm text-blue-600 mt-1">+8 orders this week</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedSales}</p>
                <p className="text-sm text-gray-600 mt-1">Orders completed</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingSales}</p>
                <p className="text-sm text-gray-600 mt-1">Orders pending</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Orders Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  New Sale
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.items}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.total.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {sale.status}
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

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
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
                <div className="text-2xl mb-2">💰</div>
                <p className="text-sm font-medium">Create Invoice</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-medium">Sales Report</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">🔄</div>
                <p className="text-sm font-medium">Process Returns</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <div className="text-2xl mb-2">📧</div>
                <p className="text-sm font-medium">Send Reminders</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
