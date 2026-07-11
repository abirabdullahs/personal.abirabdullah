import type { Metadata } from 'next';
import GalleryPageClient from './gallery-client';

export const metadata: Metadata = {
  title: 'Gallery',
  description: "A collection of photos and moments from Abir Abdullah's journey.",
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
