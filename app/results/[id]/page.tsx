import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getProfileById } from "@/lib/db/queries";
import Header from "@/components/Header";
import ResultsClient from "@/components/ResultsClient";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  let profile;
  try {
    profile = await getProfileById(id);
  } catch {
    notFound();
  }

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header userEmail={user.email} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ResultsClient profileId={id} initialProfile={profile} />
      </main>
    </div>
  );
}
