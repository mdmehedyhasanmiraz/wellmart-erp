'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Branch } from '@/types/user';
import { BranchService } from '@/lib/branchService';

const branchMenuItems = [
  {
    name: 'Dashboard',
    href: '/branch',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
  },
  {
    name: 'Products',
    href: '/branch/products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    name: 'Inventory',
    href: '/branch/inventory',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    name: 'Add Stock',
    href: '/branch/inventory/add-stock',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    name: 'Transfers',
    href: '/branch/transfers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 17l-5-5 5-5" />
      </svg>
    ),
  },
  {
    name: 'Sales',
    href: '/branch/sales',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
    ),
  },
  {
    name: 'Purchases',
    href: '/branch/purchases',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    name: 'Parties',
    href: '/branch/parties',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
  },
  {
    name: 'Suppliers',
    href: '/branch/suppliers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Employees',
    href: '/branch/employees',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
      </svg>
    ),
  },
  {
    name: 'Designations',
    href: '/branch/designations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
      </svg>
    ),
  },
  {
    name: 'Allowances',
    href: '/branch/allowances',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
      </svg>
    ),
  },
  {
    name: 'Users',
    href: '/branch/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: 'Branches',
    href: '/branch/branches',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l6 6m0 0l6-6m-6 6v6" />
      </svg>
    ),
  },
  {
    name: 'Reports',
    href: '/branch/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/branch/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BranchSidebar() {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranchDetails = async () => {
      if (!userProfile?.branch_id) {
        setLoading(false);
        return;
      }
      
      try {
        const branchData = await BranchService.getById(userProfile.branch_id);
        setBranch(branchData);
      } catch (error) {
        console.error('Error loading branch details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranchDetails();
  }, [userProfile?.branch_id]);

  // Filter menu items based on branch code
  const filteredMenuItems = branchMenuItems.filter(item => {
    // Show "Add Stock" only for MAIN branch users
    if (item.name === 'Add Stock') {
      return branch?.code === 'MAIN';
    }
    return true;
  });

  // Group menu items by category
  const menuGroups = [
    {
      title: 'Overview',
      items: filteredMenuItems.slice(0, 1), // Dashboard
    },
    {
      title: 'Operations',
      items: filteredMenuItems.slice(1, filteredMenuItems.findIndex(item => item.name === 'Purchases') + 1), // Products, Inventory, Add Stock (if MAIN), Transfers, Sales, Purchases
    },
    {
      title: 'Management',
      items: filteredMenuItems.slice(filteredMenuItems.findIndex(item => item.name === 'Parties'), filteredMenuItems.findIndex(item => item.name === 'Branches')), // Parties, Suppliers, Employees, Designations, Allowances, Users
    },
    {
      title: 'Organization',
      items: filteredMenuItems.slice(filteredMenuItems.findIndex(item => item.name === 'Branches'), filteredMenuItems.findIndex(item => item.name === 'Reports')), // Branches
    },
    {
      title: 'Reports',
      items: filteredMenuItems.slice(filteredMenuItems.findIndex(item => item.name === 'Reports'), filteredMenuItems.findIndex(item => item.name === 'Settings')), // Reports
    },
    {
      title: 'System',
      items: filteredMenuItems.slice(filteredMenuItems.findIndex(item => item.name === 'Settings')), // Settings
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Branch Panel</h1>
            <p className="text-white/90 text-sm">Wellmart ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <nav className="p-4 space-y-6">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'text-black hover:bg-white hover:text-emerald-600 hover:shadow-sm'
                      }`}
                    >
                      <div className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'}`}>
                        {item.icon}
                      </div>
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {userProfile?.name?.charAt(0) || 'B'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-black font-medium text-sm">{userProfile?.name || 'Branch Manager'}</p>
            <p className="text-gray-500 text-xs">Branch Manager</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Sign Out"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
