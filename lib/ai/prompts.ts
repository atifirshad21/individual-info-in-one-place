import type { SourceType } from "@/lib/providers/types";

// ===== PHASE 1: EXTRACTION (Haiku) =====

export function buildExtractionPrompt(sourceType: SourceType, rawData: unknown): string {
  const sourceInstructions: Record<string, string> = {
    linkedin: `Extract from this LinkedIn profile data:
- Current role and tenure
- Career progression pattern (upward, lateral, industry changes)
- Key skills and endorsements
- Education highlights
- Volunteer work or causes
- Professional headline messaging`,
    perplexity: `Extract from this Perplexity research data about a professional.
The data contains structured findings across articles, interviews, talks, academic work, GitHub activity, and podcast appearances.

Extract:
- Articles and blog posts authored (with titles and dates)
- Conference talks or keynotes (with event names and dates)
- Podcast appearances or interviews (with show names and topics covered)
- Academic papers or research output (with publication venues and citation signals)
- GitHub repositories or open source contributions (with project names and impact)
- Awards, press coverage, or notable mentions (with outlet and date)
- Recurring themes across content types — what topics do they return to most
- How they describe their own work (language patterns, framing)
- Their apparent stance or perspective on key issues in their field`,
  };

  return `You are a data extraction specialist. Extract structured, factual information from raw data about a professional.

RULES:
- Only extract what is explicitly present. Never infer or fabricate.
- Include dates whenever available.
- Note the source/context for each piece of information.
- Prioritize information from the last 6 months.

${sourceInstructions[sourceType] || "Extract all relevant professional information."}

Raw ${sourceType} data:
${JSON.stringify(rawData, null, 2)}

Return structured JSON with the extracted information.`;
}

// ===== PHASE 2: CROSS-REFERENCE (Haiku) =====

export function buildCrossReferencePrompt(extractedData: Record<string, unknown>, profileName: string): string {
  return `You are an intelligence analyst specializing in professional profiles. You have extracted data from multiple sources about ${profileName}. Cross-reference to find patterns.

TASKS:
1. CORROBORATE: Topics/themes across multiple sources (high-confidence)
2. NARRATIVE: Coherent career narrative
3. RECENT FOCUS: What are they focused on RIGHT NOW (last 6 months)?
4. UNIQUE ANGLES: Non-obvious connections across sources
5. INFERRED INTERESTS: Reasonable inferences from totality of evidence

SOURCE DATA:
${JSON.stringify(extractedData, null, 2)}

Return structured JSON with cross-referenced analysis. Cite which sources support each observation.`;
}

// ===== PHASE 3: PERSONALIZATION HOOKS (Sonnet) =====

export function buildPersonalizationPrompt(profileSummary: unknown, crossRefInsights: unknown, outreachGoal: string, senderContext: unknown): string {
  return `You are a world-class relationship builder. Find genuine, specific conversation starters that demonstrate real research.

QUALITY STANDARDS:
- Every hook MUST reference a SPECIFIC detail: a paper title, repo name, quote, project name, date, company
- Generic observations are WORTHLESS. "I see you work in tech" = garbage
- Each hook should feel like someone spent 30+ minutes researching
- Prioritize hooks from the LAST 6 MONTHS
- Rank by: specificity > recency > uniqueness > relevance to goal

HOOK TYPES: shared_interest, recent_achievement, content_reference, career_transition, specific_project, thought_leadership, industry_trend

PROFILE DATA:
${JSON.stringify(profileSummary, null, 2)}

CROSS-REFERENCED INSIGHTS:
${JSON.stringify(crossRefInsights, null, 2)}

OUTREACH GOAL: ${outreachGoal}
SENDER CONTEXT: ${JSON.stringify(senderContext, null, 2)}

Generate 5-8 personalization hooks, ranked by quality (best first).`;
}

// ===== PHASE 4: EMAIL GENERATION (Sonnet) =====

export function buildEmailPrompt(params: {
  hooks: unknown[];
  outreachGoal: string;
  senderContext: unknown;
  tone: string;
  profileName: string;
  profileSummary: unknown;
}): string {
  return `You are an expert cold email copywriter with 40%+ open rates and 15%+ response rates.

ABSOLUTE RULES:
1. NEVER use "I came across your profile" or "I noticed you"
2. NEVER use "I hope this email finds you well"
3. OPEN with something specific showing genuine interest
4. Each email MUST use at least 2 personalization hooks
5. End with a clear, LOW-COMMITMENT call-to-action
6. Subject lines: conversational, not salesy
7. Tone: ${params.tone}

HOOKS AVAILABLE:
${JSON.stringify(params.hooks, null, 2)}

RECIPIENT: ${params.profileName}
RECIPIENT CONTEXT: ${JSON.stringify(params.profileSummary, null, 2)}
GOAL: ${params.outreachGoal}
SENDER: ${JSON.stringify(params.senderContext, null, 2)}

Generate exactly 3 variants:
1. BRIEF (3-4 sentences, ~50-75 words) - best for busy executives
2. MEDIUM (2 short paragraphs, ~100-150 words) - standard professional
3. DETAILED (2-3 paragraphs, ~200-250 words) - demonstrates deep interest

For each: list personalization hooks used and estimate reading time.`;
}

// ===== EMAIL REGENERATION =====

export function buildRegeneratePrompt(params: {
  originalDraft: unknown;
  hooks: unknown[];
  newTone: string;
  feedback?: string;
  profileName: string;
  outreachGoal: string;
}): string {
  return `Rewrite this email with a ${params.newTone} tone.
${params.feedback ? `USER FEEDBACK: ${params.feedback}` : ""}

ORIGINAL EMAIL: ${JSON.stringify(params.originalDraft, null, 2)}
AVAILABLE HOOKS: ${JSON.stringify(params.hooks, null, 2)}
RECIPIENT: ${params.profileName}
GOAL: ${params.outreachGoal}

Write a single email (subject + body) in the ${params.newTone} tone. Keep the same hooks but adjust the voice. List which hooks you used.`;
}
