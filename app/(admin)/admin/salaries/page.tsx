'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SalaryService, type SalaryProfile } from '@/lib/salaryService'
import { EmployeeService } from '@/lib/employeeService'

type EmployeeLite = { id: string; name: string; employee_code: string }

export default function SalariesPage() {
  const [profilesByEmployee, setProfilesByEmployee] = useState<Record<string, SalaryProfile[]>>({})
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const emps = (await EmployeeService.getAll()).map((e: any) => ({ id: e.id, name: e.name, employee_code: e.employee_code }))
      const result: Record<string, SalaryProfile[]> = {}
      for (const emp of emps) {
        result[emp.id] = await SalaryService.getProfilesByEmployee(emp.id)
      }
      setEmployees(emps)
      setProfilesByEmployee(result)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Employee Salaries</h1>
        <Link href="/admin/salaries/new" className="px-4 py-2 bg-purple-600 text-white rounded">New Profile</Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2">Employee</th>
                <th className="text-left px-4 py-2">Code</th>
                <th className="text-left px-4 py-2">Active Profile</th>
                <th className="text-left px-4 py-2">Gross</th>
                <th className="text-left px-4 py-2">Basic</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const active = (profilesByEmployee[e.id] || []).find((p) => p.is_active)
                return (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-2">{e.name}</td>
                    <td className="px-4 py-2">{e.employee_code}</td>
                    <td className="px-4 py-2">{active ? new Date(active.effective_from).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">{active?.monthly_gross?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-2">{active?.monthly_basic?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/salaries/${e.id}`} className="text-purple-600">Manage</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


