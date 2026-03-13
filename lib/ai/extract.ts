import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { extractedDataSchema } from "./schemas";
import { buildExtractionPrompt } from "./prompts";
import type { SourceType } from "@/lib/providers/types";

export async function extractFromSource(sourceType: SourceType, rawData: unknown) {
  const result = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: extractedDataSchema,
    prompt: buildExtractionPrompt(sourceType, rawData),
    maxOutputTokens: 2000,
  });
  return result.object;
}

export async function extractFromAllSources(
  sourcesData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const extractions: Record<string, unknown> = {};

  const results = await Promise.allSettled(
    Object.entries(sourcesData).map(async ([sourceType, data]) => {
      if (!data) return { sourceType, extracted: null };
      const extracted = await extractFromSource(sourceType as SourceType, data);
      return { sourceType, extracted };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.extracted) {
      extractions[result.value.sourceType] = result.value.extracted;
    }
  }

  return extractions;
}
