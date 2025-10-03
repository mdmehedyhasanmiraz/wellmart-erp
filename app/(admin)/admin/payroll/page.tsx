'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SalaryService, type PayrollRun } from '@/lib/salaryService'
import { useAuth } from '@/contexts/AuthContext'

export default function PayrollPage() {
  const { user } = useAuth()
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setRuns(await SalaryService.listRuns())
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Payroll</h1>
        <Link href="/admin/payroll/new" className="px-4 py-2 bg-purple-600 text-white rounded">New Run</Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2">Period</th>
                <th className="text-left px-4 py-2">From</th>
                <th className="text-left px-4 py-2">To</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Gross</th>
                <th className="text-left px-4 py-2">Net</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.period_year}-{String(r.period_month).padStart(2, '0')}</td>
                  <td className="px-4 py-2">{new Date(r.from_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(r.to_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{r.total_gross.toFixed(2)}</td>
                  <td className="px-4 py-2">{r.total_net.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/payroll/${r.id}`} className="text-purple-600">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


