'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PartyService } from '@/lib/partyService'

export default function NewCustomerPage() {
  const { userProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    country: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userProfile) return
    setSaving(true)
    await PartyService.create({
      ...form,
      employee_id: userProfile.id,
      branch_id: userProfile.branch_id,
    } as any)
    setSaving(false)
    setForm({ name: '', contact_person: '', phone: '', email: '', address_line1: '', city: '', country: '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Customer</h1>
        <p className="text-white/70">Add a customer associated with your branch</p>
      </div>
      <form onSubmit={onSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-white/80">Name</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Contact Person</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.contact_person} onChange={(e)=>setForm({...form, contact_person: e.target.value})} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Phone</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Email</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-white/80">Address</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.address_line1} onChange={(e)=>setForm({...form, address_line1: e.target.value})} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">City</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.city} onChange={(e)=>setForm({...form, city: e.target.value})} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Country</span>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={form.country} onChange={(e)=>setForm({...form, country: e.target.value})} />
          </label>
        </div>
        <div className="mt-4">
          <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}


