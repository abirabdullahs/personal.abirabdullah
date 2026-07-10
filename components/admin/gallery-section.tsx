import { Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PortfolioGalleryItem } from '@/lib/portfolio-data';

type GallerySectionProps = {
  gallery: PortfolioGalleryItem[];
  filteredGallery: PortfolioGalleryItem[];
  onAdd: () => void;
  onDelete: (id: number | string, name: string) => void;
};

export function GallerySection({ gallery, filteredGallery, onAdd, onDelete }: GallerySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <ImageIcon className="h-4 w-4" /> Add Gallery Asset
        </Button>
      </div>

      {gallery.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No gallery images have been uploaded yet.
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No gallery items matched the current search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredGallery.map((image) => (
            <Card key={image.id} className="group relative aspect-square overflow-hidden border border-border bg-card shadow-none">
              <Image src={image.url} alt={image.name} fill className="object-cover transition-transform duration-200 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex justify-end">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => onDelete(image.id, image.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-semibold">{image.name}</p>
                  {image.caption ? <p className="text-xs text-white/80">{image.caption}</p> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
