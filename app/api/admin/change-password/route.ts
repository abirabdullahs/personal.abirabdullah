import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = getAdminFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = body?.currentPassword?.toString();
    const newPassword = body?.newPassword?.toString();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const client = getSupabaseAdmin();

    const { data, error } = await client
      .from('admin')
      .select('id, password')
      .eq('id', session.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    const currentMatches = await bcrypt.compare(currentPassword, data.password);
    if (!currentMatches) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await client
      .from('admin')
      .update({ password: newHash, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password change failed:', error);
    return NextResponse.json({ error: error?.message || 'Unable to change password.' }, { status: 500 });
  }
}
