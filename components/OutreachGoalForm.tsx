"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

const GOALS = [
  { value: "networking", label: "Networking" },
  { value: "sales", label: "Sales outreach" },
  { value: "hiring", label: "Recruiting" },
  { value: "partnership", label: "Partnership" },
  { value: "informational", label: "Info interview" },
  { value: "speaking", label: "Speaking invite" },
  { value: "other", label: "Other" },
] as const;

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise" },
  { value: "storytelling", label: "Storytelling" },
] as const;

const RELATIONSHIPS = [
  { value: "cold", label: "Cold outreach" },
  { value: "warm_intro", label: "Warm intro" },
  { value: "follow_up", label: "Follow up" },
  { value: "mutual_connection", label: "Mutual connection" },
] as const;

export interface OutreachFormData {
  goal: string;
  context: string;
  senderRole?: string;
  senderCompany?: string;
  relationship: string;
  tone: string;
}

interface OutreachGoalFormProps {
  data: OutreachFormData;
  onChange: (data: OutreachFormData) => void;
  disabled?: boolean;
}

export default function OutreachGoalForm({ data, onChange, disabled }: OutreachGoalFormProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (field: keyof OutreachFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Outreach goal</Label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Badge
              key={g.value}
              variant={data.goal === g.value ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-1.5 px-3"
              onClick={() => !disabled && update("goal", g.value)}
            >
              {g.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">
          Why are you reaching out?{" "}
          <span className="text-zinc-400 font-normal">(be specific for better emails)</span>
        </Label>
        <Textarea
          id="context"
          placeholder="e.g., I'm building a developer tool and want to get their feedback as a potential user..."
          value={data.context}
          onChange={(e) => update("context", e.target.value)}
          disabled={disabled}
          rows={3}
          className="resize-none"
        />
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        {expanded ? "Less options" : "More options (sender info, tone)"}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderRole">Your role</Label>
              <Input id="senderRole" placeholder="e.g., Product Manager" value={data.senderRole || ""} onChange={(e) => update("senderRole", e.target.value)} disabled={disabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderCompany">Your company</Label>
              <Input id="senderCompany" placeholder="e.g., Acme Corp" value={data.senderCompany || ""} onChange={(e) => update("senderCompany", e.target.value)} disabled={disabled} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Badge key={t.value} variant={data.tone === t.value ? "default" : "outline"} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => !disabled && update("tone", t.value)}>
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Relationship type</Label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <Badge key={r.value} variant={data.relationship === r.value ? "default" : "outline"} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => !disabled && update("relationship", r.value)}>
                  {r.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
