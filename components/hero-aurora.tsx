'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Ambient background texture for the hero -- two soft, slow-drifting
// gradient blobs using the site's own primary (forest green) and highlight
// (sienna) tokens, kept at low opacity so they read as texture rather than
// a loud effect. Purely decorative: aria-hidden and pointer-events-none so
// it never affects usability, screen readers, or click targets. Motion is
// skipped entirely when the user has requested reduced motion.
export function HeroAurora() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
        animate={shouldReduceMotion ? undefined : { x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-16 h-[26rem] w-[26rem] rounded-full bg-highlight/10 blur-3xl"
        animate={shouldReduceMotion ? undefined : { x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
