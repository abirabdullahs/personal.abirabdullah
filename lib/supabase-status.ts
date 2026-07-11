'use client';

import { toast } from 'sonner';

let warned = false;

/**
 * Returns true if Supabase client credentials are present in this bundle.
 * If they're missing, shows one clear toast (only once per session) instead
 * of every page silently falling back to cached/fallback data with zero
 * indication of why.
 *
 * IMPORTANT: NEXT_PUBLIC_* env vars are baked into the JS bundle at BUILD
 * TIME, not read at runtime. Adding/changing them in Vercel's dashboard
 * does nothing to already-built deployments — you must trigger a new
 * deployment (redeploy, ideally without build cache) after setting them.
 */
export function checkSupabaseConfig(): boolean {
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabase && !warned) {
    warned = true;
    console.error(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing from this build. ' +
      'These are baked in at BUILD TIME — if you added them in Vercel after the last deploy, you must ' +
      'trigger a fresh redeploy (Deployments -> ... -> Redeploy, without build cache) for them to take effect.'
    );
    toast.error('Site is not connected to the database (missing Supabase config). Showing fallback content.', {
      duration: 8000,
    });
  }

  return hasSupabase;
}
