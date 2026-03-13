"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink, Newspaper, Mic, AtSign, Radio, Video } from "lucide-react";

interface MediaItem {
  title: string;
  link?: string;
  snippet?: string;
  date?: string;
  type: "article" | "interview" | "mention" | "podcast" | "talk";
}

interface MediaPresenceProps {
  articles: MediaItem[];
  interviews: MediaItem[];
  mentions: MediaItem[];
  podcasts: MediaItem[];
  talks: MediaItem[];
}

const typeConfig = {
  article:   { label: "Article",   icon: Newspaper, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  interview: { label: "Interview", icon: Mic,       color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  podcast:   { label: "Podcast",   icon: Radio,     color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  talk:      { label: "Talk",      icon: Video,     color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  mention:   { label: "Mention",   icon: AtSign,    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

function MediaItem({ item }: { item: MediaItem }) {
  const config = typeConfig[item.type];
  const Wrapper = item.link ? "a" : "div";
  const wrapperProps = item.link ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Wrapper
      {...(wrapperProps as Record<string, string>)}
      className="group flex items-start gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {item.title}
          </h4>
          {item.link && <ExternalLink className="h-3.5 w-3.5 text-zinc-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />}
        </div>
        {item.snippet && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{item.snippet}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
          {item.date && <span className="text-xs text-zinc-400">{item.date}</span>}
        </div>
      </div>
    </Wrapper>
  );
}

export default function MediaPresence({ articles, interviews, mentions, podcasts, talks }: MediaPresenceProps) {
  const allItems: MediaItem[] = [
    ...podcasts.map((p) => ({ ...p, type: "podcast" as const })),
    ...talks.map((t) => ({ ...t, type: "talk" as const })),
    ...interviews.map((i) => ({ ...i, type: "interview" as const })),
    ...articles.map((a) => ({ ...a, type: "article" as const })),
    ...mentions.map((m) => ({ ...m, type: "mention" as const })),
  ];

  if (allItems.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Media Presence
          <Badge variant="outline" className="ml-auto text-xs font-normal">{allItems.length} found</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {allItems.slice(0, 10).map((item, i) => (
            <MediaItem key={i} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
