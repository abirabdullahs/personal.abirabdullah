import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { error } = await getSupabase().rpc('increment_blog_views', {
      blog_slug: slug,
    });

    if (error) throw error;

    return NextResponse.json({ message: 'View incremented' });
  } catch (error) {
    console.error('Error incrementing view:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
