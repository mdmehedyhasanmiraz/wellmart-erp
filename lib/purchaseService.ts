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

  static async addItems(orderId: string, items: Array<Omit<PurchaseOrderItem, 'id' | 'order_id' | 'total'>>): Promise<boolean> {
    try {
      const itemsWithTotals = items.map(item => ({
        ...item,
        order_id: orderId,
        total: (item.unit_price * item.quantity) - item.discount_amount - (item.unit_price * item.quantity * item.discount_percent / 100)
      }));

      const { error } = await this.supabase
        .from('purchase_order_items')
        .insert(itemsWithTotals);

      if (error) {
        console.error('addItems error', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('addItems error', error);
      return false;
    }
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

  static async uploadImage(file: File): Promise<string | null> {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User must be authenticated to upload images');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `purchase-invoices/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type });

      const { data, error } = await this.supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('row-level security')) {
          throw new Error('Storage access denied. Please contact your administrator to configure storage permissions.');
        } else if (error.message.includes('bucket')) {
          throw new Error('Storage bucket not found. Please contact your administrator.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Upload successful:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `purchase-invoices/${fileName}`;

      const { error } = await this.supabase.storage
        .from('images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}
