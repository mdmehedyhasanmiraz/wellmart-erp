import { supabase } from './supabase';

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier_batch_number?: string;
  cost_price?: number;
  quantity_received: number;
  quantity_remaining: number;
  status: 'active' | 'expired' | 'recalled' | 'consumed';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateBatchData {
  product_id: string;
  batch_number: string;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier_batch_number?: string;
  cost_price?: number;
  quantity_received: number;
  quantity_remaining: number;
  status?: 'active' | 'expired' | 'recalled' | 'consumed';
  created_by?: string;
}

export interface ProductBranchBatchStock {
  id: string;
  product_id: string;
  branch_id: string;
  batch_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchBatchStockData {
  product_id: string;
  branch_id: string;
  batch_id: string;
  quantity: number;
}

type BatchPricing = {
  purchase_price?: number | null;
  trade_price?: number | null;
  mrp?: number | null;
};

export class BatchService {
  private static supabase = supabase;

  static async createBatch(batchData: CreateBatchData): Promise<ProductBatch | null> {
    try {
      const { data, error } = await this.supabase
        .from('product_batches')
        .insert([{
          product_id: batchData.product_id,
          batch_number: batchData.batch_number,
          expiry_date: batchData.expiry_date || null,
          manufacturing_date: batchData.manufacturing_date || null,
          supplier_batch_number: batchData.supplier_batch_number || null,
          cost_price: batchData.cost_price || null,
          quantity_received: batchData.quantity_received,
          quantity_remaining: batchData.quantity_remaining ?? batchData.quantity_received,
          purchase_price: batchData.purchase_price ?? batchData.cost_price ?? null,
          trade_price: batchData.trade_price ?? batchData.purchase_price ?? batchData.cost_price ?? null,
          mrp: batchData.mrp ?? batchData.trade_price ?? batchData.purchase_price ?? batchData.cost_price ?? null,
          status: 'active',
          created_by: batchData.created_by || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating batch:', error);
        throw new Error(`Failed to create batch: ${error.message}`);
      }

      return data as ProductBatch;
    } catch (error) {
      console.error('Error in createBatch:', error);
      throw error;
    }
  }

  static async getBatchByNumber(productId: string, batchNumber: string): Promise<ProductBatch | null> {
    try {
      const { data, error } = await this.supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', productId)
        .eq('batch_number', batchNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching batch:', error);
        throw new Error(`Failed to fetch batch: ${error.message}`);
      }

      return data as ProductBatch;
    } catch (error) {
      console.error('Error in getBatchByNumber:', error);
      throw error;
    }
  }

  static async updateBatchQuantity(batchId: string, additionalQuantity: number, pricing?: BatchPricing): Promise<boolean> {
    try {
      // First get the current batch
      const { data: currentBatch, error: fetchError } = await this.supabase
        .from('product_batches')
        .select('quantity_received, quantity_remaining')
        .eq('id', batchId)
        .single();

      if (fetchError) {
        console.error('Error fetching batch for update:', fetchError);
        throw new Error(`Failed to fetch batch: ${fetchError.message}`);
      }

      // Update quantities
      const updatePayload: {
        quantity_received: number;
        quantity_remaining: number;
        updated_at: string;
        purchase_price?: number | null;
        trade_price?: number | null;
        mrp?: number | null;
      } = {
        quantity_received: currentBatch.quantity_received + additionalQuantity,
        quantity_remaining: currentBatch.quantity_remaining + additionalQuantity,
        updated_at: new Date().toISOString()
      };

      if (pricing) {
        if (pricing.purchase_price !== undefined) updatePayload.purchase_price = pricing.purchase_price;
        if (pricing.trade_price !== undefined) updatePayload.trade_price = pricing.trade_price;
        if (pricing.mrp !== undefined) updatePayload.mrp = pricing.mrp;
      }

      const { error } = await this.supabase
        .from('product_batches')
        .update(updatePayload)
        .eq('id', batchId);

      if (error) {
        console.error('Error updating batch quantity:', error);
        throw new Error(`Failed to update batch quantity: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in updateBatchQuantity:', error);
      throw error;
    }
  }

  static async getBatchesByProduct(productId: string): Promise<ProductBatch[]> {
    try {
      const { data, error } = await this.supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batches by product:', error);
        throw new Error(`Failed to fetch batches: ${error.message}`);
      }

      return data as ProductBatch[];
    } catch (error) {
      console.error('Error in getBatchesByProduct:', error);
      throw error;
    }
  }

  static async getBatchById(batchId: string): Promise<ProductBatch | null> {
    try {
      const { data, error } = await this.supabase
        .from('product_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching batch by ID:', error);
        throw new Error(`Failed to fetch batch: ${error.message}`);
      }

      return data as ProductBatch;
    } catch (error) {
      console.error('Error in getBatchById:', error);
      throw error;
    }
  }

  static async updateBatchStatus(batchId: string, status: 'active' | 'expired' | 'recalled' | 'consumed'): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('product_batches')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) {
        console.error('Error updating batch status:', error);
        throw new Error(`Failed to update batch status: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in updateBatchStatus:', error);
      throw error;
    }
  }

  static async deleteBatch(batchId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('product_batches')
        .delete()
        .eq('id', batchId);

      if (error) {
        console.error('Error deleting batch:', error);
        throw new Error(`Failed to delete batch: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBatch:', error);
      throw error;
    }
  }

  // Branch-specific batch stock methods
  static async createBranchBatchStock(stockData: CreateBranchBatchStockData): Promise<ProductBranchBatchStock | null> {
    try {
      const { data, error } = await this.supabase
        .from('product_branch_batch_stocks')
        .insert([stockData])
        .select()
        .single();

      if (error) {
        console.error('Error creating branch batch stock:', error);
        throw new Error(`Failed to create branch batch stock: ${error.message}`);
      }

      return data as ProductBranchBatchStock;
    } catch (error) {
      console.error('Error in createBranchBatchStock:', error);
      throw error;
    }
  }

  static async getBranchBatchStock(productId: string, branchId: string, batchId: string): Promise<ProductBranchBatchStock | null> {
    try {
      const { data, error } = await this.supabase
        .from('product_branch_batch_stocks')
        .select('*')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .eq('batch_id', batchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching branch batch stock:', error);
        throw new Error(`Failed to fetch branch batch stock: ${error.message}`);
      }

      return data as ProductBranchBatchStock;
    } catch (error) {
      console.error('Error in getBranchBatchStock:', error);
      throw error;
    }
  }

  static async updateBranchBatchStockQuantity(stockId: string, additionalQuantity: number): Promise<boolean> {
    try {
      // First get the current stock
      const { data: currentStock, error: fetchError } = await this.supabase
        .from('product_branch_batch_stocks')
        .select('quantity')
        .eq('id', stockId)
        .single();

      if (fetchError) {
        console.error('Error fetching branch batch stock for update:', fetchError);
        throw new Error(`Failed to fetch branch batch stock: ${fetchError.message}`);
      }

      // Update quantity
      const { error } = await this.supabase
        .from('product_branch_batch_stocks')
        .update({
          quantity: currentStock.quantity + additionalQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockId);

      if (error) {
        console.error('Error updating branch batch stock quantity:', error);
        throw new Error(`Failed to update branch batch stock quantity: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in updateBranchBatchStockQuantity:', error);
      throw error;
    }
  }

  static async getBranchBatchStocksByProduct(productId: string, branchId: string): Promise<ProductBranchBatchStock[]> {
    try {
      const { data, error } = await this.supabase
        .from('product_branch_batch_stocks')
        .select(`
          *,
          product_batches!inner(
            batch_number,
            expiry_date,
            manufacturing_date,
            cost_price,
            purchase_price,
            trade_price,
            mrp,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching branch batch stocks by product:', error);
        throw new Error(`Failed to fetch branch batch stocks: ${error.message}`);
      }

      return data as ProductBranchBatchStock[];
    } catch (error) {
      console.error('Error in getBranchBatchStocksByProduct:', error);
      throw error;
    }
  }
}
