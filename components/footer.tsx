import Link from 'next/link';

const footerLinks = [
  { name: 'Projects', href: '/projects' },
  { name: 'Blog', href: '/blog' },
  { name: 'Posts', href: '/posts' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-heading text-lg">Abir Abdullah</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Full-stack developer — building and writing about web applications.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>© {year} Abir Abdullah. All rights reserved.</span>
          <span>— Engineering Journal</span>
        </div>
      </div>
    </footer>
  );
}
