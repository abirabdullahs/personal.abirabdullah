'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getSupabase } from '@/lib/supabase';

// Local fallback data
const fallbackBlogs = [
  {
    id: 1,
    title: "The Future of Web Development",
    slug: "future-of-web-dev",
    excerpt: "Exploring the latest trends and technologies shaping the web in 2024.",
    published_at: "2024-03-20",
    reading_time: 5,
    category: "Tech",
  },
  {
    id: 2,
    title: "Mastering TypeScript Generics",
    slug: "mastering-typescript-generics",
    excerpt: "A deep dive into one of TypeScript's most powerful features.",
    published_at: "2024-03-15",
    reading_time: 8,
    category: "Development",
  }
];

export default function BlogPage() {
  const [blogs, setBlogs] = React.useState<any[]>(fallbackBlogs);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Immediate local load
    try {
      const stored = localStorage.getItem('portfolio_blogs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlogs(parsed.filter((b: any) => b.status === 'published'));
        }
      } else {
        localStorage.setItem('portfolio_blogs', JSON.stringify(fallbackBlogs));
      }
    } catch (e) {
      console.error("Failed to read from localStorage", e);
    }
    setLoading(false);

    // 2. Async background Supabase sync if credentials exist
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
            setBlogs(data);
            localStorage.setItem('portfolio_blogs', JSON.stringify(data));
          }
        } catch (err) {
          console.warn("Background Supabase blogs sync bypassed:", err);
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
