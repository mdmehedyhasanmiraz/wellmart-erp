import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function key(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

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
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

    const [{ data: orders, error: oErr }, { data: pays, error: pErr }] = await Promise.all([
      db.from('sales_orders').select('grand_total,created_at').eq('branch_id', branchId).gte('created_at', start),
      db.from('sales_payments').select('amount,paid_at,sales_orders!inner(branch_id)').eq('sales_orders.branch_id', branchId).gte('paid_at', start),
    ]);
    if (oErr || pErr) return NextResponse.json({ error: 'Query failed' }, { status: 500 });

    const months: { month: string; sales: number; collection: number }[] = [];
    const idx = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = key(d);
      idx.set(k, months.length);
      months.push({ month: k, sales: 0, collection: 0 });
    }

    type OrderRow = { grand_total: number | null; created_at: string };
    type PaymentRow = { amount: number | null; paid_at: string };

    const orderRows: ReadonlyArray<OrderRow> = (orders ?? []) as OrderRow[];
    const paymentRows: ReadonlyArray<PaymentRow> = (pays ?? []) as PaymentRow[];

    orderRows.forEach((r) => {
      const k = key(new Date(r.created_at));
      const i = idx.get(k); if (i !== undefined) months[i].sales += Number(r.grand_total ?? 0);
    });
    paymentRows.forEach((r) => {
      const k = key(new Date(r.paid_at));
      const i = idx.get(k); if (i !== undefined) months[i].collection += Number(r.amount ?? 0);
    });

    return NextResponse.json({ months });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute monthly stats' }, { status: 500 });
  }
}


