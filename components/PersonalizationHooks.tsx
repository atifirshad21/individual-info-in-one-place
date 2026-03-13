"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles } from "lucide-react";

interface Hook {
  type: string;
  hook: string;
  specificReference: string;
  sourceType: string;
  confidenceScore: number;
  recencyScore: number;
}

interface PersonalizationHooksProps {
  hooks: Hook[];
}

const typeLabels: Record<string, string> = {
  shared_interest: "Shared Interest",
  recent_achievement: "Recent Win",
  content_reference: "Content",
  career_transition: "Career Move",
  mutual_connection: "Mutual",
  industry_trend: "Industry",
  specific_project: "Project",
  thought_leadership: "Thought Leader",
};

const typeColors: Record<string, string> = {
  shared_interest: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  recent_achievement: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  content_reference: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  career_transition: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  specific_project: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  thought_leadership: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

export default function PersonalizationHooks({ hooks }: PersonalizationHooksProps) {
  if (!hooks || hooks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Personalization Hooks
          <Badge variant="secondary" className="ml-auto text-xs">
            <Sparkles className="h-3 w-3 mr-1" />AI-generated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hooks.map((hook, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${typeColors[hook.type] || "bg-zinc-100 text-zinc-700"}`}>
                {typeLabels[hook.type] || hook.type}
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{hook.hook}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
