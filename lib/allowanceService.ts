import { supabase } from './supabase';
import { EmployeeAllowance, EmployeeAllowanceItem } from '@/types/user';

export class AllowanceService {
  static async listAllowances(params: { employeeId?: string; from?: string; to?: string } = {}): Promise<EmployeeAllowance[]> {
    let query = supabase.from('employee_allowances').select('*').order('allowance_date', { ascending: false });
    if (params.employeeId) query = query.eq('employee_id', params.employeeId);
    if (params.from) query = query.gte('allowance_date', params.from);
    if (params.to) query = query.lte('allowance_date', params.to);
    const { data, error } = await query;
    if (error) {
      console.error('listAllowances error', error);
      return [];
    }
    return data as EmployeeAllowance[];
  }

  static async createAllowance(payload: Partial<EmployeeAllowance>): Promise<EmployeeAllowance | null> {
    const { data, error } = await supabase
      .from('employee_allowances')
      .insert({
        employee_id: payload.employee_id,
        branch_id: payload.branch_id,
        allowance_date: payload.allowance_date,
        note: payload.note,
      })
      .select()
      .single();
    if (error) {
      console.error('createAllowance error', error);
      return null;
    }
    return data as EmployeeAllowance;
  }

  static async addItems(allowanceId: string, items: Array<Omit<EmployeeAllowanceItem, 'id' | 'allowance_id' | 'total_value'>>): Promise<boolean> {
    const rows = items.map((i) => ({ ...i, allowance_id: allowanceId, total_value: i.unit_value * i.quantity }));
    const { error } = await supabase.from('employee_allowance_items').insert(rows);
    if (error) {
      console.error('addItems error', error);
      return false;
    }
    await supabase.rpc('recalc_allowance_total', { p_allowance_id: allowanceId });
    return true;
  }

  static async getItems(allowanceId: string): Promise<EmployeeAllowanceItem[]> {
    const { data, error } = await supabase.from('employee_allowance_items').select('*').eq('allowance_id', allowanceId);
    if (error) {
      console.error('getItems error', error);
      return [];
    }
    return data as EmployeeAllowanceItem[];
  }
}


