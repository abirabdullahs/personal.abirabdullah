'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Code, BookOpen, Image as ImageIcon, Loader2, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { skills } from '@/data/skills';
import { experiences } from '@/data/experiences';
import { ventures } from '@/data/ventures';
import { EmptyState } from '@/components/empty-state';
import { GithubActivityFeed } from '@/components/github-activity-feed';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { checkSupabaseConfig } from '@/lib/supabase-status';
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
    const hasSupabase = checkSupabaseConfig();
    if (!hasSupabase) return;

    async function syncSupabase() {
      try {
        const client = getSupabase();

        const [profileRes, projectsRes, postsRes, blogsRes] = await Promise.all([
          client.from('admin_public_profile').select('*').limit(1).maybeSingle(),
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
      } catch (err: any) {
        console.error('Supabase home sync failed:', err);
        toast.error('Could not load the latest content from the database — showing cached data if available.');
      }
    }

    syncSupabase();
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section — editorial: image left, text right, hairline divider, serif display */}
      <section className="relative border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-10 xl:gap-24 items-center">
            {/* Portrait */}
            <motion.div
              className="flex md:justify-start justify-center"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-64 sm:w-80 lg:w-full lg:max-w-md h-auto rounded-xl shadow-[0_30px_70px_-25px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl bg-secondary flex items-center justify-center shadow-[0_30px_70px_-25px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]">
                  <span className="font-serif text-4xl text-secondary-foreground">
                    {profile.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Copy */}
            <motion.div
              className="space-y-6 text-center md:text-left md:border-l md:border-border/70 md:pl-16 lg:pl-12"
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
                  'CSE student, passionate about web development and exploring AI/ML. I enjoy building modern, user-focused applications while continuously learning and experimenting with new technologies.'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden border-border bg-background shadow-sm">
                {project.image_url ? (
                  <div className="relative h-56 w-full overflow-hidden bg-muted">
                    <Image
                      src={project.image_url}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-56 bg-muted" />
                )}
                <CardHeader className="pt-5">
                  <CardTitle className="font-serif text-xl font-semibold">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.short_description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
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

      {/* Ventures — separate from technical Projects on purpose, so it reads
          as "founder/builder work" rather than a code project. */}
      {ventures.length > 0 && (
        <section className="container px-4">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <h2 className="font-serif text-3xl tracking-tight">Also Building</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ventures.map((venture) => {
              const CardInner = (
                <Card className="h-full rounded-none border-border hover:border-foreground/40 transition-colors">
                  <CardHeader className="flex-row items-center gap-4 space-y-0">
                    {venture.logo_url ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border">
                        <Image src={venture.logo_url} alt={`${venture.name} logo`} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-foreground text-background font-serif text-2xl">
                        {venture.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="font-serif text-xl font-semibold">{venture.name}</CardTitle>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">{venture.badge}</Badge>
                      </div>
                      <CardDescription className="text-sm">{venture.tagline}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{venture.description}</p>
                    {venture.link && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium mt-3 text-primary">
                        Visit site <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </CardContent>
                </Card>
              );

              return venture.link ? (
                <Link key={venture.name} href={venture.link} target="_blank" rel="noopener noreferrer">
                  {CardInner}
                </Link>
              ) : (
                <div key={venture.name}>{CardInner}</div>
              );
            })}
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
          <div className="grid grid-cols-1 gap-6">
            {latestPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-border bg-background shadow-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                    </p>
                    {post.pinned && (
                      <Badge variant="default" className="gap-1 rounded-none">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3 text-sm text-muted-foreground">{post.text}</CardDescription>
                </CardHeader>
              </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latestBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="block">
                <Card className="overflow-hidden border-border bg-background shadow-sm hover:shadow-md transition-shadow">
                  {blog.featured_image ? (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={blog.featured_image}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted" />
                  )}
                  <CardHeader>
                    <CardTitle className="font-serif text-xl font-semibold">{blog.title}</CardTitle>
                    <CardDescription className="line-clamp-3 text-sm text-muted-foreground">{blog.excerpt}</CardDescription>
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

      <GithubActivityFeed />

      {/* Featured Skills (hardcoded, per architecture doc) */}
      <section className="container px-4">
        <h2 className="font-serif text-3xl tracking-tight mb-8 border-b border-border pb-4">Top Skills</h2>
        {skills.length === 0 ? (
          <EmptyState title="No skills listed yet" message="Top skills will show up here once they're added." />
        ) : (
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
        )}
      </section>

      {/* Recent Experience (hardcoded, per architecture doc) */}
      {/* <section className="container px-4">
        <h2 className="font-serif text-3xl tracking-tight mb-8 border-b border-border pb-4">Experience</h2>
        {experiences.length === 0 ? (
          <EmptyState title="No experience listed yet" message="Work history will show up here once it's added." />
        ) : (
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
        )}
      </section> */}
    </div>
  );
}

function pickFeaturedProjects(projects: PortfolioProject[]): PortfolioProject[] {
  // NOTE: there's no admin UI yet to toggle a project's `featured` flag, so
  // relying on it here was unreliable (e.g. exactly one row ending up
  // featured=true, via a DB default or manual edit, would hide the rest).
  // Until that control exists, always show the most recent projects —
  // the query is already ordered by created_at descending.
  return projects.slice(0, 3);
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
