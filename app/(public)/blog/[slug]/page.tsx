'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabase';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default function BlogPostPage({
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
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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
        } catch (err) {
          console.warn("Background Supabase single blog fetch bypassed:", err);
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
        <h1 className="text-3xl font-bold">Post Not Found</h1>
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
    <article className="container max-w-3xl px-4 py-16 space-y-8">
      <div className="space-y-4">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to blog
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5 font-medium">
            <Tag className="h-3 w-3" />
            {blog.category}
          </Badge>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {blog.reading_time} min read
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          {blog.title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-6">
          <Calendar className="h-4 w-4" />
          <span>Published on {blog.published_at}</span>
        </div>
      </div>

      <MarkdownRenderer
        content={blog.content}
        className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
      />
    </article>
  );
}
