'use client';

import * as React from 'react';
import { motion } from 'motion/react';

type SectionRevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

// Gentle fade + rise animation that plays once as a section scrolls into
// view. Kept subtle (short distance, quick duration) so it reads as polish
// rather than a distracting effect. Content is already in the DOM either
// way (SEO/crawlers unaffected) -- this only eases in the visual reveal.
export function SectionReveal({ children, delay = 0, className }: SectionRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
