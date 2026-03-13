import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  getProfileById,
  getCachedSource,
  upsertDataSource,
  updateSourceStatus,
} from "@/lib/db/queries";
import { buildNormalizedProfile } from "@/lib/providers/types";
import { PerplexityProvider } from "@/lib/providers/perplexity";
import { errorResponse, AuthError } from "@/lib/utils/errors";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError();

    const { profileId } = await req.json();
    if (!profileId) {
      return Response.json({ error: "profileId required" }, { status: 400 });
    }

    const profile = await getProfileById(profileId);
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const normalizedProfile = buildNormalizedProfile(
      (profile.cached_linkedin_data as Record<string, unknown>) || {}
    );

    const provider = new PerplexityProvider();
    const source = provider.source;

    // Check cache first
    const cached = await getCachedSource(profileId, source);
    if (cached) {
      await updateSourceStatus(profileId, source, "complete");
      return Response.json({
        profileId,
        sources: [{ source, status: "complete", cached: true }],
      });
    }

    await updateSourceStatus(profileId, source, "fetching");

    const result = await provider.fetch(normalizedProfile);

    if (result.success && result.data) {
      await upsertDataSource(profileId, source, result.data, result.ttlDays);
      await updateSourceStatus(profileId, source, "complete");
      return Response.json({
        profileId,
        sources: [{ source, status: "complete", cached: false }],
      });
    } else {
      await updateSourceStatus(profileId, source, "failed", result.error);
      return Response.json({
        profileId,
        sources: [{ source, status: "failed", error: result.error }],
      });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
