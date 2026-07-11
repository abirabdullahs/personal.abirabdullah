import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase';
import ProjectDetailPageClient from './project-detail-client';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const client = getSupabase();
    const { data } = await client.from('projects').select('name, short_description, image_url').eq('slug', slug).maybeSingle();

    if (data) {
      return {
        title: data.name,
        description: data.short_description || undefined,
        openGraph: {
          title: data.name,
          description: data.short_description || undefined,
          type: 'article',
          images: data.image_url ? [{ url: data.image_url }] : undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title: data.name,
          description: data.short_description || undefined,
        },
      };
    }
  } catch (err) {
    console.warn('generateMetadata: project fetch failed', err);
  }

  return {
    title: 'Project',
  };
}

export default function ProjectDetailPage(_props: Props) {
  return <ProjectDetailPageClient />;
}
