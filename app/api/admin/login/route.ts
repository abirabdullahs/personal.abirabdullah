import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.toString().trim();
    const password = body?.password?.toString();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    const { data, error } = await client
      .from('admin')
      .select('id, email, password, name')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!data || data.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: data.id,
        email: data.email,
        name: data.name,
      },
    });
  } catch (error: any) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ error: error?.message || 'Unable to verify admin credentials.' }, { status: 500 });
  }
}
