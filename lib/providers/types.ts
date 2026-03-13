export type SourceType = "linkedin" | "perplexity";

export interface ProviderResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
  source: SourceType;
  fetchedAt: Date;
  ttlDays: number;
}

export interface NormalizedProfile {
  name: string;
  headline?: string;
  currentRole?: string;
  currentCompany?: string;
  industry?: string;
  skills?: string[];
  isAcademic: boolean;
  isTechnical: boolean;
  linkedinUrl: string;
}

export interface DataProvider<TInput = string, TOutput = unknown> {
  source: SourceType;
  fetch(input: TInput): Promise<ProviderResult<TOutput>>;
  shouldFetch(profile: NormalizedProfile): boolean;
  getTTLDays(): number;
}

export function buildNormalizedProfile(linkedinData: Record<string, unknown>): NormalizedProfile {
  const headline = (linkedinData.headline as string) || "";
  const currentRole = (linkedinData.currentRole as Record<string, unknown>)?.title as string || "";
  const skills = (linkedinData.skills as string[]) || [];
  const summary = (linkedinData.summary as string) || "";

  const technicalKeywords = [
    "engineer", "developer", "programmer", "software", "devops",
    "frontend", "backend", "fullstack", "full-stack", "cto", "vp engineering",
    "tech lead", "architect", "sre", "data scientist", "ml engineer",
    "machine learning", "ai engineer", "cloud", "infrastructure",
  ];

  const academicKeywords = [
    "professor", "researcher", "phd", "postdoc", "lecturer",
    "academic", "faculty", "scholar", "doctoral", "university",
    "research scientist", "principal investigator",
  ];

  const combinedText = `${headline} ${currentRole} ${summary}`.toLowerCase();
  const isTechnical = technicalKeywords.some((kw) => combinedText.includes(kw));
  const isAcademic = academicKeywords.some((kw) => combinedText.includes(kw));

  return {
    name: (linkedinData.name as string) || "",
    headline,
    currentRole,
    currentCompany: (linkedinData.currentRole as Record<string, unknown>)?.company as string || "",
    industry: (linkedinData.industry as string) || "",
    skills,
    isAcademic,
    isTechnical,
    linkedinUrl: (linkedinData.linkedinUrl as string) || "",
  };
}
