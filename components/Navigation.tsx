'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navigation() {
  const { userProfile, signOut } = useAuth()
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">Wellmart ERP</Link>
        <nav className="flex items-center gap-4 text-sm">
          {userProfile?.role === 'admin' && <Link href="/admin" className="hover:text-purple-600">Admin</Link>}
          {userProfile?.role === 'branch' && <Link href="/branch" className="hover:text-purple-600">Branch</Link>}
          {userProfile?.role === 'employee' && <Link href="/employee" className="hover:text-purple-600">MPO</Link>}
          <button onClick={() => signOut()} className="px-3 py-1.5 border rounded hover:bg-gray-50">Sign out</button>
        </nav>
      </div>
    </header>
  )
}


