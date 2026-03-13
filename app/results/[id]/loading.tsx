import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";

export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton />
      </main>
    </div>
  );
}
