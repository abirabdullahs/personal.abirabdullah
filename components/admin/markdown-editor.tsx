'use client';

import * as React from 'react';
import { Bold, Code, Eye, Heading2, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { toast } from 'sonner';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  /** Strips the boxed border/background — for full-page, Medium-style editors. */
  plain?: boolean;
  /** Cloudinary folder for images inserted via the toolbar. */
  imageFolder?: string;
};

type WrapOption = {
  icon: React.ElementType;
  label: string;
  before: string;
  after?: string;
  placeholder?: string;
  block?: boolean;
};

const toolbarItems: WrapOption[] = [
  { icon: Bold, label: 'Bold', before: '**', after: '**', placeholder: 'bold text' },
  { icon: Italic, label: 'Italic', before: '_', after: '_', placeholder: 'italic text' },
  { icon: Heading2, label: 'Heading', before: '### ', placeholder: 'Heading', block: true },
  { icon: LinkIcon, label: 'Link', before: '[', after: '](https://)', placeholder: 'link text' },
  { icon: List, label: 'Bullet list', before: '- ', placeholder: 'list item', block: true },
  { icon: ListOrdered, label: 'Numbered list', before: '1. ', placeholder: 'list item', block: true },
  { icon: Code, label: 'Code block', before: '```\n', after: '\n```', placeholder: 'code here', block: true },
];

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export function MarkdownEditor({ value, onChange, rows = 8, placeholder, plain = false, imageFolder = 'portfolio/blogs' }: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<'write' | 'preview'>('write');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const insertPositionRef = React.useRef<{ start: number; end: number } | null>(null);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    const pos = insertPositionRef.current ?? {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    };
    const nextValue = value.slice(0, pos.start) + text + value.slice(pos.end);
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = pos.start + text.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  const applyWrap = (option: WrapOption) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || option.placeholder || '';
    const after = option.after ?? '';

    // Block-level markers (headings/lists/code fences) should start on their own line.
    const needsLeadingNewline = option.block && start > 0 && value[start - 1] !== '\n';
    const prefix = needsLeadingNewline ? '\n' : '';

    const insertion = `${prefix}${option.before}${selected}${after}`;
    const nextValue = value.slice(0, start) + insertion + value.slice(end);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length + option.before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const handleImageButtonClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      insertPositionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
    }
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image is too large (max 3MB).');
      return;
    }

    setUploadingImage(true);
    try {
      const dataUri = await fileToDataUri(file);
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUri, folder: imageFolder }),
      });

      let result: any;
      try {
        result = await response.json();
      } catch {
        throw new Error(response.status === 413 ? 'Image is too large for the server to accept.' : 'Upload failed.');
      }
      if (!response.ok) throw new Error(result.error || 'Upload failed');

      insertAtCursor(`\n![${file.name.replace(/\.[^.]+$/, '')}](${result.url})\n`);
      toast.success('Image inserted');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className={plain ? '' : 'rounded-md border border-input bg-muted/10 overflow-hidden'}>
      <div className={`flex items-center justify-between border-b bg-muted/20 px-2 py-1.5 ${plain ? 'sticky top-0 z-10 backdrop-blur' : ''}`}>
        <div className="flex items-center gap-0.5">
          {toolbarItems.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={item.label}
              disabled={mode === 'preview'}
              onClick={() => applyWrap(item)}
            >
              <item.icon className="h-3.5 w-3.5" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Insert image"
            disabled={mode === 'preview' || uploadingImage}
            onClick={handleImageButtonClick}
          >
            {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelected(e.target.files?.[0])}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={mode === 'write' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode('write')}
          >
            <Pencil className="h-3 w-3" /> Write
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {mode === 'write' ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={
            plain
              ? 'border-0 rounded-none bg-transparent font-sans text-lg leading-relaxed focus-visible:ring-0 px-0 min-h-[60vh] shadow-none'
              : 'border-0 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0'
          }
        />
      ) : (
        <div className={plain ? 'py-4 min-h-[60vh]' : 'p-4 min-h-[10rem]'}>
          <MarkdownRenderer content={value} className="prose prose-sm dark:prose-invert max-w-none" />
        </div>
      )}
    </div>
  );
}
