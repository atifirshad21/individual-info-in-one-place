"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, ExternalLink, Star } from "lucide-react";

interface HighlightItem {
  description: string;
  date?: string;
  significance: "high" | "medium" | "low";
  link?: string;
}

interface LinkedInPost {
  title: string;
  snippet?: string;
  date?: string;
  link?: string;
}

interface LinkedInHighlightsProps {
  posts: LinkedInPost[];
  achievements: HighlightItem[];
}

export default function LinkedInHighlights({ posts, achievements }: LinkedInHighlightsProps) {
  const hasPosts = posts.length > 0;
  const hasAchievements = achievements.length > 0;

  if (!hasPosts && !hasAchievements) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Linkedin className="h-4 w-4 text-[#0A66C2]" />
          LinkedIn Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPosts && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Top Posts</p>
            <div className="space-y-2">
              {posts.slice(0, 5).map((post, i) => {
                const Wrapper = post.link ? "a" : "div";
                const wrapperProps = post.link ? { href: post.link, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <Wrapper
                    key={i}
                    {...(wrapperProps as Record<string, string>)}
                    className="group flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 border border-[#0A66C2]/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium leading-snug group-hover:text-[#0A66C2] transition-colors line-clamp-2">{post.title}</p>
                        {post.link && <ExternalLink className="h-3 w-3 text-zinc-300 group-hover:text-[#0A66C2] shrink-0 mt-0.5 transition-colors" />}
                      </div>
                      {post.snippet && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{post.snippet}</p>}
                      {post.date && <p className="text-xs text-zinc-400 mt-1">{post.date}</p>}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}

        {hasAchievements && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Notable Achievements</p>
            <div className="space-y-2">
              {achievements.slice(0, 6).map((item, i) => {
                const Wrapper = item.link ? "a" : "div";
                const wrapperProps = item.link ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <Wrapper
                    key={i}
                    {...(wrapperProps as Record<string, string>)}
                    className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
                      item.significance === "high"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    {item.significance === "high" && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {item.date && <span className="text-xs text-zinc-400">{item.date}</span>}
                        <Badge variant="outline" className={`text-xs ${item.significance === "high" ? "border-amber-300 text-amber-600" : ""}`}>
                          {item.significance}
                        </Badge>
                        {item.link && <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-blue-500 transition-colors" />}
                      </div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
