'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Code, BookOpen, Image as ImageIcon, Loader2, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { skills } from '@/data/skills';
import { experiences } from '@/data/experiences';
import { ventures } from '@/data/ventures';
import { EmptyState } from '@/components/empty-state';
import { GithubActivityFeed } from '@/components/github-activity-feed';
import { SectionReveal } from '@/components/section-reveal';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';
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

// Cinematic dark palette, scoped to this page only (the rest of the site
// keeps the light "Engineering Journal" theme) -- kept as named constants
// so every section below stays visually consistent.
const INK = '#0A0A0A';
const PAPER = '#F2F0EA';
const GOLD = '#D4A24C';
const GOLD_HOVER = '#C3923F';
const CARD = '#151515';

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
    <div className="flex flex-col gap-20 pb-20" style={{ backgroundColor: INK, color: PAPER }}>
      {/* Hero — full-bleed portrait backdrop, poster-style title */}
      <section className="relative isolate overflow-hidden min-h-[620px] md:min-h-[760px] flex items-end">
        <Image
          src={optimizeCloudinaryUrl(profile.avatar) || '/images/png.png'}
          alt={profile.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_20%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(0deg, ${INK} 10%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.1) 75%), linear-gradient(90deg, ${INK} 0%, rgba(10,10,10,0.3) 42%, transparent 72%)`,
          }}
        />
        <motion.div
          className="relative z-10 w-full px-6 md:px-10 lg:px-16 pb-14 md:pb-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                Available for hire
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight mb-5">
              {profile.name}
            </h1>

            {profile.headline && (
              <p className="text-lg md:text-xl font-medium mb-4" style={{ color: GOLD }}>
                {profile.headline}
              </p>
            )}

            <p className="text-base md:text-lg leading-relaxed max-w-xl mb-8" style={{ color: 'rgba(242,240,234,0.75)' }}>
              {profile.bio ||
                'CSE student, passionate about web development and exploring AI/ML. I enjoy building modern, user-focused applications while continuously learning and experimenting with new technologies.'}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/projects">
                <Button
                  size="lg"
                  className="rounded-none px-7 h-12 text-sm font-semibold border-none"
                  style={{ backgroundColor: GOLD, color: INK }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
                >
                  View My Work <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {profile.resume_link ? (
                <a href={profile.resume_link} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-none px-7 h-12 text-sm font-semibold bg-transparent hover:bg-white/5"
                    style={{ borderColor: 'rgba(242,240,234,0.3)', color: PAPER }}
                  >
                    Download Resume
                  </Button>
                </a>
              ) : (
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-none px-7 h-12 text-sm font-semibold bg-transparent hover:bg-white/5"
                    style={{ borderColor: 'rgba(242,240,234,0.3)', color: PAPER }}
                  >
                    Full Biography
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick nav — Projects / Blog / Gallery */}
      <section className="container px-4">
        <SectionReveal className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/projects', icon: Code, title: 'Projects', desc: 'Check out my latest work' },
            { href: '/blog', icon: BookOpen, title: 'Blog', desc: 'Thoughts on tech and development' },
            { href: '/gallery', icon: ImageIcon, title: 'Gallery', desc: 'Capturing moments and achievements' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block p-6 transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: CARD, border: '1px solid rgba(242,240,234,0.1)' }}
            >
              <item.icon
                className="h-6 w-6 mb-4 transition-transform duration-200 group-hover:scale-110"
                strokeWidth={1.5}
                style={{ color: GOLD }}
              />
              <h3 className="font-serif text-2xl mb-1">{item.title}</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(242,240,234,0.55)' }}>{item.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: GOLD }}>
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </SectionReveal>
      </section>

      {/* Featured Projects (DB-driven) */}
      {!loading && featuredProjects.length > 0 && (
        <section className="container px-4">
          <SectionReveal>
          <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: '1px solid rgba(242,240,234,0.12)' }}>
            <h2 className="font-serif text-3xl tracking-tight">Featured Projects</h2>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm hover:opacity-80" style={{ color: GOLD }}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: CARD, border: '1px solid rgba(242,240,234,0.1)' }}
              >
                {project.image_url ? (
                  <div className="relative h-56 w-full overflow-hidden" style={{ backgroundColor: INK }}>
                    <Image
                      src={optimizeCloudinaryUrl(project.image_url)}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-56" style={{ backgroundColor: INK }} />
                )}
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold mb-2">{project.name}</h3>
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: 'rgba(242,240,234,0.6)' }}>
                    {project.short_description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(project.tech_stack) &&
                      project.tech_stack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="text-[11px] px-2.5 py-1"
                          style={{ border: '1px solid rgba(242,240,234,0.2)', color: 'rgba(242,240,234,0.7)' }}
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </SectionReveal>
        </section>
      )}

      {/* Ventures — separate from technical Projects on purpose, so it reads
          as "founder/builder work" rather than a code project. */}
      {ventures.length > 0 && (
        <section className="container px-4">
          <SectionReveal>
          <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: '1px solid rgba(242,240,234,0.12)' }}>
            <h2 className="font-serif text-3xl tracking-tight">Also Building</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ventures.map((venture) => {
              const CardInner = (
                <div
                  className="h-full transition-all duration-300 hover:-translate-y-1 p-5"
                  style={{ backgroundColor: CARD, border: '1px solid rgba(242,240,234,0.1)' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {venture.logo_url ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden" style={{ border: '1px solid rgba(242,240,234,0.15)' }}>
                        <Image src={optimizeCloudinaryUrl(venture.logo_url)} alt={`${venture.name} logo`} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div
                        className="h-14 w-14 shrink-0 flex items-center justify-center font-serif text-2xl"
                        style={{ backgroundColor: GOLD, color: INK }}
                      >
                        {venture.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-xl font-semibold">{venture.name}</h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 shrink-0" style={{ border: '1px solid rgba(242,240,234,0.25)', color: 'rgba(242,240,234,0.6)' }}>
                          {venture.badge}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(242,240,234,0.55)' }}>{venture.tagline}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(242,240,234,0.6)' }}>{venture.description}</p>
                  {venture.link && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium mt-3" style={{ color: GOLD }}>
                      Visit site <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
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
          </SectionReveal>
        </section>
      )}

      {/* Latest Posts (DB-driven) */}
      {!loading && latestPosts.length > 0 && (
        <section className="container px-4">
          <SectionReveal>
          <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: '1px solid rgba(242,240,234,0.12)' }}>
            <h2 className="font-serif text-3xl tracking-tight">Latest Updates</h2>
            <Link href="/posts" className="inline-flex items-center gap-1 text-sm hover:opacity-80" style={{ color: GOLD }}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {latestPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: CARD, border: '1px solid rgba(242,240,234,0.1)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(242,240,234,0.5)' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                  </p>
                  {post.pinned && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5"
                      style={{ backgroundColor: GOLD, color: INK }}
                    >
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                </div>
                <p className="text-sm line-clamp-3" style={{ color: 'rgba(242,240,234,0.65)' }}>{post.text}</p>
              </div>
            ))}
          </div>
          </SectionReveal>
        </section>
      )}

      {/* Latest Blogs (DB-driven) */}
      {!loading && latestBlogs.length > 0 && (
        <section className="container px-4">
          <SectionReveal>
          <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: '1px solid rgba(242,240,234,0.12)' }}>
            <h2 className="font-serif text-3xl tracking-tight">Latest Blog Posts</h2>
            <Link href="/blog" className="inline-flex items-center gap-1 text-sm hover:opacity-80" style={{ color: GOLD }}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latestBlogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="block overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: CARD, border: '1px solid rgba(242,240,234,0.1)' }}
              >
                {blog.featured_image ? (
                  <div className="relative h-48 w-full overflow-hidden" style={{ backgroundColor: INK }}>
                    <Image
                      src={optimizeCloudinaryUrl(blog.featured_image)}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-48" style={{ backgroundColor: INK }} />
                )}
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold mb-2">{blog.title}</h3>
                  <p className="text-sm line-clamp-3" style={{ color: 'rgba(242,240,234,0.6)' }}>{blog.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          </SectionReveal>
        </section>
      )}

      {loading && (
        <section className="container px-4 flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'rgba(242,240,234,0.5)' }} />
        </section>
      )}

      <GithubActivityFeed />

      {/* Featured Skills (hardcoded, per architecture doc) */}
      <section className="container px-4">
        <SectionReveal>
        <h2 className="font-serif text-3xl tracking-tight mb-8 pb-4" style={{ borderBottom: '1px solid rgba(242,240,234,0.12)' }}>Top Skills</h2>
        {skills.length === 0 ? (
          <EmptyState title="No skills listed yet" message="Top skills will show up here once they're added." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {skills.slice(0, 8).map((skill) => (
              <div
                key={skill.name}
                className="px-4 py-2 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                style={{ border: '1px solid rgba(242,240,234,0.2)', color: PAPER }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = INK; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PAPER; }}
              >
                {skill.name}
              </div>
            ))}
          </div>
        )}
        </SectionReveal>
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
