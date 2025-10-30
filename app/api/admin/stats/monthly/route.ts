import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }
    const db = createClient(url, serviceKey, { db: { schema: 'public' } });

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1); // last 12 months
    const startISO = start.toISOString();

    const [{ data: orders, error: oErr }, { data: pays, error: pErr }] = await Promise.all([
      db.from('sales_orders').select('grand_total,created_at').gte('created_at', startISO),
      db.from('sales_payments').select('amount,paid_at').gte('paid_at', startISO),
    ]);
    if (oErr || pErr) {
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    // initialize months buckets
    const months: { month: string; sales: number; collection: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: monthKey(d), sales: 0, collection: 0 });
    }
    const idx = new Map(months.map((m, i) => [m.month, i] as const));

    (orders || []).forEach((row: any) => {
      const m = monthKey(new Date(row.created_at));
      const i = idx.get(m);
      if (i !== undefined) months[i].sales += Number(row.grand_total || 0);
    });
    (pays || []).forEach((row: any) => {
      const m = monthKey(new Date(row.paid_at));
      const i = idx.get(m);
      if (i !== undefined) months[i].collection += Number(row.amount || 0);
    });

    return NextResponse.json({ months });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute monthly stats' }, { status: 500 });
  }
}


