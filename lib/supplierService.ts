import { supabase } from './supabase';
import { Supplier, CreateSupplierData, UpdateSupplierData } from '@/types/user';

export class SupplierService {
  private static supabase = supabase;

  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }

    return data || [];
  }

  static async getSuppliersByBranch(branchId: string): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers by branch:', error);
      throw new Error('Failed to fetch suppliers');
    }

    return data || [];
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }

    return data;
  }

  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier');
    }

    return data;
  }

  static async updateSupplier(id: string, supplierData: UpdateSupplierData): Promise<boolean> {
    const { error } = await this.supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id);

    if (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Failed to update supplier');
    }

    return true;
  }

  static async deleteSupplier(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw new Error('Failed to delete supplier');
    }

    return true;
  }

  static async toggleSupplierStatus(id: string): Promise<boolean> {
    // First get the current status
    const supplier = await this.getSupplierById(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const { error } = await this.supabase
      .from('suppliers')
      .update({ is_active: !supplier.is_active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling supplier status:', error);
      throw new Error('Failed to update supplier status');
    }

    return true;
  }

  static async searchSuppliers(query: string, branchId?: string): Promise<Supplier[]> {
    let supabaseQuery = this.supabase
      .from('suppliers')
      .select('*')
      .or(`name.ilike.%${query}%,supplier_code.ilike.%${query}%,contact_person.ilike.%${query}%,phone.ilike.%${query}%`)
      .eq('is_active', true);

    if (branchId) {
      supabaseQuery = supabaseQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
    }

    const { data, error } = await supabaseQuery.order('name', { ascending: true });

    if (error) {
      console.error('Error searching suppliers:', error);
      throw new Error('Failed to search suppliers');
    }

    return data || [];
  }

  static async getActiveSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active suppliers:', error);
      throw new Error('Failed to fetch active suppliers');
    }

    return data || [];
  }

  static async getSuppliersCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting suppliers count:', error);
      return 0;
    }

    return count || 0;
  }

  static async getActiveSuppliersCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting active suppliers count:', error);
      return 0;
    }

    return count || 0;
  }
}
