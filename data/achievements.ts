export type AchievementEntry = {
  title: string;
  description: string;
  issuer: string;
  date: string;
  certificate_link?: string;
};

// Add your real achievements/awards here.
export const achievements: AchievementEntry[] = [];
