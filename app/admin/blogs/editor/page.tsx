'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MarkdownEditor } from '@/components/admin/markdown-editor';
import { ImageUploader } from '@/components/admin/image-uploader';
import { getSupabase } from '@/lib/supabase';
import { portfolioStorageKeys, readStoredCollection, writeStoredCollection, type PortfolioBlog } from '@/lib/portfolio-data';
import { syncBlogTags, fetchBlogTagsInput, type BlogTag } from '@/lib/blog-editor-helpers';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get('id');
  const isEditing = !!blogId;

  const [loading, setLoading] = React.useState(isEditing);
  const [saving, setSaving] = React.useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [existingBlog, setExistingBlog] = React.useState<PortfolioBlog | null>(null);
  const [allTags, setAllTags] = React.useState<BlogTag[]>([]);

  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const [readingTime, setReadingTime] = React.useState(5);
  const [status, setStatus] = React.useState('draft');
  const [featuredImage, setFeaturedImage] = React.useState('');

  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Auto-derive slug from title until the user edits it manually.
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  React.useEffect(() => {
    async function load() {
      if (hasSupabase) {
        try {
          const client = getSupabase();
          const { data } = await client.from('tags').select('*');
          if (data) setAllTags(data as BlogTag[]);
        } catch (err) {
          console.warn('Could not load tags:', err);
        }
      }

      if (!blogId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list', table: 'blogs' }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load blog');

        const blog = (result.data as PortfolioBlog[]).find((b) => String(b.id) === String(blogId));
        if (!blog) {
          toast.error('Could not find this blog post.');
          router.push('/admin/dashboard');
          return;
        }

        setExistingBlog(blog);
        setTitle(blog.title);
        setSlug(blog.slug);
        setSlugTouched(true);
        setContent(blog.content || '');
        setExcerpt(blog.excerpt || '');
        setCategory(blog.category || '');
        setReadingTime(blog.reading_time || 5);
        setStatus(blog.status || 'draft');
        setFeaturedImage(blog.featured_image || '');

        if (hasSupabase) {
          const tagsStr = await fetchBlogTagsInput(blog.id);
          setTagsInput(tagsStr);
        }
      } catch (err: any) {
        console.error('Failed to load blog:', err);
        toast.error(err.message || 'Failed to load blog post.');
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const handlePublish = async (publishStatus: string) => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Please enter a title.');
      return;
    }
    if (!excerpt.trim() || !category.trim()) {
      toast.error('Please fill in the excerpt and category before publishing.');
      return;
    }

    setSaving(true);
    let targetId: number | string = existingBlog ? existingBlog.id : Date.now();

    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        category,
        reading_time: Number(readingTime),
        status: publishStatus,
        featured_image: featuredImage || null,
      };

      const response = await fetch('/api/admin/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: existingBlog ? 'update' : 'create',
          table: 'blogs',
          id: existingBlog ? existingBlog.id : undefined,
          payload,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Blog save failed');

      if (!existingBlog && result.data?.id !== undefined) {
        targetId = result.data.id;
      }

      const syncedTags = hasSupabase ? await syncBlogTags(targetId, tagsInput, allTags, setAllTags) : [];

      const blogObj: PortfolioBlog = {
        id: targetId,
        ...payload,
        tags: syncedTags,
        published_at: existingBlog?.published_at || new Date().toISOString().split('T')[0],
      };

      const cached = readStoredCollection<PortfolioBlog[]>(portfolioStorageKeys.adminBlogs, []);
      const updated = existingBlog
        ? cached.map((b) => (b.id === existingBlog.id ? blogObj : b))
        : [blogObj, ...cached];
      writeStoredCollection(portfolioStorageKeys.adminBlogs, updated);

      toast.success(publishStatus === 'published' ? 'Blog post published' : 'Draft saved');
      router.push('/admin/dashboard?tab=blogs');
    } catch (err: any) {
      console.error('Blog save failed:', err);
      toast.error(err.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.push('/admin/dashboard?tab=blogs')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            <Button size="sm" onClick={() => setPublishDialogOpen(true)} disabled={saving}>
              {existingBlog ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Writing surface */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          rows={1}
          className="border-0 bg-transparent font-heading text-4xl sm:text-5xl font-bold tracking-tight p-0 focus-visible:ring-0 resize-none placeholder:text-muted-foreground/40 mb-8 h-auto"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
        />

        <MarkdownEditor
          value={content}
          onChange={setContent}
          plain
          imageFolder="portfolio/blogs"
          placeholder="Tell your story... use the toolbar to add headings, code blocks, or images."
        />
      </div>

      {/* Publish settings dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Story details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Slug</label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                className="font-mono text-xs bg-muted/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Featured image</label>
              <ImageUploader value={featuredImage} onChange={setFeaturedImage} folder="portfolio/blogs" label="Featured image" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Excerpt</label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="A short summary shown on the blog list page"
                className="bg-muted/10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tech" className="bg-muted/10 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Reading time (min)</label>
                <Input type="number" value={readingTime} onChange={(e) => setReadingTime(Number(e.target.value))} className="bg-muted/10 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Tags (comma separated)</label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="react, webdev, tutorial" className="bg-muted/10 text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handlePublish('draft')} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />} Save as draft
            </Button>
            <Button onClick={() => handlePublish('published')} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />} Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <BlogEditorContent />
    </React.Suspense>
  );
}
