"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileCard from "@/components/ProfileCard";
import CareerTimeline from "@/components/CareerTimeline";
import SourceProgress from "@/components/SourceProgress";
import LinkedInHighlights from "@/components/LinkedInHighlights";
import MediaPresence from "@/components/MediaPresence";
import EmailDrafts from "@/components/EmailDrafts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, ArrowLeft, TrendingUp, PenLine, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ResultsClientProps {
  profileId: string;
  initialProfile: Record<string, unknown>;
}

type Phase = "collecting" | "synthesizing" | "ready" | "generating_emails" | "complete";

export default function ResultsClient({ profileId, initialProfile }: ResultsClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [phase, setPhase] = useState<Phase>(
    initialProfile.synthesis ? "ready" : "collecting"
  );
  const [hooks, setHooks] = useState<unknown[]>([]);
  const [drafts, setDrafts] = useState<unknown[]>([]);
  const [regenerating, setRegenerating] = useState(false);

  const [goalData, setGoalData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(`goal_${profileId}`);
    if (stored) {
      try { setGoalData(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [profileId]);

  useEffect(() => {
    if (phase === "collecting") {
      fetch("/api/sources/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      }).catch(() => {});
    }
  }, [profileId, phase]);

  const handleSourcesDone = useCallback(async () => {
    if (phase !== "collecting") return;
    try {
      const res = await fetch(`/api/profile/${profileId}`);
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch { /* ignore */ }
    setPhase("synthesizing");
  }, [profileId, phase]);

  useEffect(() => {
    if (phase !== "synthesizing") return;
    async function synthesize() {
      try {
        const res = await fetch("/api/profile/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile((prev) => ({ ...prev, synthesis: data.synthesis }));
          setPhase("ready");
        } else {
          toast.error("Failed to synthesize profile data");
          setPhase("ready");
        }
      } catch {
        toast.error("Synthesis failed. Try refreshing.");
        setPhase("ready");
      }
    }
    synthesize();
  }, [phase, profileId]);

  async function handleGenerateEmails() {
    if (!goalData) {
      toast.error("No outreach goal found. Go back and enter your goal.");
      return;
    }
    setPhase("generating_emails");
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, ...goalData }),
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to generate emails");
        setPhase("ready");
        return;
      }
      const data = await res.json();
      setHooks(data.hooks || []);
      setDrafts(data.drafts || []);
      setPhase("complete");
    } catch {
      toast.error("Email generation failed. Try again.");
      setPhase("ready");
    }
  }

  async function handleRegenerate(draft: Record<string, unknown>, tone: string) {
    setRegenerating(true);
    try {
      const res = await fetch("/api/email/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          originalDraft: draft,
          hooks,
          newTone: tone,
          outreachGoal: goalData ? `${goalData.goal}: ${goalData.context}` : "",
        }),
      });
      if (res.ok) {
        const newDraft = await res.json();
        setDrafts((prev) =>
          (prev as Array<Record<string, unknown>>).map((d) =>
            (d as Record<string, unknown>).length === draft.length
              ? { ...newDraft, length: draft.length, estimatedReadTime: draft.estimatedReadTime }
              : d
          )
        );
        toast.success("Email regenerated");
      } else {
        toast.error("Regeneration failed");
      }
    } catch {
      toast.error("Regeneration failed");
    }
    setRegenerating(false);
  }

  // ── Data extraction ──────────────────────────────────────────────────────────
  const linkedinData = (profile.cached_linkedin_data || {}) as Record<string, unknown>;
  const workHistory = ((linkedinData.workHistory || []) as Array<Record<string, unknown>>).map((w) => ({
    title: (w.title as string) || "",
    company: (w.company as string) || "",
    location: w.location as string | undefined,
    startDate: (w.startDate as string) || "",
    endDate: w.endDate as string | undefined,
    description: w.description as string | undefined,
    isCurrent: (w.isCurrent as boolean) || false,
  }));

  const synthesis = profile.synthesis as Record<string, unknown> | null;
  const crossRef = synthesis?.crossReference as Record<string, unknown> | null;
  const extractions = synthesis?.extractions as Record<string, unknown> | null;

  // Perplexity raw data (has real citation links)
  const dataSources = (profile.data_sources || []) as Array<{ source_type: string; raw_data: unknown }>;
  const perplexityRaw = dataSources.find((s) => s.source_type === "perplexity")?.raw_data as {
    articles?:   Array<{ title: string; link: string; snippet?: string; date?: string; category?: string }>;
    interviews?: Array<{ title: string; link: string; snippet?: string; date?: string; category?: string }>;
    mentions?:   Array<{ title: string; link: string; snippet?: string; date?: string; category?: string }>;
    podcasts?:   Array<{ title: string; link: string; snippet?: string; date?: string; category?: string }>;
  } | undefined;

  // Media presence from Perplexity — talks are stored in mentions with category "talk"
  const mediaArticles   = (perplexityRaw?.articles   || []).map((a) => ({ ...a, type: "article"   as const }));
  const mediaInterviews = (perplexityRaw?.interviews  || []).map((i) => ({ ...i, type: "interview" as const }));
  const mediaPodcasts   = (perplexityRaw?.podcasts    || []).map((p) => ({ ...p, type: "podcast"   as const }));
  const mediaTalks      = (perplexityRaw?.mentions    || []).filter((m) => m.category === "talk").map((t) => ({ ...t, type: "talk" as const }));
  const mediaMentions   = (perplexityRaw?.mentions    || []).filter((m) => m.category !== "talk").map((m) => ({ ...m, type: "mention" as const }));

  // LinkedIn posts — from LinkedIn extraction or linkedinData
  const linkedinExtraction = extractions?.linkedin as Record<string, unknown> | undefined;
  const linkedinPosts = (
    (linkedinData.posts as Array<Record<string, unknown>> | undefined) ||
    (linkedinExtraction?.posts as Array<Record<string, unknown>> | undefined) ||
    []
  ).map((p) => ({
    title: (p.title as string) || (p.content as string) || "",
    snippet: p.snippet as string | undefined,
    date: p.date as string | undefined,
    link: p.link as string | undefined,
  }));

  // Helper to find a perplexity link for an achievement
  const perplexityAllItems = [
    ...(perplexityRaw?.articles || []),
    ...(perplexityRaw?.interviews || []),
    ...(perplexityRaw?.mentions || []),
  ];
  function findPerplexityLink(description: string): string | undefined {
    const words = description.toLowerCase().split(/\s+/).filter((w) => w.length > 5);
    const match = perplexityAllItems.find((item) =>
      words.some((w) => item.title.toLowerCase().includes(w))
    );
    return match?.link || undefined;
  }

  // Achievements from all extractions
  const achievements: Array<{ description: string; date?: string; significance: "high" | "medium" | "low"; link?: string }> = [];
  if (extractions) {
    for (const [, data] of Object.entries(extractions)) {
      const extracted = data as Record<string, unknown>;
      if (extracted?.achievements) {
        for (const achievement of extracted.achievements as Array<Record<string, unknown>>) {
          const description = (achievement.description as string) || "";
          achievements.push({
            description,
            date: achievement.date as string | undefined,
            significance: (achievement.significance as "high" | "medium" | "low") || "medium",
            link: findPerplexityLink(description),
          });
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-1">
        <ArrowLeft className="h-4 w-4" />New search
      </Button>

      {/* Profile Card */}
      {(profile.name as string) ? (
        <ProfileCard
          name={(profile.name as string) || ""}
          headline={profile.headline as string | undefined}
          currentRole={profile.current_role_title as string | undefined}
          location={profile.location as string | undefined}
          profileImageUrl={profile.profile_image_url as string | undefined}
          connectionCount={profile.connection_count as number | undefined}
          industry={profile.industry as string | undefined}
          linkedinUrl={profile.linkedin_url as string | undefined}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm text-zinc-500">Loading profile data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Progress */}
      <SourceProgress profileId={profileId} onAllDone={handleSourcesDone} />

      {/* Synthesizing indicator */}
      {phase === "synthesizing" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium">Analyzing data sources...</p>
                <p className="text-xs text-zinc-500">Cross-referencing information across LinkedIn, web, and media</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {synthesis && (
        <div className="space-y-6">
          {/* Career Narrative — full width */}
          {typeof crossRef?.careerNarrative === "string" && crossRef.careerNarrative && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                  <h3 className="font-semibold text-sm">Career Trajectory</h3>
                </div>
                <ul className="space-y-2">
                  {crossRef.careerNarrative
                    .split(/(?<=[.!?])\s+/)
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0)
                    .map((sentence: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                        {sentence}
                      </li>
                    ))}
                </ul>
                {typeof crossRef?.recentFocus === "string" && crossRef.recentFocus && (
                  <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Current Focus</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{crossRef.recentFocus}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Career Timeline — full width */}
          <CareerTimeline workHistory={workHistory} />

          {/* Articles & Writing — full width */}
          {mediaArticles.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <PenLine className="h-4 w-4 text-zinc-500" />
                  <h3 className="font-semibold text-sm">Articles & Writing</h3>
                  <Badge variant="outline" className="ml-auto text-xs font-normal">{mediaArticles.length} found</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mediaArticles.map((article, i) => {
                    const Wrapper = article.link ? "a" : "div";
                    const wrapperProps = article.link ? { href: article.link, target: "_blank", rel: "noopener noreferrer" } : {};
                    return (
                      <Wrapper key={i} {...(wrapperProps as Record<string, string>)} className="group flex items-start gap-2.5 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="text-sm font-medium leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</p>
                            {article.link && <ExternalLink className="h-3.5 w-3.5 text-zinc-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />}
                          </div>
                          {article.snippet && <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{article.snippet}</p>}
                          {article.date && <p className="text-xs text-zinc-400 mt-1.5">{article.date}</p>}
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LinkedIn + Media — two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LinkedInHighlights posts={linkedinPosts} achievements={achievements} />
            <MediaPresence articles={mediaArticles} interviews={mediaInterviews} mentions={mediaMentions} podcasts={mediaPodcasts} talks={mediaTalks} />
          </div>
        </div>
      )}

      {/* Generate emails CTA */}
      {phase === "ready" && goalData && (
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={handleGenerateEmails} className="gap-2 h-12 px-8 text-base">
            <Mail className="h-5 w-5" />Generate Personalized Emails
          </Button>
        </div>
      )}

      {phase === "generating_emails" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium">Generating personalized emails...</p>
                <p className="text-xs text-zinc-500">Crafting 3 email variants based on profile insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Drafts */}
      {drafts.length > 0 && (
        <EmailDrafts
          drafts={drafts as Array<{ length: string; subject: string; body: string; personalizationUsed: string[]; estimatedReadTime: string }>}
          profileId={profileId}
          outreachGoal={goalData ? `${goalData.goal}: ${goalData.context}` : ""}
          hooks={hooks}
          onRegenerate={handleRegenerate as unknown as (draft: { length: string; subject: string; body: string; personalizationUsed: string[]; estimatedReadTime: string }, tone: string) => void}
          regenerating={regenerating}
        />
      )}
    </div>
  );
}
