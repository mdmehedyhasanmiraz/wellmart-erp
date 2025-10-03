'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SalaryService, type SalaryProfile, type SalaryComponent } from '@/lib/salaryService'

export default function ManageSalaryPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const employeeId = params.id
  const [profiles, setProfiles] = useState<SalaryProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const list = await SalaryService.getProfilesByEmployee(employeeId)
      setProfiles(list)
      const active = list.find((p) => p.is_active) || list[0]
      if (active) {
        setSelectedProfileId(active.id)
        setComponents(await SalaryService.getComponents(active.id))
      }
    }
    load()
  }, [employeeId])

  async function onSelectProfile(id: string) {
    setSelectedProfileId(id)
    setComponents(await SalaryService.getComponents(id))
  }

  async function onAddComponent() {
    setComponents([
      ...components,
      {
        id: crypto.randomUUID(),
        profile_id: selectedProfileId!,
        component_type: 'other_earning',
        name: 'Component',
        is_earning: true,
        is_percentage: false,
        percent_value: 0,
        amount_value: 0,
        taxable: true,
        sort_order: (components[components.length - 1]?.sort_order || 0) + 1,
      } as SalaryComponent,
    ])
  }

  async function onSaveComponents() {
    if (!selectedProfileId) return
    setSaving(true)
    const ok = await SalaryService.upsertComponents(selectedProfileId, components)
    setSaving(false)
    if (ok) router.refresh()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manage Salary</h1>
      </div>
      <div className="flex gap-4">
        <div className="w-64">
          <div className="bg-white border rounded">
            <div className="px-3 py-2 font-medium border-b">Profiles</div>
            <ul>
              {profiles.map((p) => (
                <li key={p.id}>
                  <button className={`w-full text-left px-3 py-2 ${selectedProfileId === p.id ? 'bg-purple-50' : ''}`} onClick={() => onSelectProfile(p.id)}>
                    {new Date(p.effective_from).toLocaleDateString()} {p.is_active ? '(Active)' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white border rounded">
            <div className="px-3 py-2 flex items-center justify-between border-b">
              <div className="font-medium">Components</div>
              <div className="space-x-2">
                <button className="px-3 py-1 border rounded" onClick={onAddComponent}>Add</button>
                <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={onSaveComponents} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Earning</th>
                  <th className="text-left px-3 py-2">%?</th>
                  <th className="text-left px-3 py-2">Percent</th>
                  <th className="text-left px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Taxable</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c, idx) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">
                      <select value={c.component_type} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, component_type: e.target.value } : x)))} className="border rounded px-2 py-1">
                        {['basic','house_rent','medical','conveyance','bonus','commission','kpi','arrear','other_earning','pf_employee','pf_employer','tax','loan_repayment','advance_adjustment','other_deduction'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input value={c.name ?? ''} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))} className="border rounded px-2 py-1 w-full" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={!!c.is_earning} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, is_earning: e.target.checked } : x)))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={!!c.is_percentage} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, is_percentage: e.target.checked } : x)))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.001" value={c.percent_value ?? 0} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, percent_value: parseFloat(e.target.value) } : x)))} className="border rounded px-2 py-1 w-24" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={c.amount_value ?? 0} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, amount_value: parseFloat(e.target.value) } : x)))} className="border rounded px-2 py-1 w-28" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={!!c.taxable} onChange={(e) => setComponents(components.map((x, i) => (i === idx ? { ...x, taxable: e.target.checked } : x)))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


