import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getSourceStatuses } from "@/lib/db/queries";
import { errorResponse, AuthError } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError();

    const profileId = req.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return Response.json({ error: "profileId required" }, { status: 400 });
    }

    const statuses = await getSourceStatuses(profileId);

    const ACTIVE_SOURCES = ["linkedin", "perplexity"];
    const activeStatuses = statuses.filter((s: { source_type: string }) => ACTIVE_SOURCES.includes(s.source_type));
    const allDone = activeStatuses.length > 0 && activeStatuses.every(
      (s: { status: string }) =>
        s.status === "complete" || s.status === "failed" || s.status === "skipped"
    );

    return Response.json({ profileId, statuses, allDone });
  } catch (error) {
    return errorResponse(error);
  }
}
