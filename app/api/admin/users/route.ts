import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, email, role, branch_id, phone } = body || {} as {
      name?: string; email?: string; role?: string; branch_id?: string | null; is_active?: boolean; password?: string; phone?: string
    };
    const { is_active = true, password } = body || {} as {
      name?: string; email?: string; role?: string; branch_id?: string | null; is_active?: boolean; password?: string; phone?: string
    };

    email = (email || '').toLowerCase().trim();
    name = (name || '').trim();
    role = (role || '').trim();
    phone = phone ? (phone || '').trim() : undefined;
    if (branch_id === '') branch_id = null;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedRoles = new Set(['admin','branch','employee']);
    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: `Invalid role '${role}'. Allowed: admin, branch, employee` }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server is not configured for admin operations' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: password && typeof password === 'string' && password.length >= 6 ? password : 'TempPassword123!',
      user_metadata: { name, role, branch_id, is_active, phone },
      email_confirm: true,
    });

    if (error) {
      const msg = error.message || 'Unknown error';
      const isDuplicate = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
      
      // Check if error is related to database/trigger failure
      const isDatabaseError = msg.toLowerCase().includes('database') || 
                              msg.toLowerCase().includes('trigger') ||
                              msg.toLowerCase().includes('constraint') ||
                              msg.toLowerCase().includes('foreign key');
      
      if (isDatabaseError) {
        console.error('Database error creating user:', {
          email,
          error: msg,
          metadata: { name, role, branch_id, is_active, phone }
        });
      }
      
      return NextResponse.json({ 
        error: isDatabaseError ? `Failed to create user: Database error creating new user - ${msg}` : msg 
      }, { status: isDuplicate ? 409 : 400 });
    }

    // Verify user was created in public.users table
    if (data?.user?.id) {
      // Give trigger a moment to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user exists in public.users
      const { data: userCheck, error: checkError } = await admin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (checkError || !userCheck) {
        console.error('User created in auth but not in public.users:', {
          userId: data.user.id,
          checkError: checkError?.message
        });
        return NextResponse.json({ 
          error: 'Failed to create user: Database error creating new user - User profile not created' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


