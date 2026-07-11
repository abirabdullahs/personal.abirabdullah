import type { Metadata } from 'next';
import ProjectsPageClient from './projects-client';

export const metadata: Metadata = {
  title: 'Projects',
  description: "Explore Abir Abdullah's portfolio of full-stack web development projects.",
};

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
