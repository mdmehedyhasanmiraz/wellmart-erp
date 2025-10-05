import { supabase } from './supabase'

export type SalaryProfile = {
  id: string
  employee_id: string
  branch_id: string | null
  effective_from: string
  effective_to: string | null
  currency: string
  monthly_gross: number
  monthly_basic: number
  house_rent_percent: number | null
  medical_allowance: number | null
  conveyance_allowance: number | null
  pf_employee_percent: number | null
  pf_employer_percent: number | null
  tax_monthly: number | null
  is_active: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export type SalaryComponent = {
  id: string
  profile_id: string
  component_type: string
  name: string | null
  is_earning: boolean
  is_percentage: boolean
  percent_value: number | null
  amount_value: number | null
  taxable: boolean | null
  sort_order: number | null
}

export type PayrollRun = {
  id: string
  branch_id: string | null
  period_year: number
  period_month: number
  from_date: string
  to_date: string
  status: string
  total_gross: number
  total_net: number
  created_at: string
  updated_at: string
}

export type PayrollRunItem = {
  id: string
  run_id: string
  employee_id: string
  profile_id: string | null
  working_days: number | null
  present_days: number | null
  absent_days: number | null
  leave_days: number | null
  gross_pay: number
  total_earnings: number
  total_deductions: number
  net_pay: number
  note: string | null
}

// Advances
export type AdvancePayload = {
  employee_id: string
  branch_id?: string | null
  approved_on?: string
  principal: number
  balance?: number
  monthly_installment?: number
  installments_remaining?: number
  note?: string
}

export type SalaryAdvance = {
  id: string
  employee_id: string
  branch_id: string | null
  approved_on: string
  principal: number
  balance: number
  monthly_installment: number
  installments_remaining: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export class SalaryService {
  // Profiles
  static async getProfilesByEmployee(employeeId: string): Promise<SalaryProfile[]> {
    const { data, error } = await supabase
      .from('employee_salary_profiles')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false })
    if (error) {
      console.error('getProfilesByEmployee error', error)
      return []
    }
    return data as SalaryProfile[]
  }

  static async createProfile(payload: Partial<SalaryProfile>): Promise<SalaryProfile | null> {
    const { data, error } = await supabase
      .from('employee_salary_profiles')
      .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) {
      console.error('createProfile error', error)
      return null
    }
    return data as SalaryProfile
  }

  static async updateProfile(id: string, payload: Partial<SalaryProfile>): Promise<SalaryProfile | null> {
    const { data, error } = await supabase
      .from('employee_salary_profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('updateProfile error', error)
      return null
    }
    return data as SalaryProfile
  }

  static async toggleProfileActive(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('employee_salary_profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('toggleProfileActive error', error)
      return false
    }
    return true
  }

  // Components
  static async getComponents(profileId: string): Promise<SalaryComponent[]> {
    const { data, error } = await supabase
      .from('employee_salary_components')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('getComponents error', error)
      return []
    }
    return data as SalaryComponent[]
  }

  static async upsertComponents(profileId: string, components: Partial<SalaryComponent>[]): Promise<boolean> {
    // Attach profileId and upsert by id when present
    const rows = components.map((c) => ({ ...c, profile_id: profileId }))
    const { error } = await supabase
      .from('employee_salary_components')
      .upsert(rows as unknown as Record<string, unknown>[], { onConflict: 'id' })
    if (error) {
      console.error('upsertComponents error', error)
      return false
    }
    return true
  }

  static async deleteComponent(id: string): Promise<boolean> {
    const { error } = await supabase.from('employee_salary_components').delete().eq('id', id)
    if (error) {
      console.error('deleteComponent error', error)
      return false
    }
    return true
  }

  static async createAdvance(payload: AdvancePayload): Promise<boolean> {
    const { error } = await supabase
      .from('employee_salary_advances')
      .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    if (error) {
      console.error('createAdvance error', error)
      return false
    }
    return true
  }

  static async listAdvances(employeeId: string): Promise<SalaryAdvance[]> {
    const { data, error } = await supabase
      .from('employee_salary_advances')
      .select('*')
      .eq('employee_id', employeeId)
      .order('approved_on', { ascending: false })
    if (error) {
      console.error('listAdvances error', error)
      return []
    }
    return data as SalaryAdvance[]
  }

  // Payroll runs
  static async createRun(payload: Partial<PayrollRun>): Promise<PayrollRun | null> {
    const { data, error } = await supabase
      .from('payroll_runs')
      .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) {
      console.error('createRun error', error)
      return null
    }
    return data as PayrollRun
  }

  static async listRuns(): Promise<PayrollRun[]> {
    const { data, error } = await supabase.from('payroll_runs').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('listRuns error', error)
      return []
    }
    return data as PayrollRun[]
  }

  static async generate(runId: string): Promise<boolean> {
    const { error } = await supabase.rpc('generate_payroll', { p_run_id: runId })
    if (error) {
      console.error('generate payroll error', error)
      return false
    }
    return true
  }

  static async approve(runId: string, actorId: string): Promise<boolean> {
    const { error } = await supabase.rpc('approve_payroll', { p_run_id: runId, p_actor: actorId })
    if (error) {
      console.error('approve payroll error', error)
      return false
    }
    return true
  }

  static async pay(runId: string, actorId: string, method = 'cash'): Promise<boolean> {
    const { error } = await supabase.rpc('pay_payroll', { p_run_id: runId, p_actor: actorId, p_method: method })
    if (error) {
      console.error('pay payroll error', error)
      return false
    }
    return true
  }

  static async getRunItems(runId: string): Promise<PayrollRunItem[]> {
    const { data, error } = await supabase.from('payroll_run_items').select('*').eq('run_id', runId)
    if (error) {
      console.error('getRunItems error', error)
      return []
    }
    return data as PayrollRunItem[]
  }

  static async listRunItemsByEmployee(employeeId: string): Promise<PayrollRunItem[]> {
    const { data, error } = await supabase
      .from('payroll_run_items')
      .select('*')
      .eq('employee_id', employeeId)
      .order('net_pay', { ascending: false })
    if (error) {
      console.error('listRunItemsByEmployee error', error)
      return []
    }
    return data as PayrollRunItem[]
  }
}


