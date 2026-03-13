export interface LinkedInProfileData {
  name: string;
  headline: string;
  summary: string;
  location: string;
  profileImageUrl: string;
  connectionCount: number;
  industry: string;
  currentRole: WorkExperience | null;
  workHistory: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages: string[];
  volunteerExperience: VolunteerExperience[];
  recommendations: number;
  linkedinUrl: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  companyLinkedInUrl?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

export interface Education {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Certification {
  name: string;
  authority?: string;
  startDate?: string;
  url?: string;
}

export interface VolunteerExperience {
  role: string;
  organization: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}
