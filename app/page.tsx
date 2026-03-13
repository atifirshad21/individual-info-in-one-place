import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import Header from "@/components/Header";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header userEmail={user.email} />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            LinkedIn Intel
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Research any professional. Generate personalized outreach.
          </p>
        </div>
        <HomeClient />
      </main>
    </div>
  );
}
