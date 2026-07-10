'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Loader2 } from "lucide-react";
import Image from "next/image";
import { getSupabase } from '@/lib/supabase';

// Local fallback data
const fallbackProjects = [
  {
    id: 1,
    name: "Portfolio Website",
    slug: "portfolio-website",
    short_description: "A full-stack personal portfolio with admin dashboard and blog.",
    tech_stack: ["Next.js", "Supabase", "Tailwind CSS", "Cloudinary"],
    github_repo: "#",
    live_link: "#",
    image_url: "https://picsum.photos/seed/portfolio/800/600",
  },
  {
    id: 2,
    name: "E-commerce Platform",
    slug: "ecommerce-platform",
    short_description: "A modern e-commerce platform with real-time inventory management.",
    tech_stack: ["React", "Node.js", "PostgreSQL", "Stripe"],
    github_repo: "#",
    live_link: "#",
    image_url: "https://picsum.photos/seed/shop/800/600",
  }
];

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<any[]>(fallbackProjects);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Immediate local load
    try {
      const stored = localStorage.getItem('portfolio_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
        }
      } else {
        localStorage.setItem('portfolio_projects', JSON.stringify(fallbackProjects));
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
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data && data.length > 0) {
            setProjects(data);
            localStorage.setItem('portfolio_projects', JSON.stringify(data));
          }
        } catch (err) {
          console.warn("Background Supabase projects sync bypassed:", err);
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden group">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={project.image_url}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{project.name}</CardTitle>
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
