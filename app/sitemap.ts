import type { MetadataRoute } from 'next';
import { getSupabase } from '@/lib/supabase';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abirabdullah.me';

// Without this, Next.js bakes sitemap.xml as a static snapshot at build
// time — any gallery/project/blog images added afterward (through the
// admin panel, with no new code deploy) would never show up in the
// sitemap Google actually reads. Revalidating hourly keeps it in sync
// with the database without needing a fresh deploy for every content change.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/posts`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/contact`, changeFrequency: 'yearly', priority: 0.4 },
  ];

  try {
    const client = getSupabase();

    const [{ data: projects }, { data: blogs }, { data: galleryImages }] = await Promise.all([
      client.from('projects').select('slug, created_at, image_url'),
      client.from('blogs').select('slug, published_at, featured_image').eq('status', 'published'),
      // Sitemap image entries cap at 1,000 images per URL (Google's limit) —
      // comfortably covers a personal portfolio's gallery.
      client.from('gallery').select('url').limit(1000),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = (projects || []).map((p: any) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: p.image_url ? [optimizeCloudinaryUrl(p.image_url)] : undefined,
    }));

    const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((b: any) => ({
      url: `${siteUrl}/blog/${b.slug}`,
      lastModified: b.published_at ? new Date(b.published_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: b.featured_image ? [optimizeCloudinaryUrl(b.featured_image)] : undefined,
    }));

    const galleryRoute: MetadataRoute.Sitemap = [
      {
        url: `${siteUrl}/gallery`,
        changeFrequency: 'monthly',
        priority: 0.5,
        images: (galleryImages || []).map((img: any) => optimizeCloudinaryUrl(img.url)).filter(Boolean),
      },
    ];

    return [...staticRoutes, ...projectRoutes, ...blogRoutes, ...galleryRoute];
  } catch (err) {
    console.warn('sitemap: failed to fetch dynamic routes, returning static routes only', err);
    return [...staticRoutes, { url: `${siteUrl}/gallery`, changeFrequency: 'monthly', priority: 0.5 }];
  }
}
