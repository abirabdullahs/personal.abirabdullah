'use client';

import * as React from 'react';
import { Github, Linkedin, Mail, Loader2, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { contactInfo } from '@/data/contact';
import { WhatsappIcon } from '@/components/whatsapp-icon';

const quickActions = [
  {
    label: 'Email',
    value: contactInfo.email,
    href: `mailto:${contactInfo.email}`,
    icon: Mail,
  },
  {
    label: 'WhatsApp',
    value: contactInfo.whatsapp.display,
    href: `https://wa.me/${contactInfo.whatsapp.number}`,
    icon: WhatsappIcon,
  },
  {
    label: 'GitHub',
    value: `@${contactInfo.github.username}`,
    href: contactInfo.github.url,
    icon: Github,
  },
  {
    label: 'LinkedIn',
    value: 'in/abirabdullah',
    href: contactInfo.linkedin.url,
    icon: Linkedin,
  },
];

function ContactPageClient() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [website, setWebsite] = React.useState(''); // honeypot — real users never see/fill this
  const [sending, setSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (website) {
      // Honeypot tripped — silently pretend success, don't actually send anything.
      toast.success("Message sent — I'll get back to you soon.");
      setName('');
      setEmail('');
      setMessage('');
      setWebsite('');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Failed to send message.');

      toast.success("Message sent — I'll get back to you soon.");
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container px-4 py-16">
      <div className="max-w-[42rem] mx-auto">
        <div className="mb-12 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— Get in touch</p>
          <h1 className="text-5xl mb-4">Contact</h1>
          <p className="text-lg text-muted-foreground">
            Have a project in mind, a question, or just want to say hi? Reach out directly below, or send a message.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={action.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="group flex flex-col items-center gap-2 border border-border p-4 text-center transition-colors hover:border-primary hover:bg-secondary/40"
            >
              <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="text-xs font-semibold">{action.label}</p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[9rem]">{action.value}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <div className="border-t border-border pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-6">— Or send a message</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot — hidden from real users via CSS, bots that auto-fill every field will trip it */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={sending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={sending} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                disabled={sending}
                placeholder="What's on your mind?"
              />
            </div>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPageClient;
