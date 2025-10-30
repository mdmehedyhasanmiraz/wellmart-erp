import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }
    const db = createClient(url, serviceKey, { db: { schema: 'public' } });

    const now = new Date();
    const ymd = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const sum = async (table: string, column: string, fromCol = 'created_at', from?: string): Promise<number> => {
      let query = db.from(table).select(`${column}`).gt(column, 0);
      if (from) query = query.gte(fromCol, from);
      const { data, error } = await query;
      if (error || !data) return 0;
      type SumRow = Record<string, number | null>;
      const rows: ReadonlyArray<SumRow> = data as unknown as SumRow[];
      return rows.reduce((acc, row) => acc + Number((row[column] ?? 0)), 0);
    };

    const totalSales = await sum('sales_orders', 'grand_total');
    const monthlySales = await sum('sales_orders', 'grand_total', 'created_at', monthStart);
    const todaysSales = await sum('sales_orders', 'grand_total', 'created_at', todayStart);

    const totalDue = await sum('sales_orders', 'due_total');
    const monthlyDue = await sum('sales_orders', 'due_total', 'created_at', monthStart);
    const todaysDue = await sum('sales_orders', 'due_total', 'created_at', todayStart);

    const totalCollection = await sum('sales_payments', 'amount', 'paid_at');
    const monthlyCollection = await sum('sales_payments', 'amount', 'paid_at', monthStart);
    const todaysCollection = await sum('sales_payments', 'amount', 'paid_at', todayStart);

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


