'use client';

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';
import { portfolioStorageKeys, readStoredCollection, type PortfolioGalleryAlbum, type PortfolioGalleryItem } from '@/lib/portfolio-data';

export default function GalleryPage() {
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
          if (imageData && imageData.length > 0) {
            setImages(imageData as PortfolioGalleryItem[]);
            localStorage.setItem(portfolioStorageKeys.gallery, JSON.stringify(imageData));
          }

          // gallery_albums may not exist yet on older setups — fail quietly, flat grid still works.
          if (!albumError && albumData) {
            setAlbums(albumData as PortfolioGalleryAlbum[]);
            localStorage.setItem(portfolioStorageKeys.galleryAlbums, JSON.stringify(albumData));
          }
        } catch (err) {
          console.warn('Background Supabase gallery sync bypassed:', err);
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
    <div className="container px-4 py-16 space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Gallery</h1>
        <p className="text-lg text-muted-foreground">
          A visual collection of moments, workspace setups, and event highlights.
        </p>
      </div>

      {!loading && albums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeAlbum === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveAlbum('all')}
          >
            All ({images.length})
          </Badge>
          {albums.map((album) => (
            <Badge
              key={album.id}
              variant={activeAlbum === album.id ? 'default' : 'outline'}
              className="cursor-pointer"
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
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {images.length === 0
            ? 'The gallery is empty right now. Add images from the admin dashboard to populate this page.'
            : 'No images in this album yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group cursor-pointer border border-border bg-card">
              <CardContent className="p-0 aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium px-4 text-center">{image.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
