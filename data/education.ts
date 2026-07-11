export type EducationEntry = {
  institution: string;
  degree: string;
  department: string;
  start_year: number;
  end_year: number | string;
  cgpa?: string;
  description?: string;
};

// Add your real education history here.
export const education: EducationEntry[] = [];
