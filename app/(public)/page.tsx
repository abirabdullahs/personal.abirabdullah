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
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-muted/50 border-b">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Avatar className="h-40 w-40 md:h-56 md:w-56 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar || 'https://picsum.photos/seed/admin/400/400'} alt={profile.name} />
                <AvatarFallback>
                  {profile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                AVAILABLE FOR HIRE
              </div>
            </motion.div>

            <motion.div
              className="flex-1 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Hi, I&apos;m{' '}
                <span className="text-muted-foreground underline decoration-primary/30 underline-offset-8">
                  {profile.name}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {profile.headline || profile.bio || 'A Full-Stack Developer specializing in high-performance web applications.'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link href="/projects">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    View My Work <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-border">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Projects</CardTitle>
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
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Blog</CardTitle>
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
          <Card>
            <CardHeader>
              <ImageIcon className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Gallery</CardTitle>
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
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Featured Projects</h2>
            <Link href="/projects">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription>{project.short_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(project.tech_stack) &&
                      project.tech_stack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="secondary">
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
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Latest Updates</h2>
            <Link href="/posts">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4 max-w-2xl">
            {latestPosts.map((post) => (
              <Card key={post.id} className="shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-muted-foreground">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                    </p>
                    {post.pinned && (
                      <Badge variant="default" className="gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="leading-relaxed line-clamp-3">{post.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Latest Blogs (DB-driven) */}
      {!loading && latestBlogs.length > 0 && (
        <section className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Latest Blog Posts</h2>
            <Link href="/blog">
              <Button variant="ghost" className="gap-1 text-sm">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{blog.title}</CardTitle>
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
        <h2 className="text-3xl font-bold tracking-tight mb-8">Top Skills</h2>
        <div className="flex flex-wrap gap-3">
          {skills.slice(0, 8).map((skill) => (
            <div key={skill.name} className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium border">
              {skill.name}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Experience (hardcoded, per architecture doc) */}
      <section className="container px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Experience</h2>
        <div className="space-y-6">
          {experiences.map((exp) => (
            <div key={exp.company_name} className="border-l-2 border-primary pl-6 py-2">
              <h3 className="text-xl font-bold">{exp.position}</h3>
              <p className="text-muted-foreground">
                {exp.company_name} • {exp.start_date} - {exp.end_date}
              </p>
              <p className="mt-2 max-w-2xl">{exp.description}</p>
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
