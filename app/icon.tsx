import { ImageResponse } from 'next/og';
import { getSupabase } from '@/lib/supabase';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Editorial theme's primary accent (forest green) — matches globals.css
// --primary in light mode. Kept as a literal since CSS variables aren't
// available in this server-only image-generation context.
const ACCENT = '#3A5A45';

export default async function Icon() {
  let avatarUrl: string | null = null;
  let initial = 'A';

  try {
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      const client = getSupabase();
      const { data } = await client.from('admin_public_profile').select('name, avatar').limit(1).maybeSingle();
      if (data?.avatar) avatarUrl = data.avatar;
      if (data?.name) initial = data.name.trim().charAt(0).toUpperCase() || 'A';
    }
  } catch (err) {
    console.warn('Icon: falling back to letter mark', err);
  }

  if (avatarUrl) {
    return new ImageResponse(
      (
        <img
          src={avatarUrl}
          width={32}
          height={32}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
        />
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: ACCENT,
          color: '#FAFAF8',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'serif',
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
