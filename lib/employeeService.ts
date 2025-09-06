import { supabase } from './supabase';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/user';

export class EmployeeService {
  static async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
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
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
    return data as Employee;
  }

  static async create(payload: CreateEmployeeData): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...payload,
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
    const { data, error } = await supabase
      .from('employees')
      .update({
        ...payload,
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


