import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { emailDraftSchema, singleEmailSchema } from "./schemas";
import { buildEmailPrompt, buildRegeneratePrompt } from "./prompts";

export async function generateEmails(params: {
  hooks: unknown[];
  outreachGoal: string;
  senderContext: unknown;
  tone: string;
  profileName: string;
  profileSummary: unknown;
}) {
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: emailDraftSchema,
    prompt: buildEmailPrompt(params),
    maxOutputTokens: 4000,
  });
  return result.object;
}

export async function regenerateEmail(params: {
  originalDraft: unknown;
  hooks: unknown[];
  newTone: string;
  feedback?: string;
  profileName: string;
  outreachGoal: string;
}) {
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: singleEmailSchema,
    prompt: buildRegeneratePrompt(params),
    maxOutputTokens: 2000,
  });
  return result.object;
}
