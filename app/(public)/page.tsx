'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Code, BookOpen, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { skills } from '@/data/skills';
import { experiences } from '@/data/experiences';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-muted/50 border-b">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Avatar className="h-40 w-40 md:h-56 md:w-56 border-4 border-background shadow-xl">
                <AvatarImage src="https://picsum.photos/seed/admin/400/400" alt="Admin Avatar" />
                <AvatarFallback>AA</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                AVAILABLE FOR HIRE
              </div>
            </motion.div>

            <motion.div
              className="flex-1 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Hi, I&apos;m <span className="text-muted-foreground underline decoration-primary/30 underline-offset-8">Abir Abdullah</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                A Full-Stack Developer specializing in high-performance web applications. I bridge the gap between complex backend logic and sleek, intuitive user interfaces.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link href="/projects">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    View My Work <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-border">
                    Full Biography
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Stats/Summary */}
      <section className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Projects</CardTitle>
              <CardDescription>Check out my latest work</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects">
                <Button variant="link" className="px-0">Explore <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Blog</CardTitle>
              <CardDescription>Thoughts on tech and development</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/blog">
                <Button variant="link" className="px-0">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ImageIcon className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Gallery</CardTitle>
              <CardDescription>Capturing moments and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/gallery">
                <Button variant="link" className="px-0">View Gallery <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="container px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Top Skills</h2>
        <div className="flex flex-wrap gap-3">
          {skills.slice(0, 8).map((skill) => (
            <div key={skill.name} className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium border">
              {skill.name}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Experience */}
      <section className="container px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Experience</h2>
        <div className="space-y-6">
          {experiences.map((exp) => (
            <div key={exp.company_name} className="border-l-2 border-primary pl-6 py-2">
              <h3 className="text-xl font-bold">{exp.position}</h3>
              <p className="text-muted-foreground">{exp.company_name} • {exp.start_date} - {exp.end_date}</p>
              <p className="mt-2 max-w-2xl">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
