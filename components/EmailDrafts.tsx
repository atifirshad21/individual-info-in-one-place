"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Copy, Check, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailDraft {
  length: string;
  subject: string;
  body: string;
  personalizationUsed: string[];
  estimatedReadTime: string;
}

interface EmailDraftsProps {
  drafts: EmailDraft[];
  profileId: string;
  outreachGoal: string;
  hooks?: unknown[];
  onRegenerate?: (draft: EmailDraft, tone: string) => void;
  regenerating?: boolean;
}

const TONES = ["professional", "casual", "enthusiastic", "concise", "storytelling"];

export default function EmailDrafts({ drafts, onRegenerate, regenerating }: EmailDraftsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function copyToClipboard(draft: EmailDraft, index: number) {
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (!drafts || drafts.length === 0) return null;

  const tabLabels: Record<string, string> = { brief: "Brief", medium: "Medium", detailed: "Detailed" };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5" />Email Drafts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={drafts[0]?.length || "brief"}>
          <TabsList className="w-full grid grid-cols-3">
            {drafts.map((draft) => (
              <TabsTrigger key={draft.length} value={draft.length}>{tabLabels[draft.length] || draft.length}</TabsTrigger>
            ))}
          </TabsList>

          {drafts.map((draft, i) => (
            <TabsContent key={draft.length} value={draft.length} className="mt-4">
              <div className="mb-3">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Subject</label>
                <p className="mt-1 font-medium text-sm bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">{draft.subject}</p>
              </div>

              <div className="mb-3">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Body</label>
                <div className="mt-1 text-sm bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-md border border-zinc-100 dark:border-zinc-800 whitespace-pre-line leading-relaxed">{draft.body}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-zinc-400">~{draft.estimatedReadTime} read</span>
                {draft.personalizationUsed.map((p, j) => (
                  <Badge key={j} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => copyToClipboard(draft, i)} className="gap-1.5">
                  {copiedIndex === i ? (<><Check className="h-3.5 w-3.5" />Copied!</>) : (<><Copy className="h-3.5 w-3.5" />Copy to clipboard</>)}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={regenerating}>
                      {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Regenerate
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {TONES.map((tone) => (
                      <DropdownMenuItem key={tone} onClick={() => onRegenerate?.(draft, tone)}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1)} tone
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
