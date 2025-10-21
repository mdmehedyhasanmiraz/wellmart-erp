import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create admin client with service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get all sales orders to see what's in the database
    const { data: orders, error } = await supabase
      .from('sales_orders')
      .select('id, status, created_at, customer_name, grand_total')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch orders', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Sales orders found',
      count: orders?.length || 0,
      orders: orders || []
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
