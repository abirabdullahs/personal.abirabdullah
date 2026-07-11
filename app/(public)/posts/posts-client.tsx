'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pin } from "lucide-react";
import { getSupabase } from '@/lib/supabase';
import { portfolioStorageKeys, readStoredCollection, type PortfolioPost, type PortfolioProject } from '@/lib/portfolio-data';

function PostsPageClient() {
  const [posts, setPosts] = React.useState<PortfolioPost[]>([]);
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const storedPosts = readStoredCollection<PortfolioPost[]>(portfolioStorageKeys.posts, []);
    const storedProjects = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.projects, []);
    if (storedPosts.length > 0) setPosts(storedPosts);
    if (storedProjects.length > 0) setProjects(storedProjects);
    setLoading(false);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();

          const [{ data: postsData, error: postsError }, { data: projectsData, error: projectsError }] = await Promise.all([
            client.from('posts').select('*').eq('visibility', 'public').order('created_at', { ascending: false }),
            client.from('projects').select('id, name, slug'),
          ]);

          if (postsError) throw postsError;
          if (projectsError) throw projectsError;

          if (postsData) {
            setPosts(postsData as PortfolioPost[]);
            localStorage.setItem(portfolioStorageKeys.posts, JSON.stringify(postsData));
          }
          if (projectsData) {
            setProjects((prev) => (projectsData.length > 0 ? (projectsData as PortfolioProject[]) : prev));
          }
        } catch (err) {
          console.warn('Background Supabase posts sync bypassed:', err);
        }
      }
      syncSupabase();
    }
  }, []);

  const visiblePosts = posts.filter((p) => (p.visibility || 'public') === 'public');
  const sortedPosts = [...visiblePosts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const findProject = (projectId: PortfolioPost['project_id']) => {
    if (!projectId) return null;
    return projects.find((p) => String(p.id) === String(projectId)) || null;
  };

  return (
    <div className="container px-4 py-16 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Posts &amp; Updates</h1>
        <p className="text-lg text-muted-foreground">
          Short updates, thoughts, and progress notes — including behind-the-scenes updates on my projects.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No posts yet. Check back soon.
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {sortedPosts.map((post) => {
            const linkedProject = findProject(post.project_id);
            return (
              <Card key={post.id} className="shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className="text-sm text-muted-foreground">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </p>
                    {post.pinned && (
                      <Badge variant="default" className="gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    {linkedProject && (
                      <Link href={`/projects/${linkedProject.slug}`}>
                        <Badge variant="outline" className="hover:bg-accent transition-colors">
                          part of {linkedProject.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{post.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PostsPageClient;
