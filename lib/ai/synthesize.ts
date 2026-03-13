import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { crossReferenceSchema, personalizationHookSchema } from "./schemas";
import { buildCrossReferencePrompt, buildPersonalizationPrompt } from "./prompts";

export async function crossReferenceInsights(
  extractedData: Record<string, unknown>,
  profileName: string
) {
  const result = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: crossReferenceSchema,
    prompt: buildCrossReferencePrompt(extractedData, profileName),
    maxOutputTokens: 3000,
  });
  return result.object;
}

export async function generatePersonalizationHooks(params: {
  profileSummary: unknown;
  crossRefInsights: unknown;
  outreachGoal: string;
  senderContext: unknown;
}) {
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: personalizationHookSchema,
    prompt: buildPersonalizationPrompt(
      params.profileSummary,
      params.crossRefInsights,
      params.outreachGoal,
      params.senderContext
    ),
    maxOutputTokens: 4000,
  });
  return result.object;
}
