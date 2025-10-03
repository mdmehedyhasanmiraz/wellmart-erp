'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SalaryService } from '@/lib/salaryService'
import { EmployeeService } from '@/lib/employeeService'

export default function NewSalaryProfilePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    employee_id: '',
    effective_from: new Date().toISOString().slice(0, 10),
    currency: 'BDT',
    monthly_gross: 0,
    monthly_basic: 0,
    house_rent_percent: 0,
    medical_allowance: 0,
    conveyance_allowance: 0,
    pf_employee_percent: 0,
    pf_employer_percent: 0,
    tax_monthly: 0,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    EmployeeService.getAll().then((list: any[]) => setEmployees(list))
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const created = await SalaryService.createProfile(form)
    setSaving(false)
    if (created) {
      router.push(`/admin/salaries/${created.employee_id}`)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">New Salary Profile</h1>
      <form onSubmit={onSubmit} className="bg-white border rounded p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm">Employee</span>
            <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="border rounded px-2 py-2 w-full" required>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm">Effective From</span>
            <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} className="border rounded px-2 py-2 w-full" required />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Monthly Gross</span>
            <input type="number" step="0.01" value={form.monthly_gross} onChange={(e) => setForm({ ...form, monthly_gross: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Monthly Basic</span>
            <input type="number" step="0.01" value={form.monthly_basic} onChange={(e) => setForm({ ...form, monthly_basic: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">House Rent %</span>
            <input type="number" step="0.001" value={form.house_rent_percent} onChange={(e) => setForm({ ...form, house_rent_percent: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Medical Allowance</span>
            <input type="number" step="0.01" value={form.medical_allowance} onChange={(e) => setForm({ ...form, medical_allowance: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Conveyance Allowance</span>
            <input type="number" step="0.01" value={form.conveyance_allowance} onChange={(e) => setForm({ ...form, conveyance_allowance: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">PF Employee %</span>
            <input type="number" step="0.001" value={form.pf_employee_percent} onChange={(e) => setForm({ ...form, pf_employee_percent: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">PF Employer %</span>
            <input type="number" step="0.001" value={form.pf_employer_percent} onChange={(e) => setForm({ ...form, pf_employer_percent: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Tax Monthly</span>
            <input type="number" step="0.01" value={form.tax_monthly} onChange={(e) => setForm({ ...form, tax_monthly: parseFloat(e.target.value) })} className="border rounded px-2 py-2 w-full" />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded" disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}


