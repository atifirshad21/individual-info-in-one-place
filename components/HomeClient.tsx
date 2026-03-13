"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import URLInput from "@/components/URLInput";
import OutreachGoalForm, { type OutreachFormData } from "@/components/OutreachGoalForm";
import BulkUpload from "@/components/BulkUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, User, Users } from "lucide-react";
import { toast } from "sonner";

type Mode = "single" | "bulk";

export default function HomeClient() {
  const [mode, setMode] = useState<Mode>("single");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [goalData, setGoalData] = useState<OutreachFormData>({
    goal: "networking",
    context: "",
    senderRole: "",
    senderCompany: "",
    relationship: "cold",
    tone: "professional",
  });

  const router = useRouter();

  const isValidUrl = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/.test(linkedinUrl);
  const hasContext = goalData.context.length >= 10;
  const canSubmit = isValidUrl && hasContext && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      if (!profileRes.ok) {
        const error = await profileRes.json();
        toast.error(error.error || "Failed to fetch profile");
        setLoading(false);
        return;
      }

      const { profileId } = await profileRes.json();
      sessionStorage.setItem(`goal_${profileId}`, JSON.stringify(goalData));
      router.push(`/results/${profileId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit mx-auto">
        <button
          onClick={() => setMode("single")}
          className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md transition-colors ${mode === "single" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
          <User className="h-3.5 w-3.5" />Single
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md transition-colors ${mode === "bulk" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
          <Users className="h-3.5 w-3.5" />Bulk
        </button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {mode === "single" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">LinkedIn Profile URL</label>
                <URLInput value={linkedinUrl} onChange={setLinkedinUrl} disabled={loading} />
              </div>

              <OutreachGoalForm data={goalData} onChange={setGoalData} disabled={loading} />

              <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-11 text-base gap-2">
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Researching profile...</>) : (<>Research & Generate<ArrowRight className="h-4 w-4" /></>)}
              </Button>

              {!hasContext && linkedinUrl && (
                <p className="text-xs text-zinc-400 text-center">
                  Add at least 10 characters of context about why you&apos;re reaching out
                </p>
              )}
            </>
          ) : (
            <>
              <OutreachGoalForm data={goalData} onChange={setGoalData} disabled={false} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Spreadsheet</label>
                <p className="text-xs text-zinc-400">Excel (.xlsx) or CSV with a column containing LinkedIn profile URLs</p>
                <BulkUpload goalData={{ ...goalData, senderRole: goalData.senderRole ?? "", senderCompany: goalData.senderCompany ?? "" }} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
