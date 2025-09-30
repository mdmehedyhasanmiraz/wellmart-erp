import { supabase } from './supabase';

export type SalesDaily = {
  branch_id: string;
  sales_date: string;
  orders_count: number;
  subtotal_sum: number;
  discount_sum: number;
  tax_sum: number;
  shipping_sum: number;
  grand_total_sum: number;
  paid_total_sum: number;
  due_total_sum: number;
};

export type ProfitDaily = {
  branch_id: string;
  sales_date: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
};

export class ReportsService {
  static async getSalesSummary(from: string, to: string, branchId?: string): Promise<SalesDaily[]> {
    const { data, error } = await supabase.rpc('get_sales_summary', { p_from: from, p_to: to, p_branch: branchId ?? null });
    if (error) {
      console.error('getSalesSummary error', error);
      return [];
    }
    return data as SalesDaily[];
  }

  static async getProfitSummary(from: string, to: string, branchId?: string): Promise<ProfitDaily[]> {
    const { data, error } = await supabase.rpc('get_profit_summary', { p_from: from, p_to: to, p_branch: branchId ?? null });
    if (error) {
      console.error('getProfitSummary error', error);
      return [];
    }
    return data as ProfitDaily[];
  }
}


