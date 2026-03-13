import { getDailyUsage, recordUsage as dbRecordUsage } from "@/lib/db/queries";

const LIMITS = {
  profile_lookup: { daily: 5, label: "profile lookups" },
  email_generation: { daily: 15, label: "email generations" },
  regeneration: { daily: 30, label: "email regenerations" },
} as const;

export type ActionType = keyof typeof LIMITS;

export async function checkRateLimit(
  userId: string,
  action: ActionType
): Promise<{ allowed: boolean; remaining: number; limit: number; resetAt: Date }> {
  const used = await getDailyUsage(userId, action);
  const limit = LIMITS[action].daily;
  const resetAt = new Date();
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    resetAt,
  };
}

export async function recordUsage(
  userId: string,
  action: ActionType,
  metadata?: Record<string, unknown>
) {
  await dbRecordUsage(userId, action, metadata);
}
