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

export type PortfolioBlog = {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category?: string;
  reading_time?: number;
  status?: string;
  published_at?: string;
  featured_image?: string;
};

export type PortfolioPost = {
  id: number | string;
  text: string;
  visibility?: string;
  pinned?: boolean;
  created_at?: string;
  project_id?: number | string | null;
};

export type PortfolioGalleryItem = {
  id: number | string;
  name: string;
  url: string;
  caption?: string;
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
  activities: 'portfolio_activities',
  profile: 'admin_profile',
  authSession: 'admin_auth_session',
} as const;

export type AdminAuthSession = {
  email: string;
  password: string;
  authenticated: boolean;
};

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

export function readAdminAuthSession(): AdminAuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return readStoredCollection<AdminAuthSession | null>(portfolioStorageKeys.authSession, null);
}

export function writeAdminAuthSession(session: AdminAuthSession | null) {
  writeStoredCollection(portfolioStorageKeys.authSession, session);
}

export function createDefaultProfile(): PortfolioProfile {
  return {
    name: 'Abir Abdullah',
    role: 'Administrator',
    email: 'personal.abirabdullah@gmail.com',
    password: 'abir123456',
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
    ...overrides,
  };
}

export const initialActivityLogs: ActivityLog[] = [
  { id: 1, action: 'Portfolio dashboard initialized', time: 'Just now' },
];
