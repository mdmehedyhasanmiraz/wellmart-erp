import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type TransferItemRow = {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  batch_id: string | null;
};

async function ensureBatchRow(
  admin: SupabaseClient,
  productId: string,
  branchId: string,
  batchId: string
) {
  const tableName = 'product_branch_batch_stocks' as unknown as never;
  await admin
    .from(tableName)
    .upsert(
      { product_id: productId, branch_id: branchId, batch_id: batchId, quantity: 0 } as never,
      { onConflict: 'product_id,branch_id,batch_id' }
    );
}

export async function POST(req: NextRequest) {
  try {
    const { transferId, actorId, actorBranchId } = await req.json();
    if (!transferId) {
      return NextResponse.json({ error: 'transferId is required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const admin = createClient(url, serviceKey, { db: { schema: 'public' } });

    // Load transfer
    const { data: transfer, error: tErr } = await admin
      .from('branch_transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    if (tErr || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Only the receiving branch may complete
    if (actorBranchId && transfer.to_branch_id !== actorBranchId) {
      return NextResponse.json({ error: 'Only receiving branch can complete this transfer' }, { status: 403 });
    }

    // Must be approved
    if (transfer.status !== 'approved') {
      return NextResponse.json({ error: 'Transfer is not approved' }, { status: 400 });
    }

    // Load items
    const { data: items, error: iErr } = await admin
      .from('branch_transfer_items')
      .select('*')
      .eq('transfer_id', transferId);

    if (iErr || !items || items.length === 0) {
      return NextResponse.json({ error: 'No items for this transfer' }, { status: 400 });
    }

    // Ensure helper RPC exists: create exec_adjust_batch_stock
    // This should be installed in DB (see note). Here we call it.
    for (const item of items as TransferItemRow[]) {
      if (!item.batch_id) {
        return NextResponse.json({ error: `Missing batch_id for item ${item.id}` }, { status: 400 });
      }

      // Outgoing
      await ensureBatchRow(admin, item.product_id, transfer.from_branch_id, item.batch_id);
      const { error: decErr } = await admin.rpc('exec_adjust_batch_stock', {
        p_product_id: item.product_id,
        p_branch_id: transfer.from_branch_id,
        p_batch_id: item.batch_id,
        p_delta: -item.quantity
      });
      if (decErr) {
        return NextResponse.json({ error: decErr.message }, { status: 400 });
      }

      // Incoming
      await ensureBatchRow(admin, item.product_id, transfer.to_branch_id, item.batch_id);
      const { error: incErr } = await admin.rpc('exec_adjust_batch_stock', {
        p_product_id: item.product_id,
        p_branch_id: transfer.to_branch_id,
        p_batch_id: item.batch_id,
        p_delta: item.quantity
      });
      if (incErr) {
        return NextResponse.json({ error: incErr.message }, { status: 400 });
      }
    }

    // Mark transfer complete
    const { error: upErr } = await admin
      .from('branch_transfers')
      .update({ status: 'completed', completed_by: actorId ?? null, updated_at: new Date().toISOString() })
      .eq('id', transferId);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('complete transfer error', e);
    return NextResponse.json({ error: 'Unexpected error', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
