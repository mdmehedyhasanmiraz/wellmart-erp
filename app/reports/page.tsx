import Navigation from '../components/Navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function ReportsPage() {
  const reportCategories = [
    {
      title: 'Sales Reports',
      icon: '💰',
      reports: [
        { name: 'Sales Summary', description: 'Overview of sales performance', period: 'Monthly' },
        { name: 'Product Sales', description: 'Best and worst selling products', period: 'Quarterly' },
        { name: 'Customer Sales', description: 'Sales by customer analysis', period: 'Monthly' },
        { name: 'Sales Trends', description: 'Sales trends and forecasting', period: 'Yearly' },
      ]
    },
    {
      title: 'Inventory Reports',
      icon: '📦',
      reports: [
        { name: 'Stock Levels', description: 'Current inventory levels', period: 'Real-time' },
        { name: 'Low Stock Alert', description: 'Items needing reorder', period: 'Daily' },
        { name: 'Inventory Valuation', description: 'Total inventory value', period: 'Monthly' },
        { name: 'Stock Movement', description: 'Inventory movement analysis', period: 'Weekly' },
      ]
    },
    {
      title: 'Financial Reports',
      icon: '📊',
      reports: [
        { name: 'Profit & Loss', description: 'P&L statement', period: 'Monthly' },
        { name: 'Cash Flow', description: 'Cash flow analysis', period: 'Monthly' },
        { name: 'Purchase Analysis', description: 'Purchase spending analysis', period: 'Quarterly' },
        { name: 'Cost Analysis', description: 'Product cost breakdown', period: 'Monthly' },
      ]
    },
    {
      title: 'Customer Reports',
      icon: '👥',
      reports: [
        { name: 'Customer Analysis', description: 'Customer behavior insights', period: 'Monthly' },
        { name: 'Customer Retention', description: 'Customer retention rates', period: 'Quarterly' },
        { name: 'Top Customers', description: 'Highest value customers', period: 'Monthly' },
        { name: 'Customer Growth', description: 'New customer acquisition', period: 'Monthly' },
      ]
    },
  ];

  const recentReports = [
    { name: 'Sales Summary - January 2024', type: 'Sales', generated: '2024-01-15', size: '2.3 MB' },
    { name: 'Inventory Levels Report', type: 'Inventory', generated: '2024-01-14', size: '1.8 MB' },
    { name: 'Customer Analysis - Q4 2023', type: 'Customer', generated: '2024-01-10', size: '3.1 MB' },
    { name: 'Profit & Loss - December 2023', type: 'Financial', generated: '2024-01-05', size: '1.5 MB' },
  ];

  const keyMetrics = [
    { title: 'Total Revenue', value: '$125,430', change: '+12.5%', trend: 'up' },
    { title: 'Gross Profit', value: '$45,230', change: '+8.2%', trend: 'up' },
    { title: 'Inventory Value', value: '$78,900', change: '+3.1%', trend: 'up' },
    { title: 'Customer Count', value: '1,234', change: '+5.8%', trend: 'up' },
  ];

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Generate and view comprehensive business reports</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-1">{metric.trend === 'up' ? '↗' : '↘'}</span>
                    {metric.change} from last period
                  </p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Categories */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {reportCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.reports.map((report, reportIndex) => (
                        <div key={reportIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{report.period}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{report.description}</p>
                          <button className="text-blue-600 text-xs font-medium hover:text-blue-800">
                            Generate Report →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentReports.map((report, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{report.name}</p>
                          <p className="text-xs text-gray-500">{report.type} • {report.generated}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{report.size}</p>
                          <button className="text-blue-600 text-xs hover:text-blue-800 mt-1">Download</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📊</span>
                      <div>
                        <p className="text-sm font-medium">Dashboard Overview</p>
                        <p className="text-xs text-gray-500">View key metrics</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📈</span>
                      <div>
                        <p className="text-sm font-medium">Export Data</p>
                        <p className="text-xs text-gray-500">Export to Excel/CSV</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">⏰</span>
                      <div>
                        <p className="text-sm font-medium">Schedule Reports</p>
                        <p className="text-xs text-gray-500">Automated reporting</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🎯</span>
                      <div>
                        <p className="text-sm font-medium">Custom Reports</p>
                        <p className="text-xs text-gray-500">Create custom analysis</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Report Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                      <option>Last year</option>
                      <option>Custom range</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All Reports</option>
                      <option>Sales Reports</option>
                      <option>Inventory Reports</option>
                      <option>Financial Reports</option>
                      <option>Customer Reports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                      <option>HTML</option>
                    </select>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
