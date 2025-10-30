import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Verify transfer exists to give clearer errors
    const { data: transfer, error: tErr } = await admin
      .from('branch_transfers')
      .select('*')
      .eq('id', transferId)
      .single();
    if (tErr || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Only the receiving branch can complete
    if (actorBranchId && transfer.to_branch_id !== actorBranchId) {
      return NextResponse.json({ error: 'Only receiving branch can complete this transfer' }, { status: 403 });
    }

    // Try RPC first (if present in your DB to handle stock moves)
    const { error: rpcError } = await admin
      .rpc('complete_branch_transfer', { p_transfer_id: transferId, p_actor: actorId ?? null });

    if (rpcError) {
      // Fallback: direct status update when RPC enforces a workflow not in use
      const { error: upErr } = await admin
        .from('branch_transfers')
        .update({ status: 'completed', completed_by: actorId ?? null, updated_at: new Date().toISOString() })
        .eq('id', transferId);
      if (upErr) {
        return NextResponse.json({ error: 'Failed to complete transfer', details: rpcError.message || upErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}


