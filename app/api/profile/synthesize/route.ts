import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getProfileById, updateProfile } from "@/lib/db/queries";
import { extractFromAllSources } from "@/lib/ai/extract";
import { crossReferenceInsights } from "@/lib/ai/synthesize";
import { errorResponse, AuthError } from "@/lib/utils/errors";

export const maxDuration = 60;

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

    // If synthesis already exists, return it
    if (profile.synthesis) {
      return Response.json({ profileId, synthesis: profile.synthesis, cached: true });
    }

    // Gather all source data
    const sourcesData: Record<string, unknown> = {};
    if (profile.cached_linkedin_data) {
      sourcesData.linkedin = profile.cached_linkedin_data;
    }
    if (profile.data_sources) {
      for (const source of profile.data_sources as Array<{ source_type: string; raw_data: unknown }>) {
        sourcesData[source.source_type] = source.raw_data;
      }
    }

    // Phase 1: Extract structured data from each source (Haiku, parallel)
    const extractions = await extractFromAllSources(sourcesData);

    // Phase 2: Cross-reference insights (Haiku)
    const profileName = (profile.name as string) || "Unknown";
    const crossRef = await crossReferenceInsights(extractions, profileName);

    // Store synthesis
    const synthesis = {
      extractions,
      crossReference: crossRef,
      generatedAt: new Date().toISOString(),
    };

    await updateProfile(profileId, {
      synthesis,
      synthesis_version: ((profile.synthesis_version as number) || 0) + 1,
    });

    return Response.json({ profileId, synthesis, cached: false });
  } catch (error) {
    return errorResponse(error);
  }
}
