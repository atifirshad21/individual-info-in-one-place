import { createSupabaseAdmin } from "./supabase-server";

// ===== PROFILES =====

export async function getProfileByNormalizedUrl(normalizedUrl: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("normalized_url", normalizedUrl)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getProfileById(id: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(`*, data_sources (*), insights (*), source_status (*)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProfile(
  linkedinUrl: string,
  normalizedUrl: string
) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ linkedin_url: linkedinUrl, normalized_url: normalizedUrl })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  updates: Record<string, unknown>
) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ===== DATA SOURCES =====

export async function getCachedSource(profileId: string, sourceType: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("data_sources")
    .select("*")
    .eq("profile_id", profileId)
    .eq("source_type", sourceType)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertDataSource(
  profileId: string,
  sourceType: string,
  rawData: unknown,
  ttlDays: number
) {
  const supabase = createSupabaseAdmin();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const { error } = await supabase.from("data_sources").upsert(
    {
      profile_id: profileId,
      source_type: sourceType,
      raw_data: rawData,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "profile_id,source_type" }
  );
  if (error) throw error;
}

// ===== SOURCE STATUS =====

export async function updateSourceStatus(
  profileId: string,
  sourceType: string,
  status: string,
  errorMessage?: string
) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("source_status").upsert(
    {
      profile_id: profileId,
      source_type: sourceType,
      status,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,source_type" }
  );
  if (error) throw error;
}

export async function getSourceStatuses(profileId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("source_status")
    .select("*")
    .eq("profile_id", profileId);
  if (error) throw error;
  return data || [];
}

// ===== EMAIL GENERATIONS =====

export async function saveEmailGeneration(params: {
  profileId: string;
  userId: string;
  outreachGoal: string;
  context?: string;
  senderInfo?: Record<string, unknown>;
  drafts: unknown;
  tone?: string;
}) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("email_generations")
    .insert({
      profile_id: params.profileId,
      user_id: params.userId,
      outreach_goal: params.outreachGoal,
      context: params.context,
      sender_info: params.senderInfo,
      drafts: params.drafts,
      tone: params.tone || "professional",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

// ===== USAGE TRACKING =====

export async function getDailyUsage(userId: string, actionType: string) {
  const supabase = createSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];
  const { count, error } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .gte("created_at", `${today}T00:00:00Z`);
  if (error) throw error;
  return count ?? 0;
}

export async function recordUsage(
  userId: string,
  actionType: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("usage_tracking").insert({
    user_id: userId,
    action_type: actionType,
    metadata,
  });
  if (error) throw error;
}
