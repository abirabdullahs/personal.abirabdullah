'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Eye,
  Pencil,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-7 w-7"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function MarkdownEditor({ value, onChange, rows = 8, placeholder, plain = false, imageFolder = 'portfolio/blogs' }: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<'write' | 'preview'>('write');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const lastEmittedMarkdown = React.useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Markdown.configure({ html: true, tightLists: true, linkify: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'prose dark:prose-invert max-w-none focus:outline-none',
          plain ? 'min-h-[60vh] text-lg leading-relaxed py-4' : 'min-h-[10rem] text-sm p-4'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      lastEmittedMarkdown.current = markdown;
      onChange(markdown);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (value !== lastEmittedMarkdown.current) {
      editor.commands.setContent(value);
      lastEmittedMarkdown.current = value;
    }
  }, [value, editor]);

  const insertImage = async (file: File | undefined) => {
    if (!file || !editor) return;
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

      editor.chain().focus().setImage({ src: result.url, alt: file.name.replace(/\.[^.]+$/, '') }).run();
      toast.success('Image inserted');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className={plain ? '' : 'rounded-md border border-input bg-muted/10'}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-1 border-b bg-muted/20 px-2 py-1.5',
          'sticky top-0 z-10 backdrop-blur',
          !plain && 'rounded-t-md'
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <span className="w-px h-4 bg-border mx-1" />

          <ToolbarButton title="Bold" active={editor.isActive('bold')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive('underline')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Inline code" active={editor.isActive('code')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          <span className="w-px h-4 bg-border mx-1" />

          <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Quote" active={editor.isActive('blockquote')} disabled={mode === 'preview'} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>

          <span className="w-px h-4 bg-border mx-1" />

          <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} disabled={mode === 'preview'} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>

          <span className="w-px h-4 bg-border mx-1" />

          <ToolbarButton title="Link" active={editor.isActive('link')} disabled={mode === 'preview'} onClick={setLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Insert image" disabled={mode === 'preview' || uploadingImage} onClick={() => imageInputRef.current?.click()}>
            {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          </ToolbarButton>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => insertImage(e.target.files?.[0])}
          />

          <span className="w-px h-4 bg-border mx-1" />

          <ToolbarButton title="Undo" disabled={mode === 'preview'} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={mode === 'preview'} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1">
          <Button type="button" variant={mode === 'write' ? 'secondary' : 'ghost'} size="sm" className="h-7 gap-1 text-xs" onClick={() => setMode('write')}>
            <Pencil className="h-3 w-3" /> Write
          </Button>
          <Button type="button" variant={mode === 'preview' ? 'secondary' : 'ghost'} size="sm" className="h-7 gap-1 text-xs" onClick={() => setMode('preview')}>
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {mode === 'write' ? (
        <div className="relative">
          <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-md border border-border bg-popover shadow-md p-1">
            <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
              <LinkIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
          </BubbleMenu>

          <EditorContent editor={editor} className={plain ? 'px-0' : ''} />
        </div>
      ) : (
        <div className={plain ? 'py-4 min-h-[60vh]' : 'p-4 min-h-[10rem]'}>
          <MarkdownRenderer content={value} className="prose prose-sm dark:prose-invert max-w-none" />
        </div>
      )}
    </div>
  );
}
