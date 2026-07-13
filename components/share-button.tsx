'use client';

import * as React from 'react';
import { Check, Copy, Facebook, Linkedin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { toast } from 'sonner';

type ShareButtonProps = {
  title: string;
  text?: string;
  className?: string;
};

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled the native share sheet — no-op.
      }
      return;
    }
    setPanelOpen((v) => !v);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socialLinks = [
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (props: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
        </svg>
      ),
    },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: Linkedin },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Facebook },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, icon: WhatsappIcon },
  ];

  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClick}>
        <Share2 className="h-3.5 w-3.5" /> Share
      </Button>

      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPanelOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 border border-border bg-popover shadow-lg p-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 px-2 py-2 text-sm text-left hover:bg-accent transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPanelOpen(false)}
                className="flex w-full items-center gap-2.5 px-2 py-2 text-sm hover:bg-accent transition-colors"
              >
                <social.icon className="h-4 w-4" />
                {social.name}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
