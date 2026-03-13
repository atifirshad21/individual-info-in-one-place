import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getProfileById, saveEmailGeneration } from "@/lib/db/queries";
import { checkRateLimit, recordUsage } from "@/lib/utils/rate-limiter";
import { generatePersonalizationHooks } from "@/lib/ai/synthesize";
import { generateEmails } from "@/lib/ai/email-generator";
import { outreachGoalSchema } from "@/lib/utils/validators";
import { errorResponse, AuthError, RateLimitError, ValidationError } from "@/lib/utils/errors";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError();

    const body = await req.json();
    const { profileId, ...goalData } = body;

    if (!profileId) throw new ValidationError("profileId is required");

    const goalResult = outreachGoalSchema.safeParse(goalData);
    if (!goalResult.success) {
      throw new ValidationError(goalResult.error.issues[0].message);
    }

    // Rate limit
    const rateCheck = await checkRateLimit(user.id, "email_generation");
    if (!rateCheck.allowed) {
      throw new RateLimitError(rateCheck.remaining, rateCheck.resetAt);
    }

    // Get profile with synthesis
    const profile = await getProfileById(profileId);
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const synthesis = profile.synthesis as Record<string, unknown> | null;
    if (!synthesis) {
      return Response.json({ error: "Profile not yet synthesized. Run synthesis first." }, { status: 400 });
    }

    const goal = goalResult.data;
    const senderContext = {
      role: goal.senderRole,
      company: goal.senderCompany,
      relationship: goal.relationship,
    };

    // Phase 3: Generate personalization hooks (Sonnet)
    const hooksResult = await generatePersonalizationHooks({
      profileSummary: synthesis.extractions,
      crossRefInsights: synthesis.crossReference,
      outreachGoal: `${goal.goal}: ${goal.context}`,
      senderContext,
    });

    // Phase 4: Generate emails (Sonnet)
    const emailsResult = await generateEmails({
      hooks: hooksResult.hooks,
      outreachGoal: `${goal.goal}: ${goal.context}`,
      senderContext,
      tone: goal.tone,
      profileName: (profile.name as string) || "the recipient",
      profileSummary: synthesis.extractions,
    });

    // Save to database
    await saveEmailGeneration({
      profileId,
      userId: user.id,
      outreachGoal: `${goal.goal}: ${goal.context}`,
      context: goal.context,
      senderInfo: senderContext,
      drafts: emailsResult.drafts,
      tone: goal.tone,
    });

    await recordUsage(user.id, "email_generation", { profileId });

    return Response.json({ hooks: hooksResult.hooks, drafts: emailsResult.drafts });
  } catch (error) {
    return errorResponse(error);
  }
}
