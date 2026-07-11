'use client';

import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { portfolioStorageKeys, readStoredCollection, type PortfolioBlog } from '@/lib/portfolio-data';

function BlogPageClient() {
  const [blogs, setBlogs] = React.useState<PortfolioBlog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = readStoredCollection<PortfolioBlog[]>(portfolioStorageKeys.blogs, []);
    setBlogs(stored.filter((b) => b.status === 'published'));
    setLoading(false);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();
          const { data, error } = await client
            .from('blogs')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

          if (error) throw error;
          const rows = (data as PortfolioBlog[]) || [];
          setBlogs(rows);
          localStorage.setItem(portfolioStorageKeys.blogs, JSON.stringify(rows));
        } catch (err: any) {
          console.error('Supabase blogs sync failed:', err);
          toast.error('Could not load latest blog posts — showing cached data if available.');
        }
      }
      syncSupabase();
    }
  }, []);

  const total = blogs.length;

  return (
    <div className="container px-4 py-12 md:py-16">
      <div className="max-w-[42rem] mx-auto">
        <div className="mb-12 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— The Journal</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground">
            Notes, tutorials, and field reports from building software.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center text-muted-foreground">
            No published blog posts are available yet. Publish one from the admin dashboard to see it here.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {blogs.map((blog, idx) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="group block py-8 first:pt-0">
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  <span>No. {String(total - idx).padStart(2, '0')}</span>
                  <span aria-hidden>·</span>
                  <span>{blog.published_at}</span>
                  {blog.category && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{blog.category}</span>
                    </>
                  )}
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mb-2 transition-colors group-hover:text-primary">{blog.title}</h2>
                <p className="text-muted-foreground leading-relaxed line-clamp-2 mb-3">{blog.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {(blog.tags || []).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{blog.reading_time} min read</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogPageClient;
