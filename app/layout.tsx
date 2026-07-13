import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { getSupabase } from '@/lib/supabase';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abirabdullah.me';

const FALLBACK_TITLE = 'Abir Abdullah — Full-Stack Developer';
const FALLBACK_DESCRIPTION = 'Personal portfolio of Abir Abdullah — full-stack developer specializing in high-performance web applications. Projects, blog posts, and updates.';

export async function generateMetadata(): Promise<Metadata> {
  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESCRIPTION;

  try {
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      const client = getSupabase();
      const { data } = await client.from('admin_public_profile').select('name, headline, bio').limit(1).maybeSingle();

      if (data) {
        if (data.name && data.headline) {
          title = `${data.name} — ${data.headline}`;
        } else if (data.name) {
          title = data.name;
        }
        if (data.bio) {
          description = data.bio;
        }
      }
    }
  } catch (err) {
    console.warn('generateMetadata: falling back to default site metadata', err);
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${title.split(' — ')[0]}`,
    },
    description,
    openGraph: {
      type: 'website',
      siteName: title.split(' — ')[0],
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, fraunces.variable, "antialiased")} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
