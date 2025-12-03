import { supabase } from './supabase';
import { SalesOrder } from '@/types/user';

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

export interface PartySalesSummary {
  party_id: string | null;
  customer_name: string;
  orders: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
}

export interface EmployeeSalesSummary {
  employee_id: string | null;
  employee_name: string;
  orders: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
}

export type PeriodGroup = 'date' | 'month' | 'year';

export interface PeriodSalesSummary {
  period: string;
  orders: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
}

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

  static async getSalesOrdersForRange(from: string, to: string, branchId?: string): Promise<SalesOrder[]> {
    try {
      let query = supabase
        .from('sales_orders')
        .select('*')
        .gte('created_at', from)
        .lte('created_at', `${to}T23:59:59.999Z`);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('getSalesOrdersForRange error', error);
        return [];
      }

      return (data || []) as SalesOrder[];
    } catch (error) {
      console.error('getSalesOrdersForRange exception', error);
      return [];
    }
  }

  static buildPartySummary(orders: SalesOrder[], partiesById: Record<string, string> = {}): PartySalesSummary[] {
    const map = new Map<string | null, PartySalesSummary>();

    for (const o of orders) {
      const key = o.party_id ?? null;
      const existing = map.get(key);
      const name =
        o.customer_name ||
        (o.party_id ? partiesById[o.party_id] || 'Party' : 'Walk-in Customer');
      if (!existing) {
        map.set(key, {
          party_id: key,
          customer_name: name,
          orders: 1,
          grand_total: o.grand_total ?? 0,
          paid_total: o.paid_total ?? 0,
          due_total: o.due_total ?? 0,
        });
      } else {
        existing.orders += 1;
        existing.grand_total += o.grand_total ?? 0;
        existing.paid_total += o.paid_total ?? 0;
        existing.due_total += o.due_total ?? 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.grand_total - a.grand_total);
  }

  static buildEmployeeSummary(orders: SalesOrder[], employeesById: Record<string, string> = {}): EmployeeSalesSummary[] {
    const map = new Map<string | null, EmployeeSalesSummary>();

    for (const o of orders) {
      const key = o.employee_id ?? null;
      const name = key ? employeesById[key] || 'Employee' : 'N/A';
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          employee_id: key,
          employee_name: name,
          orders: 1,
          grand_total: o.grand_total ?? 0,
          paid_total: o.paid_total ?? 0,
          due_total: o.due_total ?? 0,
        });
      } else {
        existing.orders += 1;
        existing.grand_total += o.grand_total ?? 0;
        existing.paid_total += o.paid_total ?? 0;
        existing.due_total += o.due_total ?? 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.grand_total - a.grand_total);
  }

  static buildPeriodSummary(orders: SalesOrder[], group: PeriodGroup): PeriodSalesSummary[] {
    const map = new Map<string, PeriodSalesSummary>();

    for (const o of orders) {
      const d = new Date(o.created_at);
      let key: string;
      if (group === 'year') {
        key = `${d.getFullYear()}`;
      } else if (group === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = d.toISOString().slice(0, 10);
      }

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          period: key,
          orders: 1,
          grand_total: o.grand_total ?? 0,
          paid_total: o.paid_total ?? 0,
          due_total: o.due_total ?? 0,
        });
      } else {
        existing.orders += 1;
        existing.grand_total += o.grand_total ?? 0;
        existing.paid_total += o.paid_total ?? 0;
        existing.due_total += o.due_total ?? 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }
}

