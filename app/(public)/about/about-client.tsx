'use client';

import * as React from 'react';
import { education } from "@/data/education";
import { skills } from "@/data/skills";
import { experiences } from "@/data/experiences";
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
        const { data, error } = await client.from('admin_public_profile').select('*').limit(1).maybeSingle();
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
    <div className="container px-4 py-12 md:py-16 space-y-16 md:space-y-20">
      {/* Intro */}
      <section className="max-w-3xl border-b border-border pb-10 md:pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">— The Long Version</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">About Me</h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {profile.about || profile.bio || FALLBACK_ABOUT}
        </p>
      </section>

      {/* Experience */}
      {/* <section>
        <h2 className="font-serif text-3xl tracking-tight mb-8">Experience</h2>
        <div className="divide-y divide-border">
          {experiences.length === 0 ? (
            <EmptyState
              title="No experience listed yet"
              message="Work history will show up here once it's added."
            />
          ) : (
            experiences.map((exp) => (
            <div key={exp.company_name} className="py-8 first:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-serif text-2xl">{exp.position}</h3>
                  <p className="text-base font-medium text-primary mt-0.5">{exp.company_name}</p>
                </div>
                <Badge variant="outline" className="w-fit rounded-none font-mono text-[11px]">{formatDateRange(exp.start_date, exp.end_date)}</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{exp.description}</p>
              <div className="flex gap-2 mt-4">
                <Badge variant="secondary" className="rounded-none">{exp.work_mode}</Badge>
                <Badge variant="secondary" className="rounded-none">{exp.employment_type}</Badge>
              </div>
            </div>
            ))
          )}
        </div>
      </section> */}

      {/* Education */}
      <section>
        <h2 className="font-serif text-3xl tracking-tight mb-8">Education</h2>
        <div className="divide-y divide-border">
          {education.length === 0 ? (
            <EmptyState
              title="No education listed yet"
              message="Academic background will show up here once it's added."
            />
          ) : (
            education.map((edu) => (
            <div key={edu.institution} className="py-8 first:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-serif text-2xl">{edu.degree}</h3>
                  <p className="text-base font-medium text-primary mt-0.5">{edu.institution} • {edu.department}</p>
                </div>
                <Badge variant="outline" className="w-fit rounded-none font-mono text-[11px]">{edu.start_year} - {edu.end_year}</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{edu.description}</p>
              {/* <p className="mt-4 font-bold text-primary">CGPA: {edu.cgpa}</p> */}
            </div>
            ))
          )}
        </div>
      </section>

      {/* Full Skills List */}
      <section>
        <h2 className="font-serif text-3xl tracking-tight mb-8">Skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 border-t border-border pt-8">
          {categories.map((category) => (
            <div key={category}>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">{category}</p>
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <Badge key={skill.name} variant="secondary" className="rounded-none">
                      {skill.name}
                    </Badge>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AboutPageClient;
