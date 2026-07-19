import * as React from 'react';
import { FolderPlus, Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PortfolioGalleryAlbum, PortfolioGalleryItem } from '@/lib/portfolio-data';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';

type GallerySectionProps = {
  gallery: PortfolioGalleryItem[];
  filteredGallery: PortfolioGalleryItem[];
  albums: PortfolioGalleryAlbum[];
  onAdd: () => void;
  onDelete: (id: number | string, name: string) => void;
  onCreateAlbum: (name: string) => void;
  onDeleteAlbum: (id: number | string, name: string) => void;
};

export function GallerySection({ gallery, filteredGallery, albums, onAdd, onDelete, onCreateAlbum, onDeleteAlbum }: GallerySectionProps) {
  const [activeAlbum, setActiveAlbum] = React.useState<'all' | number | string>('all');
  const [newAlbumName, setNewAlbumName] = React.useState('');

  const visibleGallery = activeAlbum === 'all'
    ? filteredGallery
    : filteredGallery.filter((img) => String(img.album_id ?? '') === String(activeAlbum));

  const countInAlbum = (albumId: number | string) => gallery.filter((img) => String(img.album_id ?? '') === String(albumId)).length;

  return (
    <div className="space-y-6">
      {/* Album management */}
      <Card className="border-border bg-card shadow-none p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Albums</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAlbumName.trim()) return;
            onCreateAlbum(newAlbumName.trim());
            setNewAlbumName('');
          }}
        >
          <Input
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="New album name (e.g. Conferences)"
            className="bg-muted/10 text-sm"
          />
          <Button type="submit" variant="outline" className="gap-1.5 shrink-0 text-xs">
            <FolderPlus className="h-4 w-4" /> Create
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            variant={activeAlbum === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveAlbum('all')}
          >
            All ({gallery.length})
          </Badge>
          {albums.map((album) => (
            <Badge
              key={album.id}
              variant={activeAlbum === album.id ? 'default' : 'outline'}
              className="cursor-pointer gap-1.5 group/album"
              onClick={() => setActiveAlbum(album.id)}
            >
              {album.name} ({countInAlbum(album.id)})
              <button
                type="button"
                className="opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAlbum(album.id, album.name);
                  if (activeAlbum === album.id) setActiveAlbum('all');
                }}
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <ImageIcon className="h-4 w-4" /> Add Gallery Asset
        </Button>
      </div>

      {gallery.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No gallery images have been uploaded yet.
        </div>
      ) : visibleGallery.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No gallery items matched the current search or album filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleGallery.map((image) => (
            <Card key={image.id} className="group relative aspect-square overflow-hidden border border-border bg-card shadow-none">
              <Image src={optimizeCloudinaryUrl(image.url)} alt={image.name} fill className="object-cover transition-transform duration-200 group-hover:scale-105" />
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
