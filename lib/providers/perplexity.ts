import type { DataProvider, NormalizedProfile, ProviderResult } from "./types";

export interface PerplexitySourceItem {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  category: "article" | "interview" | "academic" | "github" | "podcast" | "talk" | "mention";
}

export interface PerplexityResults {
  articles:   PerplexitySourceItem[];
  interviews: PerplexitySourceItem[];
  mentions:   PerplexitySourceItem[];
  academic:   PerplexitySourceItem[];
  github:     PerplexitySourceItem[];
  podcasts:   PerplexitySourceItem[];
  rawContent: string;
  citations:  string[];
}

export class PerplexityProvider implements DataProvider<NormalizedProfile, PerplexityResults> {
  source = "perplexity" as const;

  async fetch(profile: NormalizedProfile): Promise<ProviderResult<PerplexityResults>> {
    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        return {
          success: false, data: null,
          error: "Perplexity API key not configured",
          source: this.source, fetchedAt: new Date(), ttlDays: 0,
        };
      }

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: this.buildPrompt(profile) }],
          return_citations: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        citations?: string[];
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      const citations = data.citations ?? [];

      return {
        success: true,
        data: this.parseResponse(content, citations),
        source: this.source,
        fetchedAt: new Date(),
        ttlDays: this.getTTLDays(),
      };
    } catch (error) {
      return {
        success: false, data: null,
        error: error instanceof Error ? error.message : "Perplexity fetch failed",
        source: this.source, fetchedAt: new Date(), ttlDays: 0,
      };
    }
  }

  private buildPrompt(profile: NormalizedProfile): string {
    const name = profile.name;
    const company = profile.currentCompany ? ` at ${profile.currentCompany}` : "";
    const role = profile.currentRole ? `, ${profile.currentRole}` : "";
    const industry = profile.industry ? ` in ${profile.industry}` : "";

    const conditionalSections: string[] = [];

    if (profile.isAcademic) {
      conditionalSections.push(
        `ACADEMIC (only if ${name} has published research — up to 6):
ACADEMIC_ITEM | <exact paper title> | <venue + brief description> | <year> [N]`
      );
    }

    if (profile.isTechnical) {
      conditionalSections.push(
        `GITHUB (only if a GitHub profile clearly belongs to ${name} — up to 5):
GITHUB_ITEM | <repo or activity title> | <description + star count if known> | <date or year> [N]`
      );
    }

    return `Research ${name}${role}${company}${industry}. Find recent, specific, verifiable public information from the last 24 months where possible.

Return findings in the EXACT structured format below. Each result is ONE line. Do NOT write prose paragraphs.
Include a citation marker [N] at the end of each line where N corresponds to your numbered source.

ARTICLES (authored or co-authored content, blog posts, op-eds — up to 8):
ARTICLE_ITEM | <exact title> | <one-sentence summary> | <date YYYY-MM or YYYY> [N]

INTERVIEWS (podcast guest appearances, Q&A features, video interviews — up to 6):
INTERVIEW_ITEM | <title or episode name> | <show or outlet name + brief topic> | <date YYYY-MM or YYYY> [N]

TALKS (conference talks, keynotes, panels — up to 5):
TALK_ITEM | <talk title> | <conference name and location> | <date YYYY-MM or YYYY> [N]

MENTIONS (awards, press coverage, quotes in news — up to 5):
MENTION_ITEM | <headline or award name> | <outlet + context> | <date YYYY-MM or YYYY> [N]

PODCASTS (hosted or guest podcast episodes distinct from interviews above — up to 4):
PODCAST_ITEM | <episode title> | <podcast name + topic> | <date YYYY-MM or YYYY> [N]

${conditionalSections.join("\n\n")}

RULES:
- Only include items you can cite with a real URL.
- If a category has no results, write NONE on the next line.
- Do not fabricate. If uncertain, omit.
- Prefer items from the last 24 months.`;
  }

  private parseResponse(content: string, citations: string[]): PerplexityResults {
    const articles:   PerplexitySourceItem[] = [];
    const interviews: PerplexitySourceItem[] = [];
    const mentions:   PerplexitySourceItem[] = [];
    const academic:   PerplexitySourceItem[] = [];
    const github:     PerplexitySourceItem[] = [];
    const podcasts:   PerplexitySourceItem[] = [];

    type Bucket = PerplexitySourceItem[];
    const prefixMap: Record<string, [Bucket, PerplexitySourceItem["category"]]> = {
      "ARTICLE_ITEM":   [articles,   "article"],
      "INTERVIEW_ITEM": [interviews, "interview"],
      "TALK_ITEM":      [mentions,   "talk"],
      "MENTION_ITEM":   [mentions,   "mention"],
      "PODCAST_ITEM":   [podcasts,   "podcast"],
      "ACADEMIC_ITEM":  [academic,   "academic"],
      "GITHUB_ITEM":    [github,     "github"],
    };

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      for (const [prefix, [bucket, category]] of Object.entries(prefixMap)) {
        if (!trimmed.startsWith(prefix + " |")) continue;

        const citationMatch = trimmed.match(/\[(\d+)\]\s*$/);
        const citationIndex = citationMatch ? parseInt(citationMatch[1], 10) - 1 : -1;
        const link = citationIndex >= 0 && citationIndex < citations.length
          ? citations[citationIndex]
          : "";

        const withoutPrefix = trimmed
          .slice(prefix.length + 2)
          .replace(/\s*\[\d+\]\s*$/, "")
          .trim();
        const parts = withoutPrefix.split(" | ").map((p) => p.trim());

        const title = parts[0] ?? "";
        if (title && title !== "NONE") {
          bucket.push({
            title,
            snippet: parts[1] ?? "",
            date:    parts[2] ?? undefined,
            link,
            category,
          });
        }
        break;
      }
    }

    return { articles, interviews, mentions, academic, github, podcasts, rawContent: content, citations };
  }

  shouldFetch(): boolean { return true; }
  getTTLDays(): number { return 7; }
}
