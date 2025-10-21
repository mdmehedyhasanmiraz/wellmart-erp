import { supabase } from './supabase';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  PurchasePayment, 
  CreatePurchaseOrderData, 
  UpdatePurchaseOrderData 
} from '@/types/user';

export class PurchaseService {
  private static supabase = supabase;

  static async getAllOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      throw new Error('Failed to fetch purchase orders');
    }

    return data || [];
  }

  static async getOrderById(orderId: string): Promise<PurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching purchase order:', error);
      return null;
    }

    return data;
  }

  static async getOrderItems(orderId: string): Promise<PurchaseOrderItem[]> {
    const { data, error } = await this.supabase
      .from('purchase_order_items')
      .select(`
        *,
        products:product_id(name)
      `)
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching purchase order items:', error);
      throw new Error('Failed to fetch purchase order items');
    }

    return data || [];
  }

  static async getOrderPayments(orderId: string): Promise<PurchasePayment[]> {
    const { data, error } = await this.supabase
      .from('purchase_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase payments:', error);
      throw new Error('Failed to fetch purchase payments');
    }

    return data || [];
  }

  static async createOrder(orderData: CreatePurchaseOrderData): Promise<PurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      throw new Error('Failed to create purchase order');
    }

    return data;
  }

  static async updateOrder(orderId: string, updates: UpdatePurchaseOrderData): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating purchase order:', error);
      throw new Error('Failed to update purchase order');
    }

    return true;
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting purchase order:', error);
      throw new Error('Failed to delete purchase order');
    }

    return true;
  }

  static async addOrderItem(orderId: string, item: Omit<PurchaseOrderItem, 'id' | 'order_id'>): Promise<PurchaseOrderItem | null> {
    const { data, error } = await this.supabase
      .from('purchase_order_items')
      .insert([{ ...item, order_id: orderId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding purchase order item:', error);
      throw new Error('Failed to add purchase order item');
    }

    return data;
  }

  static async updateOrderItem(itemId: string, updates: Partial<PurchaseOrderItem>): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_order_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      console.error('Error updating purchase order item:', error);
      throw new Error('Failed to update purchase order item');
    }

    return true;
  }

  static async deleteOrderItem(itemId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting purchase order item:', error);
      throw new Error('Failed to delete purchase order item');
    }

    return true;
  }

  static async addPayment(orderId: string, payment: Omit<PurchasePayment, 'id' | 'order_id'>): Promise<PurchasePayment | null> {
    const { data, error } = await this.supabase
      .from('purchase_payments')
      .insert([{ ...payment, order_id: orderId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding purchase payment:', error);
      throw new Error('Failed to add purchase payment');
    }

    return data;
  }

  static async updatePayment(paymentId: string, updates: Partial<PurchasePayment>): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_payments')
      .update(updates)
      .eq('id', paymentId);

    if (error) {
      console.error('Error updating purchase payment:', error);
      throw new Error('Failed to update purchase payment');
    }

    return true;
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('purchase_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting purchase payment:', error);
      throw new Error('Failed to delete purchase payment');
    }

    return true;
  }

  static async getOrdersByBranch(branchId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders by branch:', error);
      throw new Error('Failed to fetch purchase orders');
    }

    return data || [];
  }

  static async getOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders by supplier:', error);
      throw new Error('Failed to fetch purchase orders');
    }

    return data || [];
  }

  static async searchOrders(query: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .or(`supplier_name.ilike.%${query}%,supplier_phone.ilike.%${query}%,note.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching purchase orders:', error);
      throw new Error('Failed to search purchase orders');
    }

    return data || [];
  }

  static async getOrdersCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting purchase orders count:', error);
      return 0;
    }

    return count || 0;
  }

  static async getOrdersByStatus(status: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(name),
        suppliers:supplier_id(name),
        employees:employee_id(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders by status:', error);
      throw new Error('Failed to fetch purchase orders');
    }

    return data || [];
  }
}
