"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, ExternalLink, Star } from "lucide-react";

interface ActivityItem {
  title: string;
  source: string;
  date?: string;
  snippet?: string;
  link?: string;
  type: string;
}

interface NotableItem {
  description: string;
  date?: string;
  significance: "high" | "medium" | "low";
  source?: string;
  link?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  notableItems: NotableItem[];
}

export default function ActivityFeed({ activities, notableItems }: ActivityFeedProps) {
  const [tab, setTab] = useState<"activity" | "achievements">("activity");

  const hasActivity = activities.length > 0;
  const hasAchievements = notableItems.length > 0;

  if (!hasActivity && !hasAchievements) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />Highlights
        </CardTitle>
        {hasActivity && hasAchievements && (
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setTab("activity")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${tab === "activity" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Activity ({activities.length})
            </button>
            <button
              onClick={() => setTab("achievements")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${tab === "achievements" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Achievements ({notableItems.length})
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {(tab === "activity" || !hasAchievements) && (
          <div className="space-y-2">
            {activities.slice(0, 8).map((item, i) => {
              const Wrapper = item.link ? "a" : "div";
              const wrapperProps = item.link ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper key={i} {...(wrapperProps as Record<string, string>)} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      {item.link && <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-blue-500 shrink-0 transition-colors" />}
                    </div>
                    {item.snippet && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.snippet}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      {item.date && <span className="text-xs text-zinc-400">{item.date}</span>}
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}

        {(tab === "achievements" || !hasActivity) && (
          <div className="space-y-2">
            {notableItems.map((item, i) => {
              const Wrapper = item.link ? "a" : "div";
              const wrapperProps = item.link ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper key={i} {...(wrapperProps as Record<string, string>)} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors group ${item.significance === "high" ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}>
                  {item.significance === "high" && <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.date && <span className="text-xs text-zinc-400">{item.date}</span>}
                      {item.source && <Badge variant="outline" className="text-xs">{item.source}</Badge>}
                      {item.link && <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-blue-500 shrink-0 transition-colors" />}
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
