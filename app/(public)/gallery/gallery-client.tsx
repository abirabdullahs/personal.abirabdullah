'use client';

import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { portfolioStorageKeys, readStoredCollection, type PortfolioGalleryAlbum, type PortfolioGalleryItem } from '@/lib/portfolio-data';

function GalleryPageClient() {
  const [images, setImages] = React.useState<PortfolioGalleryItem[]>([]);
  const [albums, setAlbums] = React.useState<PortfolioGalleryAlbum[]>([]);
  const [activeAlbum, setActiveAlbum] = React.useState<'all' | number | string>('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const storedImages = readStoredCollection<PortfolioGalleryItem[]>(portfolioStorageKeys.gallery, []);
    const storedAlbums = readStoredCollection<PortfolioGalleryAlbum[]>(portfolioStorageKeys.galleryAlbums, []);
    setImages(storedImages);
    setAlbums(storedAlbums);
    setLoading(false);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();
          const [{ data: imageData, error: imageError }, { data: albumData, error: albumError }] = await Promise.all([
            client.from('gallery').select('*'),
            client.from('gallery_albums').select('*').order('created_at', { ascending: false }),
          ]);

          if (imageError) throw imageError;
          const rows = (imageData as PortfolioGalleryItem[]) || [];
          setImages(rows);
          localStorage.setItem(portfolioStorageKeys.gallery, JSON.stringify(rows));

          // gallery_albums may not exist yet on older setups — fail quietly, flat grid still works.
          if (!albumError && albumData) {
            setAlbums(albumData as PortfolioGalleryAlbum[]);
            localStorage.setItem(portfolioStorageKeys.galleryAlbums, JSON.stringify(albumData));
          }
        } catch (err: any) {
          console.error('Supabase gallery sync failed:', err);
          toast.error('Could not load the latest gallery images — showing cached data if available.');
        }
      }
      syncSupabase();
    }
  }, []);

  const visibleImages = activeAlbum === 'all'
    ? images
    : images.filter((img) => String(img.album_id ?? '') === String(activeAlbum));

  const countInAlbum = (albumId: number | string) => images.filter((img) => String(img.album_id ?? '') === String(albumId)).length;

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
            onClick={() => setActiveAlbum('all')}
          >
            All ({images.length})
          </Badge>
          {albums.map((album) => (
            <Badge
              key={album.id}
              variant={activeAlbum === album.id ? 'default' : 'outline'}
              className="cursor-pointer rounded-none font-mono text-[11px] uppercase tracking-wider"
              onClick={() => setActiveAlbum(album.id)}
            >
              {album.name} ({countInAlbum(album.id)})
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleImages.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title={images.length === 0 ? 'Gallery is empty' : 'No images in this album'}
          message={
            images.length === 0
              ? 'Add images from the admin dashboard to populate this page.'
              : 'Try a different album, or check back soon.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {visibleImages.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden border border-border bg-muted cursor-pointer">
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
      )}
    </div>
  );
}

export default GalleryPageClient;
