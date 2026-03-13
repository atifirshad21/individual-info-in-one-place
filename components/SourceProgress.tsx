"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, MinusCircle, Linkedin, Globe } from "lucide-react";

const SOURCE_CONFIG = {
  linkedin:   { label: "LinkedIn", icon: Linkedin },
  perplexity: { label: "Research", icon: Globe },
} as const;

interface SourceStatus {
  source_type: string;
  status: string;
  error_message?: string;
}

interface SourceProgressProps {
  profileId: string;
  onAllDone?: () => void;
}

export default function SourceProgress({ profileId, onAllDone }: SourceProgressProps) {
  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [polling, setPolling] = useState(true);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch(`/api/sources/status?profileId=${profileId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatuses(data.statuses || []);
      if (data.allDone) {
        setPolling(false);
        onAllDone?.();
      }
    } catch { /* ignore */ }
  }, [profileId, onAllDone]);

  useEffect(() => {
    fetchStatuses();
    if (!polling) return;
    const interval = setInterval(fetchStatuses, 1500);
    return () => clearInterval(interval);
  }, [fetchStatuses, polling]);

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
        const status = statuses.find((s) => s.source_type === key);
        const Icon = config.icon;
        const state = status?.status || "pending";

        return (
          <Badge
            key={key}
            variant={state === "complete" ? "default" : "outline"}
            className={`flex items-center gap-1.5 py-1.5 px-3 ${
              state === "failed" ? "border-red-200 text-red-600 dark:border-red-800 dark:text-red-400"
              : state === "skipped" ? "border-zinc-200 text-zinc-400 dark:border-zinc-700" : ""
            }`}
          >
            {state === "fetching" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
             : state === "complete" ? <CheckCircle2 className="h-3.5 w-3.5" />
             : state === "failed" ? <XCircle className="h-3.5 w-3.5" />
             : state === "skipped" ? <MinusCircle className="h-3.5 w-3.5" />
             : <Icon className="h-3.5 w-3.5" />}
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
