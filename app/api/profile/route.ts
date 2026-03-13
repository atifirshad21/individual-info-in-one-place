import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  createProfile,
  getProfileByNormalizedUrl,
  updateProfile,
  upsertDataSource,
  updateSourceStatus,
} from "@/lib/db/queries";
import { linkedInUrlSchema, normalizeLinkedInUrl } from "@/lib/utils/validators";
import { checkRateLimit, recordUsage } from "@/lib/utils/rate-limiter";
import { LinkedInProvider } from "@/lib/providers/linkedin";
import { errorResponse, AuthError, RateLimitError, ValidationError } from "@/lib/utils/errors";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError();

    // 2. Validate input
    const body = await req.json();
    const urlResult = linkedInUrlSchema.safeParse(body.linkedinUrl);
    if (!urlResult.success) {
      throw new ValidationError(urlResult.error.issues[0].message);
    }

    // 3. Rate limit check
    const rateCheck = await checkRateLimit(user.id, "profile_lookup");
    if (!rateCheck.allowed) {
      throw new RateLimitError(rateCheck.remaining, rateCheck.resetAt);
    }

    // 4. Check cache
    const normalizedUrl = normalizeLinkedInUrl(urlResult.data);
    const existingProfile = await getProfileByNormalizedUrl(normalizedUrl);

    if (existingProfile?.synthesis) {
      return Response.json({ profileId: existingProfile.id, cached: true, name: existingProfile.name });
    }

    // 5. Create or reuse profile record
    let profileId: string;
    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      const newProfile = await createProfile(urlResult.data, normalizedUrl);
      profileId = newProfile.id;
    }

    // 6. Initialize source statuses
    const sourceTypes = ["linkedin", "perplexity"];
    await Promise.all(sourceTypes.map((s) => updateSourceStatus(profileId, s, "pending")));

    // 7. Fetch LinkedIn data (primary source)
    await updateSourceStatus(profileId, "linkedin", "fetching");
    const linkedinProvider = new LinkedInProvider();
    const linkedinResult = await linkedinProvider.fetch(urlResult.data);

    if (!linkedinResult.success || !linkedinResult.data) {
      await updateSourceStatus(profileId, "linkedin", "failed", linkedinResult.error);
      return Response.json(
        { profileId, error: "Failed to fetch LinkedIn data", detail: linkedinResult.error },
        { status: 502 }
      );
    }

    // 8. Store LinkedIn data
    await upsertDataSource(profileId, "linkedin", linkedinResult.data, 30);
    await updateSourceStatus(profileId, "linkedin", "complete");

    const ld = linkedinResult.data;
    await updateProfile(profileId, {
      name: ld.name,
      current_role_title: ld.currentRole?.title || null,
      headline: ld.headline,
      summary: ld.summary,
      location: ld.location,
      profile_image_url: ld.profileImageUrl,
      industry: ld.industry,
      connection_count: ld.connectionCount,
      cached_linkedin_data: ld,
    });

    // 9. Record usage
    await recordUsage(user.id, "profile_lookup", { profileId });

    return Response.json({ profileId, cached: false, name: ld.name });
  } catch (error) {
    return errorResponse(error);
  }
}
