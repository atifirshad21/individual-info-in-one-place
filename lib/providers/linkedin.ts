import type { DataProvider, ProviderResult } from "./types";
import type { LinkedInProfileData, WorkExperience, Education } from "./linkedin.types";

export class LinkedInProvider implements DataProvider<string, LinkedInProfileData> {
  source = "linkedin" as const;

  async fetch(linkedinUrl: string): Promise<ProviderResult<LinkedInProfileData>> {
    try {
      const apiToken = process.env.BRIGHTDATA_API_TOKEN;
      const datasetId = process.env.BRIGHTDATA_DATASET_ID;

      if (!apiToken || !datasetId) {
        return { success: false, data: null, error: "Bright Data credentials not configured", source: this.source, fetchedAt: new Date(), ttlDays: 0 };
      }

      // Trigger Bright Data scrape
      const triggerResponse = await fetch(
        `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify([{ url: linkedinUrl }]),
        }
      );

      if (!triggerResponse.ok) {
        const errorText = await triggerResponse.text();
        console.error("[LinkedIn] Bright Data trigger failed:", triggerResponse.status, errorText);
        return { success: false, data: null, error: `Bright Data trigger failed: ${errorText}`, source: this.source, fetchedAt: new Date(), ttlDays: 0 };
      }
      console.log("[LinkedIn] Bright Data trigger success:", triggerResponse.status);

      const triggerResult = await triggerResponse.json();
      const snapshotId = triggerResult.snapshot_id;
      if (!snapshotId) {
        return { success: false, data: null, error: "No snapshot ID returned", source: this.source, fetchedAt: new Date(), ttlDays: 0 };
      }

      // Poll for results (max 60 seconds)
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );

        if (statusResponse.status === 200) {
          const results = await statusResponse.json();
          if (Array.isArray(results) && results.length > 0) {
            const normalized = this.normalizeData(results[0], linkedinUrl);
            return { success: true, data: normalized, source: this.source, fetchedAt: new Date(), ttlDays: this.getTTLDays() };
          }
        }
        if (statusResponse.status !== 202) break;
      }

      return { success: false, data: null, error: "Bright Data scrape timed out", source: this.source, fetchedAt: new Date(), ttlDays: 0 };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : "Unknown error", source: this.source, fetchedAt: new Date(), ttlDays: 0 };
    }
  }

  private normalizeData(raw: Record<string, unknown>, linkedinUrl: string): LinkedInProfileData {
    const experience = (raw.experience as Array<Record<string, unknown>>) || [];
    const education = (raw.education as Array<Record<string, unknown>>) || [];

    const workHistory: WorkExperience[] = experience.map((exp) => ({
      title: (exp.title as string) || "",
      company: (exp.company as string) || (exp.company_name as string) || "",
      companyLinkedInUrl: exp.company_linkedin_url as string | undefined,
      location: exp.location as string | undefined,
      startDate: (exp.start_date as string) || "",
      endDate: exp.end_date as string | undefined,
      description: exp.description as string | undefined,
      isCurrent: !exp.end_date,
    }));

    const educationList: Education[] = education.map((edu) => ({
      school: (edu.school as string) || (edu.institution_name as string) || "",
      degree: edu.degree as string | undefined,
      fieldOfStudy: (edu.field_of_study as string) || (edu.field as string) || undefined,
      startDate: edu.start_date as string | undefined,
      endDate: edu.end_date as string | undefined,
      description: edu.description as string | undefined,
    }));

    return {
      name: (raw.name as string) || (raw.full_name as string) || "",
      headline: (raw.headline as string) || "",
      summary: (raw.summary as string) || (raw.about as string) || "",
      location: (raw.location as string) || (raw.city as string) || "",
      profileImageUrl: (raw.profile_image_url as string) || (raw.avatar as string) || "",
      connectionCount: (raw.connections_count as number) || (raw.followers_count as number) || 0,
      industry: (raw.industry as string) || "",
      currentRole: workHistory.find((w) => w.isCurrent) || workHistory[0] || null,
      workHistory,
      education: educationList,
      skills: ((raw.skills as string[]) || []).slice(0, 30),
      certifications: ((raw.certifications as Array<Record<string, unknown>>) || []).map((c) => ({
        name: (c.name as string) || "",
        authority: c.authority as string | undefined,
        startDate: c.start_date as string | undefined,
        url: c.url as string | undefined,
      })),
      languages: (raw.languages as string[]) || [],
      volunteerExperience: ((raw.volunteer_experience as Array<Record<string, unknown>>) || []).map((v) => ({
        role: (v.role as string) || (v.title as string) || "",
        organization: (v.organization as string) || (v.company as string) || "",
        cause: v.cause as string | undefined,
        startDate: v.start_date as string | undefined,
        endDate: v.end_date as string | undefined,
        description: v.description as string | undefined,
      })),
      recommendations: (raw.recommendations_count as number) || 0,
      linkedinUrl,
    };
  }

  shouldFetch(): boolean { return true; }
  getTTLDays(): number { return 30; }
}
