import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, newPassword } = body as {
      userId: string;
      newPassword: string;
    };

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server is not configured for admin operations' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Update the user's password using admin privileges
    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully',
      user: data.user 
    }, { status: 200 });

  } catch (err) {
    console.error('Password update error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
