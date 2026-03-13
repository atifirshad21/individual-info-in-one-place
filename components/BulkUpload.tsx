"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, XCircle, ExternalLink, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface BulkRow {
  name: string;
  linkedinUrl: string;
  status: "pending" | "processing" | "done" | "failed";
  profileId?: string;
  error?: string;
}

interface BulkUploadProps {
  goalData: {
    goal: string;
    context: string;
    senderRole?: string;
    senderCompany?: string;
    relationship: string;
    tone: string;
  };
}

function extractLinkedInUrl(cell: unknown): string | null {
  if (!cell) return null;
  const s = String(cell).trim();
  const match = s.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/);
  return match ? match[0] : null;
}

function parseSheet(data: unknown[][]): BulkRow[] {
  if (!data.length) return [];

  const headers = data[0].map((h) => String(h ?? "").toLowerCase().trim());
  const urlCol = headers.findIndex((h) => h.includes("linkedin") || h.includes("url") || h.includes("profile"));
  const nameCol = headers.findIndex((h) => h.includes("name") || h.includes("first") || h.includes("person"));

  const rows: BulkRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let url: string | null = null;

    // Try the detected URL column first
    if (urlCol !== -1) url = extractLinkedInUrl(row[urlCol]);

    // Fallback: scan all cells for a LinkedIn URL
    if (!url) {
      for (const cell of row) {
        url = extractLinkedInUrl(cell);
        if (url) break;
      }
    }

    if (!url) continue;

    const name =
      nameCol !== -1 && row[nameCol]
        ? String(row[nameCol]).trim()
        : url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");

    rows.push({ name, linkedinUrl: url, status: "pending" });
  }

  return rows;
}

export default function BulkUpload({ goalData }: BulkUploadProps) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [running, setRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
        const parsed = parseSheet(data as unknown[][]);
        if (parsed.length === 0) {
          toast.error("No LinkedIn URLs found. Make sure a column contains linkedin.com/in/ links.");
        } else {
          setRows(parsed);
        }
      } catch {
        toast.error("Failed to parse file. Please use .xlsx or .csv format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function runBulk() {
    if (!goalData.context || goalData.context.length < 10) {
      toast.error("Add at least 10 characters of context in the form above before running bulk.");
      return;
    }

    setRunning(true);

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === "done") continue;

      setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "processing" } : r));

      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl: rows[i].linkedinUrl }),
        });

        const data = await res.json();

        if (!res.ok) {
          setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "failed", error: data.error || "Failed" } : r));
        } else {
          sessionStorage.setItem(`goal_${data.profileId}`, JSON.stringify(goalData));
          setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "done", profileId: data.profileId } : r));
        }
      } catch {
        setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "failed", error: "Network error" } : r));
      }
    }

    setRunning(false);
    toast.success("Bulk research complete!");
  }

  function clearFile() {
    setRows([]);
    setRunning(false);
  }

  const doneCount = rows.filter((r) => r.status === "done").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          <FileSpreadsheet className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Drop an Excel or CSV file here</p>
          <p className="text-xs text-zinc-400 mt-1">Must have a column with LinkedIn profile URLs</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{rows.length} profiles loaded</span>
                {running && <Badge variant="secondary" className="text-xs"><Loader2 className="h-3 w-3 animate-spin mr-1" />Running</Badge>}
                {!running && doneCount > 0 && <Badge className="text-xs">{doneCount} done</Badge>}
                {failedCount > 0 && <Badge variant="destructive" className="text-xs">{failedCount} failed</Badge>}
              </div>
              {!running && (
                <button onClick={clearFile} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="shrink-0">
                    {row.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-zinc-300" />}
                    {row.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {row.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {row.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <span className="text-sm flex-1 truncate">{row.name}</span>
                  <span className="text-xs text-zinc-400 truncate max-w-32 hidden sm:block">
                    {row.linkedinUrl.replace("https://www.linkedin.com/in/", "")}
                  </span>
                  {row.status === "done" && row.profileId && (
                    <a href={`/results/${row.profileId}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500 hover:text-blue-600">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {row.status === "failed" && row.error && (
                    <span className="text-xs text-red-400 shrink-0">{row.error}</span>
                  )}
                </div>
              ))}
            </div>

            {!running && rows.some((r) => r.status !== "done") && (
              <Button onClick={runBulk} className="w-full mt-3 gap-2" disabled={running}>
                <Upload className="h-4 w-4" />
                {doneCount > 0 ? "Resume Research" : "Start Bulk Research"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
