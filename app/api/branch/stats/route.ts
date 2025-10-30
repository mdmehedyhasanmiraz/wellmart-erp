import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    const db = createClient(url, serviceKey, { db: { schema: 'public' } });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const sumOrders = async (column: string, from?: string): Promise<number> => {
      let q = db.from('sales_orders').select(column).eq('branch_id', branchId);
      if (from) q = q.gte('created_at', from);
      const { data, error } = await q;
      if (error || !data) return 0;
      type SumRow = Record<string, number | null>;
      const rows: ReadonlyArray<SumRow> = data as unknown as SumRow[];
      return rows.reduce((acc, r) => acc + Number((r[column] ?? 0)), 0);
    };

    const sumPayments = async (from?: string): Promise<number> => {
      // join payments -> sales_orders to filter by branch
      let q = db.from('sales_payments').select('amount, paid_at, sales_orders!inner(branch_id)').eq('sales_orders.branch_id', branchId);
      if (from) q = q.gte('paid_at', from);
      const { data, error } = await q;
      if (error || !data) return 0;
      type PaymentRow = { amount: number | null };
      const rows: ReadonlyArray<PaymentRow> = data as unknown as PaymentRow[];
      return rows.reduce((acc, r) => acc + Number((r.amount ?? 0)), 0);
    };

    const totalSales = await sumOrders('grand_total');
    const monthlySales = await sumOrders('grand_total', monthStart);
    const todaysSales = await sumOrders('grand_total', todayStart);

    const totalDue = await sumOrders('due_total');
    const monthlyDue = await sumOrders('due_total', monthStart);
    const todaysDue = await sumOrders('due_total', todayStart);

    const totalCollection = await sumPayments();
    const monthlyCollection = await sumPayments(monthStart);
    const todaysCollection = await sumPayments(todayStart);

    return NextResponse.json({
      totalSales,
      monthlySales,
      todaysSales,
      totalDue,
      monthlyDue,
      todaysDue,
      totalCollection,
      monthlyCollection,
      todaysCollection,
      generatedAt: now.toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}


