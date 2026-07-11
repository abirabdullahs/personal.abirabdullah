import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Abir Abdullah — Full-Stack Developer',
    template: '%s | Abir Abdullah',
  },
  description: 'Personal portfolio of Abir Abdullah — full-stack developer specializing in high-performance web applications. Projects, blog posts, and updates.',
  openGraph: {
    type: 'website',
    siteName: 'Abir Abdullah',
    title: 'Abir Abdullah — Full-Stack Developer',
    description: 'Personal portfolio of Abir Abdullah — full-stack developer specializing in high-performance web applications.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abir Abdullah — Full-Stack Developer',
    description: 'Personal portfolio of Abir Abdullah — full-stack developer specializing in high-performance web applications.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
