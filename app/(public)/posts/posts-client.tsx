'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Loader2, Pin, MessageSquareText } from "lucide-react";
import { getSupabase } from '@/lib/supabase';
import { checkSupabaseConfig } from '@/lib/supabase-status';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
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

    const hasSupabase = checkSupabaseConfig();
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
        } catch (err: any) {
          console.error('Supabase posts sync failed:', err);
          toast.error('Could not load the latest posts — showing cached data if available.');
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
    <div className="container px-4 py-12 md:py-16">
      <div className="max-w-[42rem] mx-auto">
        <div className="mb-10 md:mb-12 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— The Log</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Posts &amp; Updates</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Short updates, thoughts, and progress notes — including behind-the-scenes updates on my projects.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="No posts yet" message="Check back soon for updates." />
        ) : (
          <div className="divide-y divide-border">
            {sortedPosts.map((post) => {
              const linkedProject = findProject(post.project_id);
              return (
                <div key={post.id} className="py-6 first:pt-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <span>
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                        : ''}
                    </span>
                    {post.pinned && (
                      <Badge variant="default" className="gap-1 rounded-none font-sans normal-case">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    {linkedProject && (
                      <Link href={`/projects/${linkedProject.slug}`}>
                        <Badge variant="outline" className="rounded-none font-sans normal-case hover:bg-accent transition-colors">
                          part of {linkedProject.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-base">{post.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostsPageClient;
