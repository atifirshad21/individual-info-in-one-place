import { getProfileByNormalizedUrl, getCachedSource as dbGetCachedSource } from "@/lib/db/queries";

export async function getCachedProfile(normalizedUrl: string) {
  const profile = await getProfileByNormalizedUrl(normalizedUrl);
  if (!profile) return null;
  if (profile.expires_at && new Date(profile.expires_at) < new Date()) return null;
  return profile;
}

export async function getCachedSourceData(profileId: string, sourceType: string) {
  return dbGetCachedSource(profileId, sourceType);
}

export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}

export function getTTLDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
