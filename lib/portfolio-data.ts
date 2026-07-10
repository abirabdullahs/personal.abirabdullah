import { getSupabase } from '@/lib/supabase';

export const portfolioStorageKeys = {
  projects: 'portfolio_projects',
  blogs: 'portfolio_blogs',
  posts: 'portfolio_posts',
  gallery: 'portfolio_gallery',
  activities: 'portfolio_activities',
  profile: 'admin_profile',
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

export function createDefaultProfile() {
  return {
    name: 'Abir Abdullah',
    role: 'Administrator',
    email: 'personal.abirabdullah@gmail.com',
    password: 'abir123456',
  };
}
