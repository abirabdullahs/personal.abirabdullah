'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Posts', href: '/posts' },
  { name: 'Blog', href: '/blog' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="border-b border-border">
        <div className="container flex h-7 items-center justify-between px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>— Abir Abdullah / Engineering Journal</span>
          <span className="hidden sm:inline">Est. 2026</span>
        </div>
      </div>
      <div className="border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-heading font-semibold tracking-tight">Portfolio</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link href="/admin/login" className="hidden md:block">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <User className="h-5 w-5" />
              <span className="sr-only">Admin Login</span>
            </Button>
          </Link>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="md:hidden inline-flex h-10 w-10 items-center justify-center hover:bg-accent transition-colors">
              <Menu className="h-6 w-6 text-muted-foreground" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <div className="flex flex-col h-full bg-background">
                <div className="p-6 border-b flex items-center justify-between">
                  <span className="text-xl font-heading font-semibold tracking-tight">Menu</span>
                  <ThemeToggle />
                </div>
                <nav className="flex-1 px-6 py-8 flex flex-col gap-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-2xl font-heading font-semibold transition-all hover:translate-x-2",
                        pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="p-6 border-t bg-muted/50">
                  <Link 
                    href="/admin/login" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-muted-foreground group-hover:text-foreground">Admin Portal</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      </div>
    </header>
  );
}
