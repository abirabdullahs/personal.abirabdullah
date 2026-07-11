'use client';

import * as React from 'react';
import { education } from "@/data/education";
import { skills } from "@/data/skills";
import { experiences } from "@/data/experiences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getSupabase } from '@/lib/supabase';
import { portfolioStorageKeys, readStoredCollection, createDefaultSiteProfile, type SiteAdminProfile } from '@/lib/portfolio-data';

const FALLBACK_ABOUT =
  "I am a developer who loves building things that live on the internet. My journey in web development started back in 2020, and since then I've worked on a variety of projects ranging from simple landing pages to complex web applications.";
const categories = [...new Set(skills.map(skill => skill.category))];

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr; // not a parseable date — show as-is
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateRange(start: string, end: string): string {
  const startLabel = formatMonthYear(start);
  const endLabel = /present/i.test(end) ? 'Present' : formatMonthYear(end);
  return `${startLabel} – ${endLabel}`;
}

function AboutPageClient() {
  const [profile, setProfile] = React.useState<SiteAdminProfile>(createDefaultSiteProfile());

  React.useEffect(() => {
    const stored = readStoredCollection<SiteAdminProfile | null>(portfolioStorageKeys.siteProfile, null);
    if (stored) setProfile(stored);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (!hasSupabase) return;

    async function syncSupabase() {
      try {
        const client = getSupabase();
        const { data, error } = await client.from('admin').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setProfile(data as SiteAdminProfile);
          localStorage.setItem(portfolioStorageKeys.siteProfile, JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Background Supabase about-profile sync bypassed:', err);
      }
    }
    syncSupabase();
  }, []);

  return (
    <div className="container px-4 py-16 space-y-24">
      {/* Intro */}
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight mb-6">About Me</h1>
        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {profile.about || profile.bio || FALLBACK_ABOUT}
        </p>
      </section>

      {/* Experience */}
      {/* <section>
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-primary">Experience</h2>
        <div className="space-y-8">
          {experiences.length === 0 ? (
            <EmptyState
              title="No experience listed yet"
              message="Work history will show up here once it's added."
            />
          ) : (
            experiences.map((exp) => (
            <Card key={exp.company_name}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-2xl">{exp.position}</CardTitle>
                    <CardDescription className="text-lg font-medium text-primary/80">{exp.company_name}</CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">{formatDateRange(exp.start_date, exp.end_date)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{exp.description}</p>
                <div className="flex gap-4 mt-4">
                  <Badge variant="secondary">{exp.work_mode}</Badge>
                  <Badge variant="secondary">{exp.employment_type}</Badge>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </section> */}

      {/* Education */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-primary">Education</h2>
        <div className="space-y-8">
          {education.length === 0 ? (
            <EmptyState
              title="No education listed yet"
              message="Academic background will show up here once it's added."
            />
          ) : (
            education.map((edu) => (
            <Card key={edu.institution}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-2xl">{edu.degree}</CardTitle>
                    <CardDescription className="text-lg font-medium text-primary/80">{edu.institution} • {edu.department}</CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">{edu.start_year} - {edu.end_year}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{edu.description}</p>
                {/* <p className="mt-4 font-bold text-primary">CGPA: {edu.cgpa}</p> */}
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </section>

      {/* Full Skills List */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-primary">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <Badge key={skill.name} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AboutPageClient;
