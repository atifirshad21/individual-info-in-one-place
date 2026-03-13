import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getProfileById } from "@/lib/db/queries";
import { checkRateLimit, recordUsage } from "@/lib/utils/rate-limiter";
import { regenerateEmail } from "@/lib/ai/email-generator";
import { errorResponse, AuthError, RateLimitError, ValidationError } from "@/lib/utils/errors";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError();

    const body = await req.json();
    const { profileId, originalDraft, hooks, newTone, feedback, outreachGoal } = body;

    if (!profileId || !originalDraft || !newTone) {
      throw new ValidationError("profileId, originalDraft, and newTone are required");
    }

    // Rate limit
    const rateCheck = await checkRateLimit(user.id, "regeneration");
    if (!rateCheck.allowed) {
      throw new RateLimitError(rateCheck.remaining, rateCheck.resetAt);
    }

    const profile = await getProfileById(profileId);
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const result = await regenerateEmail({
      originalDraft,
      hooks: hooks || [],
      newTone,
      feedback,
      profileName: (profile.name as string) || "the recipient",
      outreachGoal: outreachGoal || "",
    });

    await recordUsage(user.id, "regeneration", { profileId, tone: newTone });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
