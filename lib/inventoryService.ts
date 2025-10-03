import { supabase } from './supabase';
import {
  ProductBranchStock,
  InventoryMovement,
  BranchTransfer,
  BranchTransferItem,
  ProductBatch,
  ProductBranchBatchStock,
  CreateBatchData,
  UpdateBatchData,
  BatchStockEntry,
} from '@/types/user';

export class InventoryService {
  // Stocks
  static async getStocksByBranch(branchId: string): Promise<ProductBranchStock[]> {
    try {
      console.log(`Fetching stocks for branch: ${branchId}`);
      
      const { data, error } = await supabase
        .from('product_branch_stocks')
        .select('*')
        .eq('branch_id', branchId)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching stocks by branch:', error);
        console.error('Branch ID:', branchId);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log(`Found ${data?.length || 0} stock records for branch ${branchId}`);
      return data as ProductBranchStock[];
    } catch (error) {
      console.error('Exception in getStocksByBranch:', error);
      return [];
    }
  }

  static async getTotalStockForProduct(productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('product_branch_batch_stocks')
        .select('quantity')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching total stock for product (from batch stocks):', error);
        return 0;
      }

      const total = (data as { quantity: number }[] | null)?.reduce((sum, row) => sum + (row.quantity || 0), 0) ?? 0;
      return total;
    } catch (error) {
      console.error('Exception in getTotalStockForProduct:', error);
      return 0;
    }
  }

  static async getBranchStocksForProduct(productId: string): Promise<Array<{ branch_id: string; stock: number; branches?: { id: string; name: string; code: string } }>> {
    try {
      const { data, error } = await supabase
        .from('product_branch_batch_stocks')
        .select(`branch_id, quantity, branches ( id, name, code )`)
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching branch stocks for product (from batch stocks):', error);
        return [];
      }

      const rows = (data as unknown as Array<{ branch_id: string; quantity: number; branches?: { id: string; name: string; code: string } }>) || [];
      const byBranch: Record<string, { branch_id: string; stock: number; branches?: { id: string; name: string; code: string } }> = {};
      for (const row of rows) {
        const bid = row.branch_id as string;
        const qty = (row.quantity as number) || 0;
        if (!byBranch[bid]) {
          byBranch[bid] = { branch_id: bid, stock: 0, branches: row.branches || undefined };
        }
        byBranch[bid].stock += qty;
        // prefer to keep branch meta if available
        if (!byBranch[bid].branches && row.branches) {
          byBranch[bid].branches = row.branches;
        }
      }
      return Object.values(byBranch).sort((a, b) => b.stock - a.stock);
    } catch (error) {
      console.error('Exception in getBranchStocksForProduct:', error);
      return [];
    }
  }

  static async getStock(productId: string, branchId: string): Promise<ProductBranchStock | null> {
    const { data, error } = await supabase
      .from('product_branch_stocks')
      .select('*')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .single();
    if (error) {
      // PGRST116 is no rows returned
      if ((error as { code?: string }).code === 'PGRST116') return null;
      console.error('Error fetching stock:', error);
      return null;
    }
    return data as ProductBranchStock;
  }

  static async setMinMax(
    productId: string,
    branchId: string,
    minLevel?: number,
    maxLevel?: number
  ): Promise<ProductBranchStock | null> {
    const { data, error } = await supabase
      .from('product_branch_stocks')
      .upsert({ product_id: productId, branch_id: branchId, min_level: minLevel, max_level: maxLevel }, {
        onConflict: 'product_id,branch_id'
      })
      .select()
      .single();
    if (error) {
      console.error('Error setting min/max:', error);
      return null;
    }
    return data as ProductBranchStock;
  }

  // Movements
  static async createMovement(payload: {
    product_id: string;
    from_branch_id?: string | null;
    to_branch_id?: string | null;
    quantity: number;
    note?: string;
    batch_id?: string;
  }): Promise<InventoryMovement | null> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: payload.product_id,
        from_branch_id: payload.from_branch_id ?? null,
        to_branch_id: payload.to_branch_id ?? null,
        quantity: payload.quantity,
        note: payload.note,
        batch_id: payload.batch_id ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating movement:', error);
      return null;
    }
    return data as InventoryMovement;
  }

  static async listMovementsByBranch(branchId: string, limit = 100): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error listing movements:', error);
      return [];
    }
    return data as InventoryMovement[];
  }

  // Transfers
  static async createTransfer(payload: {
    from_branch_id: string;
    to_branch_id: string;
    note?: string;
    items: Array<{ product_id: string; quantity: number; batch_id?: string }>;
  }): Promise<BranchTransfer | null> {
    const { data: transfer, error } = await supabase
      .from('branch_transfers')
      .insert({
        from_branch_id: payload.from_branch_id,
        to_branch_id: payload.to_branch_id,
        note: payload.note,
        status: 'pending',
      })
      .select()
      .single();
    if (error || !transfer) {
      console.error('Error creating transfer:', error);
      return null;
    }

    const items = payload.items.map((i) => ({ 
      transfer_id: transfer.id, 
      product_id: i.product_id, 
      quantity: i.quantity,
      batch_id: i.batch_id ?? null
    }));
    const { error: itemErr } = await supabase.from('branch_transfer_items').insert(items);
    if (itemErr) {
      console.error('Error creating transfer items:', itemErr);
      return null;
    }
    return transfer as BranchTransfer;
  }

  static async listTransfers(params: { branchId?: string; status?: 'pending' | 'approved' | 'completed' | 'cancelled' } = {}): Promise<BranchTransfer[]> {
    let query = supabase.from('branch_transfers').select('*').order('created_at', { ascending: false });
    if (params.branchId) {
      query = query.or(`from_branch_id.eq.${params.branchId},to_branch_id.eq.${params.branchId}`);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error listing transfers:', error);
      return [];
    }
    return data as BranchTransfer[];
  }

  static async getTransferItems(transferId: string): Promise<BranchTransferItem[]> {
    const { data, error } = await supabase
      .from('branch_transfer_items')
      .select('*')
      .eq('transfer_id', transferId);
    if (error) {
      console.error('Error getting transfer items:', error);
      return [];
    }
    return data as BranchTransferItem[];
  }

  static async updateTransferStatus(transferId: string, status: 'pending' | 'approved' | 'completed' | 'cancelled'): Promise<BranchTransfer | null> {
    const { data, error } = await supabase
      .from('branch_transfers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', transferId)
      .select()
      .single();
    if (error) {
      console.error('Error updating transfer status:', error);
      return null;
    }
    return data as BranchTransfer;
  }

  static async completeTransfer(transferId: string): Promise<boolean> {
    const { error } = await supabase.rpc('complete_branch_transfer', { p_transfer_id: transferId, p_actor: null });
    if (error) {
      console.error('Error completing transfer:', error);
      return false;
    }
    return true;
  }

  // Batch Management
  static async createBatch(batchData: CreateBatchData): Promise<ProductBatch | null> {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .insert({
          ...batchData,
          quantity_remaining: batchData.quantity_received,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating batch:', error);
        return null;
      }

      return data as ProductBatch;
    } catch (error) {
      console.error('Exception in createBatch:', error);
      return null;
    }
  }

  static async updateBatch(batchId: string, payload: UpdateBatchData): Promise<ProductBatch | null> {
    try {
      const cleaned: UpdateBatchData = { ...payload };
      const { data, error } = await supabase
        .from('product_batches')
        .update({
          batch_number: cleaned.batch_number,
          expiry_date: cleaned.expiry_date ?? null,
          manufacturing_date: cleaned.manufacturing_date ?? null,
          supplier_batch_number: cleaned.supplier_batch_number ?? null,
          cost_price: cleaned.cost_price ?? null,
          quantity_received: cleaned.quantity_received,
          quantity_remaining: cleaned.quantity_remaining,
          status: cleaned.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating batch:', error);
        return null;
      }
      return data as ProductBatch;
    } catch (error) {
      console.error('Exception in updateBatch:', error);
      return null;
    }
  }

  static async getBatchesByProduct(productId: string): Promise<ProductBatch[]> {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', productId)
        .order('expiry_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batches by product:', error);
        return [];
      }

      return data as ProductBatch[];
    } catch (error) {
      console.error('Exception in getBatchesByProduct:', error);
      return [];
    }
  }

  static async getBatchStock(productId: string, branchId: string, batchId: string): Promise<ProductBranchBatchStock | null> {
    try {
      const { data, error } = await supabase
        .from('product_branch_batch_stocks')
        .select('*')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .eq('batch_id', batchId)
        .single();

      if (error) {
        if ((error as { code?: string }).code === 'PGRST116') return null; // no rows
        console.error('Error fetching batch stock:', error);
        return null;
      }

      return data as ProductBranchBatchStock;
    } catch (error) {
      console.error('Exception in getBatchStock:', error);
      return null;
    }
  }

  static async getBatchStocksByBranch(productId: string, branchId: string): Promise<ProductBranchBatchStock[]> {
    try {
      const { data, error } = await supabase
        .from('product_branch_batch_stocks')
        .select(`
          *,
          product_batches (
            id,
            batch_number,
            expiry_date,
            manufacturing_date,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .gt('quantity', 0)
        .order('expiry_date', { ascending: true, foreignTable: 'product_batches' });

      if (error) {
        console.error('Error fetching batch stocks by branch:', error);
        return [];
      }

      return data as ProductBranchBatchStock[];
    } catch (error) {
      console.error('Exception in getBatchStocksByBranch:', error);
      return [];
    }
  }

  static async updateBatchStock(
    productId: string,
    branchId: string,
    batchId: string,
    quantity: number
  ): Promise<ProductBranchBatchStock | null> {
    try {
      // First, try to update existing record
      const { data, error } = await supabase
        .from('product_branch_batch_stocks')
        .upsert({
          product_id: productId,
          branch_id: branchId,
          batch_id: batchId,
          quantity: quantity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id,branch_id,batch_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating batch stock:', error);
        return null;
      }

      return data as ProductBranchBatchStock;
    } catch (error) {
      console.error('Exception in updateBatchStock:', error);
      return null;
    }
  }

  static async createBatchMovement(payload: {
    product_id: string;
    from_branch_id?: string | null;
    to_branch_id?: string | null;
    quantity: number;
    note?: string;
    batch_id?: string;
  }): Promise<InventoryMovement | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: payload.product_id,
          from_branch_id: payload.from_branch_id ?? null,
          to_branch_id: payload.to_branch_id ?? null,
          quantity: payload.quantity,
          note: payload.note,
          batch_id: payload.batch_id ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating batch movement:', error);
        return null;
      }

      return data as InventoryMovement;
    } catch (error) {
      console.error('Exception in createBatchMovement:', error);
      return null;
    }
  }

  static async createBatchTransfer(payload: {
    from_branch_id: string;
    to_branch_id: string;
    note?: string;
    items: Array<{ product_id: string; quantity: number; batch_id: string }>;
  }): Promise<BranchTransfer | null> {
    try {
      const { data: transfer, error } = await supabase
        .from('branch_transfers')
        .insert({
          from_branch_id: payload.from_branch_id,
          to_branch_id: payload.to_branch_id,
          note: payload.note,
          status: 'pending',
        })
        .select()
        .single();

      if (error || !transfer) {
        console.error('Error creating batch transfer:', error);
        return null;
      }

      const items = payload.items.map((i) => ({
        transfer_id: transfer.id,
        product_id: i.product_id,
        quantity: i.quantity,
        batch_id: i.batch_id
      }));

      const { error: itemErr } = await supabase
        .from('branch_transfer_items')
        .insert(items);

      if (itemErr) {
        console.error('Error creating batch transfer items:', itemErr);
        return null;
      }

      return transfer as BranchTransfer;
    } catch (error) {
      console.error('Exception in createBatchTransfer:', error);
      return null;
    }
  }

  static async generateBatchNumber(productId: string): Promise<string> {
    try {
      // Get current year and month
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Get product code (assuming products have a code field)
      const { data: product } = await supabase
        .from('products')
        .select('sku')
        .eq('id', productId)
        .single();

      const productCode = product?.sku?.substring(0, 3).toUpperCase() || 'PRD';
      
      // Get next sequence number for this product this month
      const { data: batches } = await supabase
        .from('product_batches')
        .select('batch_number')
        .eq('product_id', productId)
        .like('batch_number', `${productCode}${year}${month}%`)
        .order('batch_number', { ascending: false })
        .limit(1);

      let sequence = 1;
      if (batches && batches.length > 0) {
        const lastBatch = batches[0].batch_number;
        const lastSequence = parseInt(lastBatch.slice(-3));
        sequence = lastSequence + 1;
      }

      return `${productCode}${year}${month}${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Exception in generateBatchNumber:', error);
      // Fallback to timestamp-based batch number
      return `BATCH${Date.now()}`;
    }
  }
}


