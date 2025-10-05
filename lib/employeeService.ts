import { supabase } from './supabase';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/user';

export class EmployeeService {
  private static sanitizePayload<T extends object>(payload: T): T {
    const mutable: Record<string, unknown> = { ...(payload as unknown as Record<string, unknown>) };
    const optionalStringFields = [
      'designation_id',
      'branch_id',
      'reports_to_employee_id',
      'phone',
      'email',
      'present_address',
      'permanent_address',
      'blood_group',
    ];
    const dateFields = ['date_of_birth', 'marriage_date', 'joined_date', 'resigned_date'];

    optionalStringFields.forEach((field) => {
      const current = mutable[field];
      if (typeof current === 'string' && current === '') {
        mutable[field] = null;
      }
    });

    dateFields.forEach((field) => {
      const current = mutable[field];
      if (current == null || (typeof current === 'string' && current === '')) {
        mutable[field] = null;
      }
    });

    return mutable as T;
  }
  static async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        designation:designation_id(id, name, code, level, department),
        manager:reports_to_employee_id(id, name, employee_code)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
    return data as Employee[];
  }

  static async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        designation:designation_id(id, name, code, level, department),
        manager:reports_to_employee_id(id, name, employee_code)
      `)
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
    return data as Employee;
  }

  static async listReporters(managerId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        designation:designation_id(id, name, code, level, department)
      `)
      .eq('reports_to_employee_id', managerId)
      .eq('is_active', true);
    if (error) {
      console.error('Error fetching reporters:', error);
      return [];
    }
    return data as Employee[];
  }

  static async create(payload: CreateEmployeeData): Promise<Employee | null> {
    const sanitized = EmployeeService.sanitizePayload(payload);
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...sanitized,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating employee:', error);
      return null;
    }
    return data as Employee;
  }

  static async update(id: string, payload: UpdateEmployeeData): Promise<Employee | null> {
    const sanitized = EmployeeService.sanitizePayload(payload);
    const { data, error } = await supabase
      .from('employees')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating employee:', error);
      return null;
    }
    return data as Employee;
  }

  static async deactivate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Error deactivating employee:', error);
      return false;
    }
    return true;
  }
}


