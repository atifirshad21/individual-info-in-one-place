"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { Button } from "@/components/ui/button";
import { LogOut, Search } from "lucide-react";

export default function Header({ userEmail }: { userEmail?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
        >
          <Search className="h-5 w-5" />
          LinkedIn Intel
        </button>
        {userEmail && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 hidden sm:inline">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
