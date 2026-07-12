'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, Upload, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type GalleryImageItem = {
  id?: number | string;
  image_url: string;
  alt_text?: string;
};

type ImageGalleryUploaderProps = {
  images: GalleryImageItem[];
  onChange: (images: GalleryImageItem[]) => void;
  folder?: string;
  label?: string;
};

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export function ImageGalleryUploader({ images, onChange, folder = 'portfolio', label = 'Gallery images' }: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: GalleryImageItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped "${file.name}" — not an image file.`);
        continue;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`Skipped "${file.name}" — too large (max 3MB).`);
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
        uploaded.push({ image_url: result.url, alt_text: '' });
      } catch (err: any) {
        console.error('Gallery image upload failed:', err);
        toast.error(err.message || `Failed to upload "${file.name}"`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} image(s) added`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  const updateAltText = (index: number, altText: string) => {
    const next = images.map((img, i) => (i === index ? { ...img, alt_text: altText } : img));
    onChange(next);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase">{label}</label>
        <span className="text-[10px] text-muted-foreground">{images.length} image(s)</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div key={img.id ?? `new-${index}`} className="space-y-1.5">
              <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
                <Image src={img.image_url} alt={img.alt_text || ''} fill className="object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    className="rounded bg-black/60 px-1 text-[10px] text-white hover:bg-black/80 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    className="rounded bg-black/60 px-1 text-[10px] text-white hover:bg-black/80 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
              <input
                value={img.alt_text || ''}
                onChange={(e) => updateAltText(index, e.target.value)}
                placeholder="Alt text (optional)"
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
        className="gap-1.5 text-xs"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading...' : 'Add images'}
      </Button>
      <p className="text-[10px] text-muted-foreground">
        These show as a gallery on the project's detail page. Use the arrows to reorder.
      </p>
    </div>
  );
}
