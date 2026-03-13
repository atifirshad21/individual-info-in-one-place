"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Briefcase } from "lucide-react";

interface TimelineEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

interface CareerTimelineProps {
  workHistory: TimelineEntry[];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getDuration(start: string, end?: string): string {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  if (isNaN(s.getTime())) return "";
  const months = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}mo`;
  if (rem === 0) return `${years}yr`;
  return `${years}yr ${rem}mo`;
}

export default function CareerTimeline({ workHistory }: CareerTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  if (!workHistory || workHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />Career Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-4">
            {workHistory.map((entry, i) => (
              <div key={i} className="relative pl-8">
                <div className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center ${entry.isCurrent ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"}`}>
                  <div className={`h-2 w-2 rounded-full ${entry.isCurrent ? "bg-green-500" : "bg-zinc-400"}`} />
                </div>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{entry.company}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-500">{formatDate(entry.startDate)} — {entry.isCurrent ? "Present" : formatDate(entry.endDate || "")}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">{getDuration(entry.startDate, entry.endDate)}</Badge>
                    </div>
                  </div>
                  {entry.location && <p className="text-xs text-zinc-400 mt-0.5">{entry.location}</p>}
                  {entry.description && (
                    <>
                      <button onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-1 flex items-center gap-0.5">
                        <ChevronDown className={`h-3 w-3 transition-transform ${expandedIndex === i ? "rotate-180" : ""}`} />
                        {expandedIndex === i ? "Less" : "More"}
                      </button>
                      {expandedIndex === i && <p className="text-sm text-zinc-500 mt-2 whitespace-pre-line">{entry.description}</p>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
