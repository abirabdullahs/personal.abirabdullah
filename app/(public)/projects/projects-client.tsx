'use client';

import * as React from 'react';
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Loader2 } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';
import { portfolioStorageKeys, readStoredCollection, type PortfolioProject } from '@/lib/portfolio-data';

function ProjectsPageClient() {
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [loading, setLoading] = React.useState(true);

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
          if (data && data.length > 0) {
            setProjects(data as PortfolioProject[]);
            localStorage.setItem(portfolioStorageKeys.projects, JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Background Supabase projects sync bypassed:', err);
        }
      }
      syncSupabase();
    }
  }, []);

  return (
    <div className="container px-4 py-16 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">My Projects</h1>
        <p className="text-lg text-muted-foreground">
          A collection of projects I&apos;ve worked on, ranging from web applications to open-source tools.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No projects have been added yet. The admin dashboard will populate this section once content is created.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden group">
              <Link href={`/projects/${project.slug}`}>
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={project.image_url || '/placeholder.svg'}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </Link>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Link href={`/projects/${project.slug}`} className="hover:underline">
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                  </Link>
                  <div className="flex gap-2">
                    <a href={project.github_repo} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost">
                        <Github className="h-5 w-5" />
                      </Button>
                    </a>
                    <a href={project.live_link} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost">
                        <ExternalLink className="h-5 w-5" />
                      </Button>
                    </a>
                  </div>
                </div>
                <CardDescription className="text-base mt-2">
                  {project.short_description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(project.tech_stack) ? project.tech_stack.map((tech: string) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  )) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPageClient;
