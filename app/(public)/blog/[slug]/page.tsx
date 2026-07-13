import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase';
import BlogPostPageClient from './blog-detail-client';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const client = getSupabase();
    const { data } = await client.from('blogs').select('title, excerpt, featured_image').eq('slug', slug).maybeSingle();

    if (data) {
      return {
        title: data.title,
        description: data.excerpt || undefined,
        openGraph: {
          title: data.title,
          description: data.excerpt || undefined,
          type: 'article',
          images: data.featured_image ? [{ url: data.featured_image }] : undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title: data.title,
          description: data.excerpt || undefined,
          images: data.featured_image ? [data.featured_image] : undefined,
        },
      };
    }
  } catch (err) {
    console.warn('generateMetadata: blog fetch failed', err);
  }

  return {
    title: 'Blog Post',
  };
}

export default function BlogPostPage({ params }: Props) {
  return <BlogPostPageClient params={params} />;
}
