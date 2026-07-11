import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getSupabaseAdmin } from '@/lib/supabase';
import { signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

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

    if (!data) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, data.password);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await signAdminToken({ id: data.id, email: data.email, name: data.name });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: data.id,
        email: data.email,
        name: data.name,
      },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ error: error?.message || 'Unable to verify admin credentials.' }, { status: 500 });
  }
}
