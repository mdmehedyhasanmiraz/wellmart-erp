import { supabase } from './supabase';
import { Branch } from '@/types/user';

export class BranchService {
  static async getAll(): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
    return data as Branch[];
  }

  static async getById(id: string): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching branch:', error);
      return null;
    }
    return data as Branch;
  }

  static async create(payload: Partial<Branch>): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: payload.name,
        code: payload.code,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        manager_id: payload.manager_id,
        is_active: payload.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating branch:', error);
      return null;
    }
    return data as Branch;
  }

  static async update(id: string, payload: Partial<Branch>): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .update({
        name: payload.name,
        code: payload.code,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        manager_id: payload.manager_id,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating branch:', error);
      return null;
    }
    return data as Branch;
  }
}


