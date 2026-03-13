import { z } from "zod";

export const linkedInUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname === "www.linkedin.com" || parsed.hostname === "linkedin.com";
      } catch {
        return false;
      }
    },
    "Must be a LinkedIn URL"
  )
  .refine(
    (url) => /linkedin\.com\/in\/[\w-]+/.test(url),
    "Must be a LinkedIn profile URL (linkedin.com/in/...)"
  );

export function normalizeLinkedInUrl(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([\w-]+)/);
  if (!match) throw new Error("Invalid LinkedIn URL");
  return `linkedin.com/in/${match[1].toLowerCase()}`;
}

export const outreachGoalSchema = z.object({
  goal: z.enum(["networking", "sales", "hiring", "partnership", "informational", "speaking", "other"]),
  context: z.string().min(10, "Please provide at least 10 characters of context").max(1000),
  senderRole: z.string().optional(),
  senderCompany: z.string().optional(),
  relationship: z.enum(["cold", "warm_intro", "follow_up", "mutual_connection"]).default("cold"),
  tone: z.enum(["professional", "casual", "enthusiastic", "concise", "storytelling"]).default("professional"),
});

export type OutreachGoal = z.infer<typeof outreachGoalSchema>;
