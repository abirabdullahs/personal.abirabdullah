'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabase';
import { checkSupabaseConfig } from '@/lib/supabase-status';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/markdown-renderer';

function BlogPostPageClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = React.use(params);
  const { slug } = resolvedParams;

  const [blog, setBlog] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Immediate local load (from real cached data only — no placeholder content)
    try {
      const stored = localStorage.getItem('portfolio_blogs');
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((b: any) => b.slug === slug);
        if (found) {
          setBlog(found);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
    }

    // 2. Async background Supabase check if credentials exist
    const hasSupabase = checkSupabaseConfig();
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();
          const { data, error } = await client
            .from('blogs')
            .select('*')
            .eq('slug', slug)
            .single();

          if (error) throw error;
          if (data) {
            setBlog(data);
            
            // Sync this single update back to local storage list
            const stored = localStorage.getItem('portfolio_blogs');
            if (stored) {
              const parsed = JSON.parse(stored);
              const index = parsed.findIndex((b: any) => b.slug === slug);
              if (index > -1) {
                parsed[index] = data;
              } else {
                parsed.push(data);
              }
              localStorage.setItem('portfolio_blogs', JSON.stringify(parsed));
            }
          }
        } catch (err: any) {
          console.error("Supabase single blog fetch failed:", err);
          toast.error('Could not load the latest version of this post — showing cached data if available.');
        }
        setLoading(false);
      }
      syncSupabase();
    } else {
      setLoading(false);
    }

    // Fire view counter API in the background (fails silently if DB not connected)
    fetch(`/api/blogs/${slug}/views`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="container min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl">Post Not Found</h1>
        <p className="text-muted-foreground">The blog post you are looking for does not exist or has been removed.</p>
        <Link href="/blog">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="container max-w-[42rem] px-4 py-12 md:py-16 space-y-10">
      <div className="space-y-6">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to blog
          </Button>
        </Link>

        <div className="border-y border-border py-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {blog.published_at}</span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {blog.reading_time} min read</span>
          {blog.category && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {blog.category}</span>
            </>
          )}
        </div>

        <h1 className="font-serif text-3xl md:text-5xl leading-tight">
          {blog.title}
        </h1>

        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      {blog.featured_image && (
        <div className="relative aspect-video overflow-hidden border border-border bg-muted">
          <Image
            src={blog.featured_image}
            alt={blog.title}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      )}

      <MarkdownRenderer
        content={blog.content}
        className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
      />
    </article>
  );
}

export default BlogPostPageClient;
