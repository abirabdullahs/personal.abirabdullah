'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type LightboxImage = {
  id: number | string;
  url: string;
  name: string;
  caption?: string;
};

type GalleryLightboxProps = {
  images: LightboxImage[];
  index: number | null;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
};

export function GalleryLightbox({ images, index, onOpenChange, onNavigate }: GalleryLightboxProps) {
  const [downloading, setDownloading] = React.useState(false);
  const open = index !== null;
  const image = index !== null ? images[index] : null;

  const goPrev = React.useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const goNext = React.useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goPrev, goNext]);

  const handleDownload = async () => {
    if (!image) return;
    setDownloading(true);
    try {
      const res = await fetch(image.url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = blob.type.split('/')[1] || 'jpg';
      link.download = `${image.name || 'image'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Image download failed:', err);
      toast.error('Could not download this image. Try opening it in a new tab instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[95vw] sm:max-w-4xl w-full p-0 border-none bg-transparent shadow-none rounded-none"
      >
        <DialogTitle className="sr-only">{image?.name || 'Gallery image'}</DialogTitle>
        {image && (
          <div className="relative bg-background border border-border">
            <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black">
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
                sizes="95vw"
                priority
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{image.name}</p>
                {image.caption && <p className="text-xs text-muted-foreground truncate">{image.caption}</p>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-1.5 rounded-none shrink-0"
              >
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
