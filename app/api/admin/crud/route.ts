import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;
    const table = body?.table;

    if (!action || !table) {
      return NextResponse.json({ error: 'Action and table are required.' }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    const tableName = table;

    switch (action) {
      case 'create': {
        const { data, error } = await client.from(tableName).insert(body.payload).select('*').single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
      case 'update': {
        const { data, error } = await client.from(tableName).update(body.payload).eq('id', body.id).select('*').single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
      case 'delete': {
        const { error } = await client.from(tableName).delete().eq('id', body.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
      case 'list': {
        const { data, error } = await client.from(tableName).select('*').order(body.orderBy || 'created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
      default:
        return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin CRUD failed:', error);
    return NextResponse.json({ error: error?.message || 'CRUD operation failed.' }, { status: 500 });
  }
}
