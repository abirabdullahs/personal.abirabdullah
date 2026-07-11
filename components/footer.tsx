import Link from 'next/link';
import { Github, Linkedin, Mail } from 'lucide-react';
import { contactInfo } from '@/data/contact';
import { WhatsappIcon } from '@/components/whatsapp-icon';

const footerLinks = [
  { name: 'Projects', href: '/projects' },
  { name: 'Blog', href: '/blog' },
  { name: 'Posts', href: '/posts' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

const socialLinks = [
  { name: 'Email', href: `mailto:${contactInfo.email}`, icon: Mail },
  { name: 'WhatsApp', href: `https://wa.me/${contactInfo.whatsapp.number}`, icon: WhatsappIcon },
  { name: 'GitHub', href: contactInfo.github.url, icon: Github },
  { name: 'LinkedIn', href: contactInfo.linkedin.url, icon: Linkedin },
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

        <div className="flex gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target={social.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              aria-label={social.name}
              title={social.name}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>© {year} Abir Abdullah. All rights reserved.</span>
          <span>— Engineering Journal</span>
        </div>
      </div>
    </footer>
  );
}
