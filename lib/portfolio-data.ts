import { getSupabase } from '@/lib/supabase';

export type PortfolioProject = {
  id: number | string;
  name: string;
  slug: string;
  short_description: string;
  tech_stack: string[];
  github_repo?: string;
  live_link?: string;
  image_url?: string;
  created_at?: string;
  featured?: boolean;
  status?: string;
};

// Mirrors the `admin` table columns in the DB schema. This is the public-facing
// profile shown on the Home/About pages (name, headline, avatar, bio, etc.) —
// distinct from PortfolioProfile below, which backs the local admin login form.
export type SiteAdminProfile = {
  id?: number | string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  headline?: string;
  about?: string;
  phone?: string;
  location?: string;
  resume_link?: string;
  cover_image?: string;
};

export type PortfolioBlog = {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category?: string;
  tags?: string[];
  reading_time?: number;
  status?: string;
  published_at?: string;
  featured_image?: string | null;
};

export type ContactMessage = {
  id: number | string;
  name: string;
  email: string;
  message: string;
  read?: boolean;
  created_at?: string;
};

export type PortfolioPost = {
  id: number | string;
  text: string;
  visibility?: string;
  pinned?: boolean;
  created_at?: string;
  project_id?: number | string | null;
};

export type PortfolioGalleryAlbum = {
  id: number | string;
  name: string;
  description?: string;
  cover_image?: string;
  created_at?: string;
};

export type PortfolioGalleryItem = {
  id: number | string;
  name: string;
  url: string;
  caption?: string;
  album_id?: number | string | null;
  display_order?: number;
  created_at?: string;
};

export type PortfolioProfile = {
  name: string;
  role: string;
  email: string;
  password: string;
};

export type ActivityLog = {
  id: number | string;
  action: string;
  time: string;
};

export const portfolioStorageKeys = {
  projects: 'portfolio_projects',
  blogs: 'portfolio_blogs',
  posts: 'portfolio_posts',
  gallery: 'portfolio_gallery',
  galleryAlbums: 'portfolio_gallery_albums',
  activities: 'portfolio_activities',
  profile: 'admin_profile',
  siteProfile: 'site_admin_profile',
  // Separate cache namespace for the admin dashboard's own optimistic UI.
  // IMPORTANT: the dashboard must never read/write the keys above — those
  // are read by public visitors as an instant-paint cache. The admin view
  // fetches *all* rows (drafts, private posts, unpublished blogs) with no
  // status/visibility filter, so if it shared the same cache keys, a public
  // visitor's first paint could briefly show draft/private content pulled
  // from that cache before the properly-filtered Supabase query overwrote
  // it a moment later — content "appearing then disappearing".
  adminProjects: 'admin_cache_projects',
  adminBlogs: 'admin_cache_blogs',
  adminPosts: 'admin_cache_posts',
  adminGallery: 'admin_cache_gallery',
  adminGalleryAlbums: 'admin_cache_gallery_albums',
  adminMessages: 'admin_cache_messages',
} as const;

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseClientOrNull() {
  if (typeof window === 'undefined' || !hasSupabaseConfig()) {
    return null;
  }

  try {
    return getSupabase();
  } catch {
    return null;
  }
}

export function readStoredCollection<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeStoredCollection<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createDefaultProfile(): PortfolioProfile {
  return {
    name: 'Abir Abdullah',
    role: 'Administrator',
    email: 'personal.abirabdullah@gmail.com',
    password: 'abir123456',
  };
}

export function createDefaultSiteProfile(): SiteAdminProfile {
  return {
    name: 'Abir Abdullah',
    headline: 'Full-Stack Developer',
    bio: "A Full-Stack Developer specializing in high-performance web applications. I bridge the gap between complex backend logic and sleek, intuitive user interfaces.",
    avatar: 'https://picsum.photos/seed/admin/400/400',
  };
}

export function createDefaultProject(overrides: Partial<PortfolioProject> = {}): PortfolioProject {
  return {
    id: Date.now(),
    name: '',
    slug: '',
    short_description: '',
    tech_stack: [],
    github_repo: '#',
    live_link: '#',
    image_url: '',
    ...overrides,
  };
}

export function createDefaultBlog(overrides: Partial<PortfolioBlog> = {}): PortfolioBlog {
  return {
    id: Date.now(),
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Tech',
    reading_time: 5,
    status: 'draft',
    published_at: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

export function createDefaultPost(overrides: Partial<PortfolioPost> = {}): PortfolioPost {
  return {
    id: Date.now(),
    text: '',
    visibility: 'public',
    pinned: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createDefaultGalleryItem(overrides: Partial<PortfolioGalleryItem> = {}): PortfolioGalleryItem {
  return {
    id: Date.now(),
    name: '',
    url: '',
    caption: '',
    album_id: null,
    ...overrides,
  };
}

export function createDefaultAlbum(overrides: Partial<PortfolioGalleryAlbum> = {}): PortfolioGalleryAlbum {
  return {
    id: Date.now(),
    name: '',
    description: '',
    ...overrides,
  };
}

export const initialActivityLogs: ActivityLog[] = [
  { id: 1, action: 'Portfolio dashboard initialized', time: 'Just now' },
];
