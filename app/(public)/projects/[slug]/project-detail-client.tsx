'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Github, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { checkSupabaseConfig } from '@/lib/supabase-status';
import { toast } from 'sonner';
import { portfolioStorageKeys, readStoredCollection, type PortfolioPost, type PortfolioProject } from '@/lib/portfolio-data';
import { technologies } from '@/data/technologies';

type ProjectImage = {
  id: number | string;
  image_url: string;
  alt_text?: string;
  display_order?: number;
};

function ProjectDetailPageClient() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [project, setProject] = React.useState<PortfolioProject | null>(null);
  const [images, setImages] = React.useState<ProjectImage[]>([]);
  const [updates, setUpdates] = React.useState<PortfolioPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;

    // Fast path: render from the locally cached project list while the
    // network request resolves, so the page doesn't flash empty.
    const cachedProjects = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.projects, []);
    const cachedMatch = cachedProjects.find((p) => p.slug === slug);
    if (cachedMatch) {
      setProject(cachedMatch);
      setLoading(false);
    }

    const hasSupabase = checkSupabaseConfig();
    if (!hasSupabase) {
      if (!cachedMatch) setNotFound(true);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const client = getSupabase();

        const { data: projectData, error: projectError } = await client
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (projectError) throw projectError;

        if (!projectData) {
          if (!cachedMatch) setNotFound(true);
          setLoading(false);
          return;
        }

        setProject(projectData as PortfolioProject);
        setNotFound(false);

        const [{ data: imagesData }, { data: postsData }] = await Promise.all([
          client
            .from('project_images')
            .select('*')
            .eq('project_id', projectData.id)
            .order('display_order', { ascending: true }),
          client
            .from('posts')
            .select('*')
            .eq('project_id', projectData.id)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false }),
        ]);

        if (imagesData) setImages(imagesData as ProjectImage[]);
        if (postsData) setUpdates(postsData as PortfolioPost[]);
      } catch (err: any) {
        console.error('Failed to load project detail:', err);
        toast.error('Could not load this project from the database.');
        if (!cachedMatch) setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-2xl">Project not found</h1>
        <p className="text-muted-foreground">This project may have been removed or the link is incorrect.</p>
        <Link href="/projects">
          <Button variant="outline" className="gap-1.5 rounded-none">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const gallery: ProjectImage[] = images.length > 0
    ? images
    : project.image_url
      ? [{ id: 'cover', image_url: project.image_url, alt_text: project.name }]
      : [];

  return (
    <div className="container px-4 py-12 md:py-16 space-y-12 max-w-4xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            {project.status && (
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                — {project.status}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight">{project.name}</h1>
          </div>
        </div>

        {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
            {project.tech_stack.map((tech) => {
              const iconSlug = (technologies as Record<string, string>)[tech];
              return (
                <Badge key={tech} variant="secondary" className="gap-1.5 py-1.5 rounded-none">
                  {iconSlug && (
                    // Lightweight icon via simple-icons CDN — no extra dependency needed.
                    <img
                      src={`https://cdn.simpleicons.org/${iconSlug}`}
                      alt=""
                      className="h-3.5 w-3.5 dark:invert-0 opacity-80"
                      loading="lazy"
                    />
                  )}
                  {tech}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {gallery.length > 0 && (
        <div className={`grid gap-3 md:gap-4 ${gallery.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {gallery.map((img) => (
            <div key={img.id} className="relative aspect-video overflow-hidden border border-border bg-muted">
              <Image
                src={img.image_url}
                alt={img.alt_text || project.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      )}

      {((project.github_repo && project.github_repo !== '#') || (project.live_link && project.live_link !== '#')) && (
        <div className="flex gap-2">
          {project.github_repo && project.github_repo !== '#' && (
            <a href={project.github_repo} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-1.5 rounded-none border-foreground/30">
                <Github className="h-4 w-4" /> Source
              </Button>
            </a>
          )}
          {project.live_link && project.live_link !== '#' && (
            <a href={project.live_link} target="_blank" rel="noopener noreferrer">
              <Button className="gap-1.5 rounded-none">
                <ExternalLink className="h-4 w-4" /> Live Site
              </Button>
            </a>
          )}
        </div>
      )}

      <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{project.short_description}</p>

      {updates.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight border-b border-border pb-4">Project Updates</h2>
          <div className="divide-y divide-border">
            {updates.map((post) => (
              <div key={post.id} className="py-6 first:pt-0">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {post.created_at
                    ? new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : ''}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{post.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPageClient;