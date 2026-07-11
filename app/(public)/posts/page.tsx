import type { Metadata } from 'next';
import PostsPageClient from './posts-client';

export const metadata: Metadata = {
  title: 'Posts & Updates',
  description: "Short updates, thoughts, and progress notes from Abir Abdullah, including project updates.",
};

export default function PostsPage() {
  return <PostsPageClient />;
}
