'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SalaryService, type PayrollRunItem } from '@/lib/salaryService'

export default function EmployeeSalaryPage() {
  const { userProfile } = useAuth()
  const [items, setItems] = useState<PayrollRunItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!userProfile?.id) return
      setLoading(true)
      const data = await SalaryService.listRunItemsByEmployee(userProfile.id)
      setItems(data)
      setLoading(false)
    }
    load()
  }, [userProfile?.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Salary</h1>
          <p className="text-white/70">View your recent payroll items</p>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-white font-semibold">Payslips</h2>
        </div>
        {loading ? (
          <div className="p-6 text-white/70">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-white/70">No payslips found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/10 text-white/80">
                <tr>
                  <th className="px-4 py-2 text-left">Gross</th>
                  <th className="px-4 py-2 text-left">Earnings</th>
                  <th className="px-4 py-2 text-left">Deductions</th>
                  <th className="px-4 py-2 text-left">Net</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-white/10 text-white/90">
                    <td className="px-4 py-2">{i.gross_pay.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.total_earnings.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.total_deductions.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.net_pay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


