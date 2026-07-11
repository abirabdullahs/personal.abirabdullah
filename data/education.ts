export type EducationEntry = {
  institution: string;
  degree: string;
  department: string;
  start_year: number;
  end_year: number | string;
  cgpa?: string;
  description?: string;
};

export const education: EducationEntry[] = [
  {
    institution: "Bangladesh University of Engineering and Technology (BUET)",
    degree: "Bachelor of Science (B.Sc.)",
    department: "Computer Science and Engineering (CSE)",
    start_year: 2025,
    end_year: "Present",
    
  },
  {
    institution: "Tamirul Millat Kamil Madrasah",
    degree: "Higher Secondary Certificate (HSC)",
    department: "Science",
    start_year: 2022,
    end_year: 2024,
  },
];