export type Venture = {
  name: string;
  tagline: string;
  description: string;
  // Leave empty for now — a clean black/white "C" mark shows as a fallback
  // until a real logo image URL is added here.
  logo_url?: string;
  link?: string;
  badge: string;
};

export const ventures: Venture[] = [
  {
    name: 'Centfume',
    tagline: 'A perfume brand',
    description: 'A fragrance startup I founded — building a perfume brand from scratch, from formulation to launch.',
    logo_url: '',
    link: '',
    badge: 'Founder',
  },
];
