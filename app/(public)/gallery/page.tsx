import type { Metadata } from 'next';
import GalleryPageClient from './gallery-client';
import { getSupabase } from '@/lib/supabase';
import type { PortfolioGalleryAlbum, PortfolioGalleryItem } from '@/lib/portfolio-data';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abirabdullah.me';
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: 'Gallery',
  description: "A collection of photos and moments from Abir Abdullah's journey.",
};

export const revalidate = 3600; // re-fetch server-side data at most once an hour

export default async function GalleryPage() {
  let initialImages: PortfolioGalleryItem[] = [];
  let initialAlbums: PortfolioGalleryAlbum[] = [];
  let initialAlbumCounts: Record<string, number> = {};
  let initialTotalCount = 0;

  try {
    const client = getSupabase();
    const [imagesRes, albumsRes, countsRes] = await Promise.all([
      client.from('gallery').select('*').order('id', { ascending: false }).limit(PAGE_SIZE),
      client.from('gallery_albums').select('*').order('created_at', { ascending: false }),
      client.from('gallery').select('id, album_id'),
    ]);

    if (imagesRes.data) initialImages = imagesRes.data as PortfolioGalleryItem[];
    if (albumsRes.data) initialAlbums = albumsRes.data as PortfolioGalleryAlbum[];
    if (countsRes.data) {
      const counts: Record<string, number> = {};
      for (const row of countsRes.data as { album_id: string | number | null }[]) {
        if (row.album_id === null || row.album_id === undefined) continue;
        const key = String(row.album_id);
        counts[key] = (counts[key] || 0) + 1;
      }
      initialAlbumCounts = counts;
      initialTotalCount = countsRes.data.length;
    }
  } catch (err) {
    console.warn('Gallery server-side fetch failed, client will retry:', err);
  }

  // ImageGallery structured data — helps Google associate these images with
  // this page as a real gallery, on top of them being visible in the actual
  // server-rendered HTML below (the part that matters most for indexing).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: "Abir Abdullah's Gallery",
    url: `${siteUrl}/gallery`,
    image: initialImages.map((img) => img.url),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GalleryPageClient
        initialImages={initialImages}
        initialAlbums={initialAlbums}
        initialAlbumCounts={initialAlbumCounts}
        initialTotalCount={initialTotalCount}
      />
    </>
  );
}
