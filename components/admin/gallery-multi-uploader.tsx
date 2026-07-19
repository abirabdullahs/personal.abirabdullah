'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';

export type PendingGalleryItem = {
  name: string;
  url: string;
};

type GalleryMultiUploaderProps = {
  items: PendingGalleryItem[];
  onChange: (items: PendingGalleryItem[]) => void;
  folder?: string;
};

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function filenameToLabel(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Untitled';
}

export function GalleryMultiUploader({ items, onChange, folder = 'portfolio/gallery' }: GalleryMultiUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: fileArray.length });

    const uploaded: PendingGalleryItem[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped "${file.name}" — not an image file.`);
        setProgress({ done: i + 1, total: fileArray.length });
        continue;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`Skipped "${file.name}" — too large (max 3MB).`);
        setProgress({ done: i + 1, total: fileArray.length });
        continue;
      }

      try {
        const dataUri = await fileToDataUri(file);
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUri, folder }),
        });

        let result: any;
        try {
          result = await response.json();
        } catch {
          throw new Error(
            response.status === 413
              ? 'Image is too large for the server to accept.'
              : `Upload failed (unexpected server response, status ${response.status}).`
          );
        }

        if (!response.ok) throw new Error(result.error || 'Upload failed');
        uploaded.push({ name: filenameToLabel(file.name), url: result.url });
      } catch (err: any) {
        console.error('Gallery image upload failed:', err);
        toast.error(err.message || `Failed to upload "${file.name}"`);
      }

      setProgress({ done: i + 1, total: fileArray.length });
    }

    if (uploaded.length > 0) {
      onChange([...items, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }

    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const renameItem = (index: number, name: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, index) => (
            <div key={`${item.url}-${index}`} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                <Image src={optimizeCloudinaryUrl(item.url)} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <input
                value={item.name}
                onChange={(e) => renameItem(index, e.target.value)}
                placeholder="Image name"
                className="w-full rounded border border-input bg-muted/10 px-2 py-1 text-[10px]"
              />
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading && progress ? `Uploading ${progress.done}/${progress.total}...` : items.length > 0 ? 'Add more images' : 'Select images'}
      </Button>
      <p className="text-[10px] text-muted-foreground">
        Select multiple files at once. Each gets its own name (editable) — all will be added to the album chosen below.
      </p>
    </div>
  );
}
