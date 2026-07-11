import type { Metadata } from 'next';
import ContactPageClient from './contact-client';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get in touch with Abir Abdullah — email, WhatsApp, GitHub, and LinkedIn.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
