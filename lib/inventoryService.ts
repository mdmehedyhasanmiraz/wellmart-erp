import { supabase } from './supabase';
import {
  ProductBranchStock,
  InventoryMovement,
  InventoryMovementType,
  BranchTransfer,
  BranchTransferItem,
} from '@/types/user';

export class InventoryService {
  // Stocks
  static async getStocksByBranch(branchId: string): Promise<ProductBranchStock[]> {
    const { data, error } = await supabase
      .from('product_branch_stocks')
      .select('*')
      .eq('branch_id', branchId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('Error fetching stocks by branch:', error);
      return [];
    }
    return data as ProductBranchStock[];
  }

  static async getStock(productId: string, branchId: string): Promise<ProductBranchStock | null> {
    const { data, error } = await supabase
      .from('product_branch_stocks')
      .select('*')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null; // no rows
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
    type: InventoryMovementType;
    note?: string;
  }): Promise<InventoryMovement | null> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: payload.product_id,
        from_branch_id: payload.from_branch_id ?? null,
        to_branch_id: payload.to_branch_id ?? null,
        quantity: payload.quantity,
        type: payload.type,
        note: payload.note,
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
    items: Array<{ product_id: string; quantity: number }>;
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

    const items = payload.items.map((i) => ({ transfer_id: transfer.id, product_id: i.product_id, quantity: i.quantity }));
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
}


