'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SalaryService } from '@/lib/salaryService'

type NewRunForm = {
  branch_id: string | null
  period_year: number
  period_month: number
  from_date: string
  to_date: string
}

export default function NewPayrollRunPage() {
  const router = useRouter()
  const today = new Date()
  const [form, setForm] = useState<NewRunForm>({
    branch_id: null,
    period_year: today.getFullYear(),
    period_month: today.getMonth() + 1,
    from_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    to_date: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const run = await SalaryService.createRun(form)
    setSaving(false)
    if (run) router.push(`/admin/payroll/${run.id}`)
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">New Payroll Run</h1>
      <form onSubmit={onSubmit} className="bg-white border rounded p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm">Year</span>
            <input type="number" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: parseInt(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Month</span>
            <input type="number" min={1} max={12} value={form.period_month} onChange={(e) => setForm({ ...form, period_month: parseInt(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">From Date</span>
            <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">To Date</span>
            <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} className="border rounded px-2 py-2 w-full" />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}


