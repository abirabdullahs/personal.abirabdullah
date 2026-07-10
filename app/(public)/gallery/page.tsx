'use client';

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';

const fallbackGallery = [
  { id: 1, url: "https://picsum.photos/seed/gal1/800/800", name: "Landscape" },
  { id: 2, url: "https://picsum.photos/seed/gal2/800/800", name: "Coding Session" },
  { id: 3, url: "https://picsum.photos/seed/gal3/800/800", name: "Conference" },
  { id: 4, url: "https://picsum.photos/seed/gal4/800/800", name: "Hike" },
  { id: 5, url: "https://picsum.photos/seed/gal5/800/800", name: "Office Setup" },
  { id: 6, url: "https://picsum.photos/seed/gal6/800/800", name: "Project Launch" },
];

export default function GalleryPage() {
  const [images, setImages] = React.useState<any[]>(fallbackGallery);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Immediate local load
    try {
      const stored = localStorage.getItem('portfolio_gallery');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImages(parsed);
        }
      } else {
        localStorage.setItem('portfolio_gallery', JSON.stringify(fallbackGallery));
      }
    } catch (e) {
      console.error("Error loading gallery from localStorage", e);
    } finally {
      setLoading(false);
    }

    // 2. Async background Supabase sync if credentials exist
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();
          const { data, error } = await client
            .from('gallery')
            .select('*');
          
          if (error) throw error;
          if (data && data.length > 0) {
            setImages(data);
            localStorage.setItem('portfolio_gallery', JSON.stringify(data));
          }
        } catch (err) {
          console.warn("Background Supabase gallery sync bypassed:", err);
        }
      }
      syncSupabase();
    }
  }, []);

  return (
    <div className="container px-4 py-16 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Gallery</h1>
        <p className="text-lg text-muted-foreground">
          A visual collection of moments, workspace setups, and event highlights.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
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
