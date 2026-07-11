'use client';

import * as React from 'react';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, Loader2, FolderGit2 } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { portfolioStorageKeys, readStoredCollection, type PortfolioProject } from '@/lib/portfolio-data';

function ProjectDescription({ text }: { text?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div>
      <p
        ref={ref}
        className={`text-sm md:text-base text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
      >
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 font-mono text-[11px] uppercase tracking-wider text-primary hover:underline"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

function ProjectsPageClient() {
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.projects, []);
    if (stored.length > 0) {
      setProjects(stored);
    }
    setLoading(false);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      async function syncSupabase() {
        try {
          const client = getSupabase();
          const { data, error } = await client
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          setProjects((data as PortfolioProject[]) || []);
          localStorage.setItem(portfolioStorageKeys.projects, JSON.stringify(data || []));
          setSyncError(null);
        } catch (err: any) {
          console.error('Supabase projects sync failed:', err);
          setSyncError(err?.message || 'Could not load the latest projects from the database.');
          toast.error('Could not load latest projects — showing cached data if available.');
        }
      }
      syncSupabase();
    } else {
      setSyncError('Supabase is not configured (missing env vars) — showing cached data only.');
    }
  }, []);

  const total = projects.length;

  return (
    <div className="container px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-10 md:mb-14 border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— The Work</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">My Projects</h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          A collection of projects I&apos;ve worked on, ranging from web applications to open-source tools.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects yet"
          message="The admin dashboard will populate this section once a project is added."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
          {projects.map((project, idx) => (
            <article key={project.id} className="group">
              <Link href={`/projects/${project.slug}`} className="block">
                <div className="relative aspect-video overflow-hidden border border-border bg-muted">
                  <Image
                    src={project.image_url || '/placeholder.svg'}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </Link>

              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>No. {String(total - idx).padStart(2, '0')}</span>
                  {project.status && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{project.status}</span>
                    </>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <Link href={`/projects/${project.slug}`} className="group/title">
                    <h2 className="font-serif text-2xl leading-snug transition-colors group-hover/title:text-primary">
                      {project.name}
                    </h2>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0 -mr-2">
                    {project.github_repo && project.github_repo !== '#' && (
                      <a
                        href={project.github_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View source on GitHub"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.live_link && project.live_link !== '#' && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View live site"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <ProjectDescription text={project.short_description} />

                {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tech_stack.map((tech: string) => (
                      <Badge key={tech} variant="outline" className="font-mono text-[10px]">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPageClient;
