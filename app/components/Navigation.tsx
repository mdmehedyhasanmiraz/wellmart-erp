'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Inventory', href: '/inventory', icon: '📦' },
  { name: 'Sales', href: '/sales', icon: '💰' },
  { name: 'Purchases', href: '/purchases', icon: '🛒' },
  { name: 'Customers', href: '/customers', icon: '👥' },
  { name: 'Suppliers', href: '/suppliers', icon: '🏭' },
  { name: 'Reports', href: '/reports', icon: '📈' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Wellmart ERP</h1>
        <p className="text-sm text-gray-600">Wellcare Nutriscience Ltd</p>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {userProfile?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {userProfile?.role?.toUpperCase() || 'User'} • {userProfile?.branch_name || 'Main'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
