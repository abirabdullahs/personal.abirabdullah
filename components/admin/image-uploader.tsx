'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
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

export function ImageUploader({ value, onChange, folder = 'portfolio', label = 'Image' }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    // Base64 inflates size ~37%, and Vercel's serverless function body limit
    // is 4.5MB — keep the raw file well under that after inflation.
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image is too large (max 3MB). Try compressing it first.');
      return;
    }

    setUploading(true);
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
        // Response wasn't JSON at all — e.g. a platform-level 413/502 error
        // page instead of our route's own error response.
        throw new Error(
          response.status === 413
            ? 'Image is too large for the server to accept. Try a smaller file.'
            : `Upload failed (server returned an unexpected response, status ${response.status}).`
        );
      }

      if (!response.ok) throw new Error(result.error || 'Upload failed');
      onChange(result.url);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'Upload failed. You can still paste a URL below.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <Image src={value} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}

        <div className="flex-1 space-y-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
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
            {uploading ? 'Uploading...' : 'Upload image'}
          </Button>
          <p className="text-[10px] text-muted-foreground">Uploads to Cloudinary, or paste a URL directly below.</p>
        </div>
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://res.cloudinary.com/..."
        className="bg-muted/10 text-xs font-mono"
      />
    </div>
  );
}
