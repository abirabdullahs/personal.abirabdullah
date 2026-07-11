import type { Metadata } from 'next';
import BlogPageClient from './blog-client';

export const metadata: Metadata = {
  title: 'Blog',
  description: "Articles and writing by Abir Abdullah on web development, software engineering, and technology.",
};

export default function BlogPage() {
  return <BlogPageClient />;
}
