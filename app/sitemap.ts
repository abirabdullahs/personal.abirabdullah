import type { MetadataRoute } from 'next';
import { getSupabase } from '@/lib/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abirabdullah.me';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/posts`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/gallery`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const client = getSupabase();

    const [{ data: projects }, { data: blogs }] = await Promise.all([
      client.from('projects').select('slug, created_at'),
      client.from('blogs').select('slug, published_at').eq('status', 'published'),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = (projects || []).map((p: any) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((b: any) => ({
      url: `${siteUrl}/blog/${b.slug}`,
      lastModified: b.published_at ? new Date(b.published_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [...staticRoutes, ...projectRoutes, ...blogRoutes];
  } catch (err) {
    console.warn('sitemap: failed to fetch dynamic routes, returning static routes only', err);
    return staticRoutes;
  }
}
