import { z } from "zod";

export const extractedDataSchema = z.object({
  keyTopics: z.array(z.string()).describe("Main topics this person is associated with"),
  recentProjects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    date: z.string().optional(),
    source: z.string(),
  })),
  publicOpinions: z.array(z.object({
    topic: z.string(),
    stance: z.string(),
    source: z.string(),
  })),
  achievements: z.array(z.object({
    description: z.string(),
    date: z.string().optional(),
    significance: z.enum(["high", "medium", "low"]),
  })),
  communicationStyle: z.string().describe("Observed communication style"),
  professionalInterests: z.array(z.string()),
});

export const crossReferenceSchema = z.object({
  corroboratedTopics: z.array(z.object({
    topic: z.string(),
    sources: z.array(z.string()),
    confidence: z.number().describe("Score between 0 and 1"),
    description: z.string(),
  })),
  careerNarrative: z.string().describe("Coherent story of their career trajectory"),
  recentFocus: z.string().describe("What they seem most focused on in the last 6 months"),
  uniqueAngles: z.array(z.string()).describe("Non-obvious observations from combining sources"),
  potentialInterests: z.array(z.string()).describe("Inferred interests not explicitly stated"),
});

export const personalizationHookSchema = z.object({
  hooks: z.array(z.object({
    type: z.enum(["shared_interest", "recent_achievement", "content_reference", "career_transition", "mutual_connection", "industry_trend", "specific_project", "thought_leadership"]),
    hook: z.string().describe("The actual conversation starter text"),
    specificReference: z.string().describe("The exact article, repo, talk referenced"),
    sourceType: z.string().describe("Which data source this came from"),
    confidenceScore: z.number().describe("Score between 0 and 1"),
    recencyScore: z.number().describe("Score between 0 and 1"),
  })),
});

export const emailDraftSchema = z.object({
  drafts: z.array(z.object({
    length: z.enum(["brief", "medium", "detailed"]),
    subject: z.string(),
    body: z.string(),
    personalizationUsed: z.array(z.string()).describe("Which hooks were incorporated"),
    estimatedReadTime: z.string(),
  })),
});

export const singleEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  personalizationUsed: z.array(z.string()),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type CrossReferenceData = z.infer<typeof crossReferenceSchema>;
export type PersonalizationHooks = z.infer<typeof personalizationHookSchema>;
export type EmailDrafts = z.infer<typeof emailDraftSchema>;
