'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SalaryService, type PayrollRunItem, type PayrollRun } from '@/lib/salaryService'
import { useAuth } from '@/contexts/AuthContext'

export default function PayrollRunPage() {
  const params = useParams() as { id: string }
  const runId = params.id
  const { userProfile } = useAuth()
  const [run, setRun] = useState<PayrollRun | null>(null)
  const [items, setItems] = useState<PayrollRunItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function reload() {
    setLoading(true)
    const list = await SalaryService.listRuns()
    const current = list.find((r) => r.id === runId) || null
    setRun(current)
    setItems(await SalaryService.getRunItems(runId))
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [runId])

  async function onGenerate() {
    setBusy(true)
    await SalaryService.generate(runId)
    setBusy(false)
    reload()
  }

  async function onApprove() {
    if (!userProfile?.id) return
    setBusy(true)
    await SalaryService.approve(runId, userProfile.id)
    setBusy(false)
    reload()
  }

  async function onPay() {
    if (!userProfile?.id) return
    setBusy(true)
    await SalaryService.pay(runId, userProfile.id)
    setBusy(false)
    reload()
  }

  return (
    <div className="p-6 space-y-4">
      {loading ? (
        <div>Loading...</div>
      ) : !run ? (
        <div>Run not found</div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Payroll {run.period_year}-{String(run.period_month).padStart(2, '0')}</h1>
            <div className="space-x-2">
              <button className="px-3 py-1 border rounded" onClick={onGenerate} disabled={busy || run.status !== 'draft'}>Generate</button>
              <button className="px-3 py-1 border rounded" onClick={onApprove} disabled={busy || (run.status !== 'draft' && run.status !== 'locked')}>Approve</button>
              <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={onPay} disabled={busy || run.status !== 'approved'}>Pay</button>
            </div>
          </div>
          <div className="bg-white border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2">Employee</th>
                  <th className="text-left px-4 py-2">Gross</th>
                  <th className="text-left px-4 py-2">Earnings</th>
                  <th className="text-left px-4 py-2">Deductions</th>
                  <th className="text-left px-4 py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-2">{i.employee_id.slice(0, 8)}</td>
                    <td className="px-4 py-2">{i.gross_pay.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.total_earnings.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.total_deductions.toFixed(2)}</td>
                    <td className="px-4 py-2">{i.net_pay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}


