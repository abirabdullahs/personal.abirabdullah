import type { Metadata } from 'next';
import AboutPageClient from './about-client';

export const metadata: Metadata = {
  title: 'About',
  description: "Learn about Abir Abdullah's background, experience, education, and skills as a full-stack developer.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
