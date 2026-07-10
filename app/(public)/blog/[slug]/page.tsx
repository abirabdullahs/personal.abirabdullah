'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabase';

const fallbackBlogs = [
  {
    id: 1,
    title: "The Future of Web Development",
    slug: "future-of-web-dev",
    excerpt: "Exploring the latest trends and technologies shaping the web in 2024.",
    content: "The web is evolving faster than ever. From server components to AI-assisted coding, developers have more power and tools at their disposal than at any time in history. \n\nIn this blog post, we discuss how frameworks like Next.js are redefining server-side rendering, and how modern platforms allow deployment at scale in seconds.\n\n### Key Takeaways:\n1. Server Components reduce bundle size dramatically.\n2. AI tools enhance coding productivity without replacing foundational knowledge.\n3. Dynamic real-time databases make offline-first synchronization easier.",
    published_at: "2024-03-20",
    reading_time: 5,
    category: "Tech",
    status: "published",
  },
  {
    id: 2,
    title: "Mastering TypeScript Generics",
    slug: "mastering-typescript-generics",
    excerpt: "A deep dive into one of TypeScript's most powerful features.",
    content: "Generics allow you to write reusable, type-safe components. In this guide, we will explore advanced generic patterns including mapped types, conditional types, and more.\n\nUsing generics ensures that your functions and interfaces can handle various data structures while retaining robust type checking. Let's look at a quick example of a dynamic repository interface:\n\n```typescript\ninterface Repository<T> {\n  getById(id: string): Promise<T>;\n  list(): Promise<T[]>;\n}\n```\n\nBy leveraging this pattern, you can write modular code that scales seamlessly with your enterprise application.",
    published_at: "2024-03-15",
    reading_time: 8,
    category: "Development",
    status: "published",
  }
];

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
    // 1. Immediate local load
    let localFound = false;
    try {
      const stored = localStorage.getItem('portfolio_blogs');
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((b: any) => b.slug === slug);
        if (found) {
          setBlog(found);
          localFound = true;
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
    }

    if (!localFound) {
      // Try fallback default data
      const defaultFound = fallbackBlogs.find(b => b.slug === slug);
      if (defaultFound) {
        setBlog(defaultFound);
        setLoading(false);
      }
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

      <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-lg space-y-6">
        {blog.content ? (
          blog.content.split('\n\n').map((paragraph: string, idx: number) => {
            if (paragraph.startsWith('### ')) {
              return <h3 key={idx} className="text-2xl font-bold mt-8 mb-4 text-foreground">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
              return (
                <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
                  {paragraph.split('\n').map((line, lineIdx) => (
                    <li key={lineIdx} className="text-muted-foreground">
                      {line.replace(/^[0-9]+\.\s+|^-\s+/, '')}
                    </li>
                  ))}
                </ul>
              );
            }
            if (paragraph.startsWith('```')) {
              return (
                <pre key={idx} className="bg-muted p-4 rounded-lg overflow-x-auto font-mono text-sm border my-4">
                  <code>{paragraph.replace(/```[a-zA-Z]*\n|```/g, '')}</code>
                </pre>
              );
            }
            return <p key={idx} className="text-muted-foreground">{paragraph}</p>;
          })
        ) : (
          <p className="text-muted-foreground italic">No content provided.</p>
        )}
      </div>
    </article>
  );
}
