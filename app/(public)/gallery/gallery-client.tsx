'use client';

import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';
import { checkSupabaseConfig } from '@/lib/supabase-status';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { GalleryLightbox } from '@/components/gallery-lightbox';
import { portfolioStorageKeys, readStoredCollection, type PortfolioGalleryAlbum, type PortfolioGalleryItem } from '@/lib/portfolio-data';

const PAGE_SIZE = 12; // multiple of the 2/3/4-column grid so rows stay full

async function fetchGalleryPage(
  client: ReturnType<typeof getSupabase>,
  albumId: 'all' | number | string,
  cursor: number | string | null
): Promise<PortfolioGalleryItem[]> {
  let query = client.from('gallery').select('*').order('id', { ascending: false }).limit(PAGE_SIZE);
  if (albumId !== 'all') query = query.eq('album_id', albumId);
  if (cursor !== null) query = query.lt('id', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data as PortfolioGalleryItem[]) || [];
}

function GalleryPageClient() {
  const [images, setImages] = React.useState<PortfolioGalleryItem[]>([]);
  const [albumCounts, setAlbumCounts] = React.useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = React.useState(0);
  const [albums, setAlbums] = React.useState<PortfolioGalleryAlbum[]>([]);
  const [activeAlbum, setActiveAlbum] = React.useState<'all' | number | string>('all');
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const hasSupabase = React.useMemo(() => checkSupabaseConfig(), []);

  // Initial load: cached instant-paint + first page + albums + lightweight counts
  React.useEffect(() => {
    const storedImages = readStoredCollection<PortfolioGalleryItem[]>(portfolioStorageKeys.gallery, []);
    const storedAlbums = readStoredCollection<PortfolioGalleryAlbum[]>(portfolioStorageKeys.galleryAlbums, []);
    if (storedImages.length > 0) setImages(storedImages.slice(0, PAGE_SIZE));
    setAlbums(storedAlbums);
    setLoading(false);

    if (!hasSupabase) {
      setHasMore(false);
      return;
    }

    (async () => {
      try {
        const client = getSupabase();
        const [firstPage, albumsRes, countsRes] = await Promise.all([
          fetchGalleryPage(client, 'all', null),
          client.from('gallery_albums').select('*').order('created_at', { ascending: false }),
          // Lightweight — just ids/album_ids, not full image payloads — used purely for accurate per-album counts under pagination.
          client.from('gallery').select('id, album_id'),
        ]);

        setImages(firstPage);
        setHasMore(firstPage.length === PAGE_SIZE);
        localStorage.setItem(portfolioStorageKeys.gallery, JSON.stringify(firstPage));

        if (!albumsRes.error && albumsRes.data) {
          setAlbums(albumsRes.data as PortfolioGalleryAlbum[]);
          localStorage.setItem(portfolioStorageKeys.galleryAlbums, JSON.stringify(albumsRes.data));
        }

        if (!countsRes.error && countsRes.data) {
          const counts: Record<string, number> = {};
          for (const row of countsRes.data as { album_id: string | number | null }[]) {
            if (row.album_id === null || row.album_id === undefined) continue;
            const key = String(row.album_id);
            counts[key] = (counts[key] || 0) + 1;
          }
          setAlbumCounts(counts);
          setTotalCount(countsRes.data.length);
        }
      } catch (err: any) {
        console.error('Supabase gallery sync failed:', err);
        toast.error('Could not load the latest gallery images — showing cached data if available.');
      }
    })();
  }, [hasSupabase]);

  const handleAlbumChange = async (albumId: 'all' | number | string) => {
    setActiveAlbum(albumId);
    if (!hasSupabase) return;

    setLoading(true);
    try {
      const client = getSupabase();
      const firstPage = await fetchGalleryPage(client, albumId, null);
      setImages(firstPage);
      setHasMore(firstPage.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Gallery album filter failed:', err);
      toast.error('Could not load this album.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (images.length === 0) return;
    const cursor = images[images.length - 1].id;

    setLoadingMore(true);
    try {
      const client = getSupabase();
      const nextPage = await fetchGalleryPage(client, activeAlbum, cursor);
      setImages((prev) => [...prev, ...nextPage]);
      setHasMore(nextPage.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Load more gallery images failed:', err);
      toast.error('Could not load more images. Try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="container px-4 py-12 md:py-16 space-y-8">
      <div className="max-w-2xl border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— Field Notes</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Gallery</h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          A visual collection of moments, workspace setups, and event highlights.
        </p>
      </div>

      {!loading && albums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeAlbum === 'all' ? 'default' : 'outline'}
            className="cursor-pointer rounded-none font-mono text-[11px] uppercase tracking-wider"
            onClick={() => handleAlbumChange('all')}
          >
            All ({totalCount || images.length})
          </Badge>
          {albums.map((album) => (
            <Badge
              key={album.id}
              variant={activeAlbum === album.id ? 'default' : 'outline'}
              className="cursor-pointer rounded-none font-mono text-[11px] uppercase tracking-wider"
              onClick={() => handleAlbumChange(album.id)}
            >
              {album.name} ({albumCounts[String(album.id)] || 0})
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title={activeAlbum === 'all' ? 'Gallery is empty' : 'No images in this album'}
          message={
            activeAlbum === 'all'
              ? 'Add images from the admin dashboard to populate this page.'
              : 'Try a different album, or check back soon.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {images.map((image, idx) => (
              <div
                key={image.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative aspect-square overflow-hidden border border-border bg-muted cursor-pointer"
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-sm font-medium">{image.name}</span>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="rounded-none gap-2">
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      <GalleryLightbox
        images={images}
        index={lightboxIndex}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}

export default GalleryPageClient;
