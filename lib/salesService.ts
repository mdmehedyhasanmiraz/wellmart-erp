import { supabase } from './supabase';
import { SalesOrder, SalesOrderItem, SalesPayment } from '@/types/user';

export class SalesService {
  static async createOrder(payload: Partial<SalesOrder>): Promise<SalesOrder | null> {
    const { data, error } = await supabase
      .from('sales_orders')
      .insert({
        branch_id: payload.branch_id,
        party_id: payload.party_id || null,
        employee_id: payload.employee_id || null,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        discount_total: payload.discount_total ?? 0,
        tax_total: payload.tax_total ?? 0,
        shipping_total: payload.shipping_total ?? 0,
        paid_total: payload.paid_total ?? 0,
        due_total: payload.due_total ?? 0,
        status: payload.status || 'posted',
        note: payload.note,
      })
      .select()
      .single();
    if (error) {
      console.error('createOrder error', error);
      return null;
    }
    return data as SalesOrder;
  }

  static async addItems(orderId: string, items: Array<Omit<SalesOrderItem, 'id' | 'order_id' | 'total'>>): Promise<boolean> {
    const rows = items.map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount_amount: i.discount_amount ?? 0,
      discount_percent: i.discount_percent ?? 0,
      total: 0,
    }));
    // Compute totals client-side for now
    rows.forEach((r) => {
      const base = r.unit_price * r.quantity;
      const percent = base * (r.discount_percent / 100);
      r.total = Math.max(base - r.discount_amount - percent, 0);
    });
    const { error } = await supabase.from('sales_order_items').insert(rows);
    if (error) {
      console.error('addItems error', error);
      return false;
    }
    await supabase.rpc('recalc_sales_totals', { p_order_id: orderId });
    return true;
  }

  static async addPayment(orderId: string, payment: Omit<SalesPayment, 'id' | 'order_id' | 'paid_at'>): Promise<boolean> {
    const { error } = await supabase.from('sales_payments').insert({
      order_id: orderId,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      received_by: payment.received_by,
    });
    if (error) {
      console.error('addPayment error', error);
      return false;
    }
    await supabase.rpc('recalc_sales_totals', { p_order_id: orderId });
    return true;
  }

  static async getOrder(orderId: string): Promise<SalesOrder | null> {
    const { data, error } = await supabase.from('sales_orders').select('*').eq('id', orderId).single();
    if (error) {
      console.error('getOrder error', error);
      return null;
    }
    return data as SalesOrder;
  }

  static async listOrders(params: { branchId?: string; status?: string } = {}): Promise<SalesOrder[]> {
    let query = supabase.from('sales_orders').select('*').order('created_at', { ascending: false });
    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.status) query = query.eq('status', params.status);
    const { data, error } = await query;
    if (error) {
      console.error('listOrders error', error);
      return [];
    }
    return data as SalesOrder[];
  }

  static async getItems(orderId: string): Promise<SalesOrderItem[]> {
    const { data, error } = await supabase.from('sales_order_items').select('*').eq('order_id', orderId);
    if (error) {
      console.error('getItems error', error);
      return [];
    }
    return data as SalesOrderItem[];
  }

  static async getPayments(orderId: string): Promise<SalesPayment[]> {
    const { data, error } = await supabase.from('sales_payments').select('*').eq('order_id', orderId);
    if (error) {
      console.error('getPayments error', error);
      return [];
    }
    return data as SalesPayment[];
  }

  static async postOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase.rpc('post_sales_order', { p_order_id: orderId, p_actor: null });
    if (error) {
      console.error('postOrder error', error);
      return false;
    }
    return true;
  }

  static async getOrderById(orderId: string): Promise<SalesOrder | null> {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) {
      console.error('getOrderById error', error);
      return null;
    }
    return data as SalesOrder;
  }

  static async getOrderItems(orderId: string): Promise<SalesOrderItem[]> {
    const { data, error } = await supabase
      .from('sales_order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) {
      console.error('getOrderItems error', error);
      return [];
    }
    return data as SalesOrderItem[];
  }

  static async getOrderPayments(orderId: string): Promise<SalesPayment[]> {
    const { data, error } = await supabase
      .from('sales_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('paid_at', { ascending: true });
    
    if (error) {
      console.error('getOrderPayments error', error);
      return [];
    }
    return data as SalesPayment[];
  }

  static async updateOrder(orderId: string, updates: Partial<SalesOrder>): Promise<boolean> {
    const { error } = await supabase
      .from('sales_orders')
      .update({
        customer_name: updates.customer_name,
        customer_phone: updates.customer_phone,
        discount_total: updates.discount_total,
        tax_total: updates.tax_total,
        shipping_total: updates.shipping_total,
        note: updates.note,
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('updateOrder error', error);
      return false;
    }
    
    // Recalculate totals after update
    await supabase.rpc('recalc_sales_totals', { p_order_id: orderId });
    return true;
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('deleteOrder error', error);
      return false;
    }

    return true;
  }
}


