export type ExperienceDocument = {
  type: string;
  title: string;
  google_drive_link: string;
};

export type ExperienceEntry = {
  company_name: string;
  position: string;
  employment_type: string;
  work_mode: string;
  start_date: string;
  end_date: string;
  description: string;
  documents?: ExperienceDocument[];
};

// Add your real work experience here.
export const experiences: ExperienceEntry[] = [];
