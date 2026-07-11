'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Code, BookOpen, Image as ImageIcon, Loader2, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { skills } from '@/data/skills';
import { experiences } from '@/data/experiences';
import { getSupabase } from '@/lib/supabase';
import {
  portfolioStorageKeys,
  readStoredCollection,
  createDefaultSiteProfile,
  type PortfolioProject,
  type PortfolioPost,
  type PortfolioBlog,
  type SiteAdminProfile,
} from '@/lib/portfolio-data';

export default function HomePage() {
  const [profile, setProfile] = React.useState<SiteAdminProfile>(createDefaultSiteProfile());
  const [featuredProjects, setFeaturedProjects] = React.useState<PortfolioProject[]>([]);
  const [latestPosts, setLatestPosts] = React.useState<PortfolioPost[]>([]);
  const [latestBlogs, setLatestBlogs] = React.useState<PortfolioBlog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Instant paint from cached local data (or defaults) — no loading spinner on hero.
    const storedProfile = readStoredCollection<SiteAdminProfile | null>(portfolioStorageKeys.siteProfile, null);
    if (storedProfile) setProfile(storedProfile);

    const storedProjects = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.projects, []);
    const storedPosts = readStoredCollection<PortfolioPost[]>(portfolioStorageKeys.posts, []);
    const storedBlogs = readStoredCollection<PortfolioBlog[]>(portfolioStorageKeys.blogs, []);

    setFeaturedProjects(pickFeaturedProjects(storedProjects));
    setLatestPosts(pickLatestPublicPosts(storedPosts));
    setLatestBlogs(pickLatestPublishedBlogs(storedBlogs));
    setLoading(false);

    // 2. Background sync from Supabase — updates the UI once real data arrives.
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (!hasSupabase) return;

    async function syncSupabase() {
      try {
        const client = getSupabase();

        const [profileRes, projectsRes, postsRes, blogsRes] = await Promise.all([
          client.from('admin').select('*').limit(1).maybeSingle(),
          client.from('projects').select('*').order('created_at', { ascending: false }),
          client.from('posts').select('*').eq('visibility', 'public').order('created_at', { ascending: false }),
          client.from('blogs').select('*').eq('status', 'published').order('published_at', { ascending: false }),
        ]);

        if (profileRes.data) {
          const nextProfile = profileRes.data as SiteAdminProfile;
          setProfile(nextProfile);
          localStorage.setItem(portfolioStorageKeys.siteProfile, JSON.stringify(nextProfile));
        }

        if (projectsRes.data) {
          setFeaturedProjects(pickFeaturedProjects(projectsRes.data as PortfolioProject[]));
          localStorage.setItem(portfolioStorageKeys.projects, JSON.stringify(projectsRes.data));
        }

        if (postsRes.data) {
          setLatestPosts(pickLatestPublicPosts(postsRes.data as PortfolioPost[]));
          localStorage.setItem(portfolioStorageKeys.posts, JSON.stringify(postsRes.data));
        }

        if (blogsRes.data) {
          setLatestBlogs(pickLatestPublishedBlogs(blogsRes.data as PortfolioBlog[]));
          localStorage.setItem(portfolioStorageKeys.blogs, JSON.stringify(blogsRes.data));
        }
      } catch (err) {
        console.warn('Background Supabase home sync bypassed:', err);
      }
    }

    syncSupabase();
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section — editorial: image left, text right, hairline divider, serif display */}
      <section className="relative border-b border-border/70">
        <div className="container px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] gap-10 md:gap-16 items-center">
            {/* Portrait */}
            <motion.div
              className="flex md:justify-start justify-center"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-56 h-56 md:w-full md:h-auto md:aspect-square">
                <Avatar className="w-full h-full rounded-md border border-border shadow-sm">
                  <AvatarImage
                    src={profile.avatar || 'https://picsum.photos/seed/admin/600/600'}
                    alt={profile.name}
                    className="object-cover rounded-md"
                  />
                  <AvatarFallback className="rounded-md text-2xl">
                    {profile.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              className="space-y-6 text-center md:text-left md:border-l md:border-border/70 md:pl-16"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="h-1.5 w-1.5 bg-primary" />
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                  Available for hire
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-[1.05]">
                {profile.name}
              </h1>

              {profile.headline && (
                <p className="text-lg md:text-xl font-medium leading-relaxed">
                  {profile.headline}
                </p>
              )}

              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed font-light">
                {profile.bio ||
                  'Second-year CSE student at BUET, passionate about web development and exploring AI/ML. I enjoy building modern, user-focused applications while continuously learning and experimenting with new technologies.'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <Link href="/projects">
                  <Button size="lg" className="rounded-none px-6">
                    View My Work <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="rounded-none px-6 border-foreground/30">
                    Full Biography
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Stats/Summary */}
      <section className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border">
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader>
              <Code className="h-6 w-6 text-primary mb-2" strokeWidth={1.5} />
              <CardTitle className="font-serif text-2xl font-normal">Projects</CardTitle>
              <CardDescription>Check out my latest work</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects">
                <Button variant="link" className="px-0">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader>
              <BookOpen className="h-6 w-6 text-primary mb-2" strokeWidth={1.5} />
              <CardTitle className="font-serif text-2xl font-normal">Blog</CardTitle>
              <CardDescription>Thoughts on tech and development</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/blog">
                <Button variant="link" className="px-0">
                  Read More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader>
              <ImageIcon className="h-6 w-6 text-primary mb-2" strokeWidth={1.5} />
              <CardTitle className="font-serif text-2xl font-normal">Gallery</CardTitle>
              <CardDescription>Capturing moments and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/gallery">
                <Button variant="link" className="px-0">
                  View Gallery <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Projects (DB-driven) */}
      {!loading && featuredProjects.length > 0 && (
        <section className="container px-4">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-3xl tracking-tight">Featured Projects</h2>
            <Link href="/projects">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="rounded-none border-0 bg-background">
                <CardHeader>
                  <CardTitle className="font-serif text-xl font-normal">{project.name}</CardTitle>
                  <CardDescription>{project.short_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(project.tech_stack) &&
                      project.tech_stack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="secondary" className="rounded-none">
                          {tech}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts (DB-driven) */}
      {!loading && latestPosts.length > 0 && (
        <section className="container px-4">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-3xl tracking-tight">Latest Updates</h2>
            <Link href="/posts">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="max-w-2xl divide-y divide-border border-y border-border">
            {latestPosts.map((post) => (
              <div key={post.id} className="py-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                  </p>
                  {post.pinned && (
                    <Badge variant="default" className="gap-1 rounded-none">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  )}
                </div>
                <p className="leading-relaxed line-clamp-3">{post.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Blogs (DB-driven) */}
      {!loading && latestBlogs.length > 0 && (
        <section className="container px-4">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-3xl tracking-tight">Latest Blog Posts</h2>
            <Link href="/blog">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {latestBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <Card className="h-full rounded-none border-0 bg-background hover:bg-muted/40 transition-colors">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg font-normal">{blog.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{blog.excerpt}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading && (
        <section className="container px-4 flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </section>
      )}

      {/* Featured Skills (hardcoded, per architecture doc) */}
      <section className="container px-4">
        <h2 className="font-serif text-3xl tracking-tight mb-8 border-b border-border pb-4">Top Skills</h2>
        <div className="flex flex-wrap gap-3">
          {skills.slice(0, 8).map((skill) => (
            <div
              key={skill.name}
              className="px-4 py-2 rounded-none bg-secondary text-secondary-foreground font-medium border border-border text-sm"
            >
              {skill.name}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Experience (hardcoded, per architecture doc) */}
      <section className="container px-4">
        <h2 className="font-serif text-3xl tracking-tight mb-8 border-b border-border pb-4">Experience</h2>
        <div className="space-y-8">
          {experiences.map((exp, idx) => (
            <div key={exp.company_name} className="grid grid-cols-[auto_1fr] gap-6">
              <span className="font-serif text-2xl text-muted-foreground/50 leading-none pt-1">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="border-l border-border pl-6 py-1">
                <h3 className="text-xl font-semibold">{exp.position}</h3>
                <p className="text-muted-foreground text-sm uppercase tracking-wide mt-1">
                  {exp.company_name} • {exp.start_date} - {exp.end_date}
                </p>
                <p className="mt-3 max-w-2xl leading-relaxed">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function pickFeaturedProjects(projects: PortfolioProject[]): PortfolioProject[] {
  const featured = projects.filter((p) => p.featured);
  const pool = featured.length > 0 ? featured : projects;
  return pool.slice(0, 3);
}

function pickLatestPublicPosts(posts: PortfolioPost[]): PortfolioPost[] {
  return posts
    .filter((p) => (p.visibility || 'public') === 'public')
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    .slice(0, 3);
}

function pickLatestPublishedBlogs(blogs: PortfolioBlog[]): PortfolioBlog[] {
  return blogs
    .filter((b) => b.status === 'published')
    .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())
    .slice(0, 3);
}
