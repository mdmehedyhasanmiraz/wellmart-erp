'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  PlusCircle,
  ArrowLeftRight,
  ShoppingCart,
  Receipt,
  Users,
  UserCog,
  Factory,
  User,
  GitBranch,
  BarChart3,
  Settings as SettingsIcon,
  Briefcase,
  Banknote,
} from 'lucide-react';

const adminMenuItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: <Boxes className="w-5 h-5" />,
  },
  {
    name: 'Inventory',
    href: '/admin/inventory',
    icon: <Warehouse className="w-5 h-5" />,
  },
  {
    name: 'Add Stock',
    href: '/admin/inventory/add-stock',
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    name: 'Transfers',
    href: '/admin/inventory/transfers',
    icon: <ArrowLeftRight className="w-5 h-5" />,
  },
  {
    name: 'Sales',
    href: '/admin/sales',
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    name: 'Purchases',
    href: '/admin/purchases',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    name: 'Parties',
    href: '/admin/parties',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Employees',
    href: '/admin/employees',
    icon: <UserCog className="w-5 h-5" />,
  },
  {
    name: 'Designations',
    href: '/admin/designations',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    name: 'Allowances',
    href: '/admin/allowances',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    name: 'Salaries',
    href: '/admin/salaries',
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    name: 'Payroll',
    href: '/admin/payroll',
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    name: 'Suppliers',
    href: '/admin/suppliers',
    icon: <Factory className="w-5 h-5" />,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: <User className="w-5 h-5" />,
  },
  {
    name: 'Branches',
    href: '/admin/branches',
    icon: <GitBranch className="w-5 h-5" />,
  },
  // {
  //   name: 'Categories',
  //   href: '/admin/categories',
  //   icon: <Tags className="w-5 h-5" />,
  // },
  // {
  //   name: 'Companies',
  //   href: '/admin/companies',
  //   icon: <Building2 className="w-5 h-5" />,
  // },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  // {
  //   name: 'Settings',
  //   href: '/admin/settings',
  //   icon: <SettingsIcon className="w-5 h-5" />,
  // },
  // {
  //   name: 'Debug',
  //   href: '/admin/debug',
  //   icon: <SettingsIcon className="w-5 h-5" />,
  // },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();

  // Group menu items by category
  const menuGroups = [
    {
      title: 'Overview',
      items: adminMenuItems.slice(0, 1), // Dashboard
    },
    {
      title: 'Operations',
      items: adminMenuItems.slice(1, 7), // Products, Inventory, Add Stock, Transfers, Sales, Purchases
    },
    {
      title: 'Management',
      items: adminMenuItems.slice(7, 13), // Parties, Employees, Designations, Allowances, Suppliers, Users
    },
    {
      title: 'Configuration',
      items: adminMenuItems.slice(13), // Branches, Reports, Settings
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Admin Panel</h1>
            <p className="text-white/90 text-sm">Wellcare ERP</p>
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
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : 'text-black hover:bg-white hover:text-purple-600 hover:shadow-sm'
                      }`}
                    >
                      <div className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'}`}>
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
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {userProfile?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-black font-medium text-sm">{userProfile?.name || 'Admin'}</p>
            <p className="text-gray-500 text-xs">Administrator</p>
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
