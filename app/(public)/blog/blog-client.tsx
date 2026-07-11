'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getSupabase } from '@/lib/supabase';
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
          if (data && data.length > 0) {
            setBlogs(data as PortfolioBlog[]);
            localStorage.setItem(portfolioStorageKeys.blogs, JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Background Supabase blogs sync bypassed:', err);
        }
      }
      syncSupabase();
    }
  }, []);

  return (
    <div className="container px-4 py-16 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground">
          Thoughts, tutorials, and insights on software development and technology.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No published blog posts are available yet. Publish one from the admin dashboard to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`}>
              <Card className="h-full transition-all hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">{blog.category}</Badge>
                    <span className="text-sm text-muted-foreground">{blog.published_at}</span>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">{blog.title}</CardTitle>
                  <CardDescription className="text-base mt-2 line-clamp-2">
                    {blog.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium">{blog.reading_time} min read</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogPageClient;
