import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const searchInput = z.object({
  category: z.string().min(1).max(120),
  categorySlug: z.string().min(1).max(120).optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(80).default("Brasil"),
  limit: z.number().int().min(1).max(60).default(20),
});

const PLAN_RANK: Record<string, number> = { gratuito: 1, starter: 2, pro: 3, business: 4 };

async function loadPlanAndUsage(supabase: any, userId: string) {
  const period = new Date().toISOString().slice(0, 7);
  const [subRes, usageRes] = await Promise.all([
    supabase.from("subscriptions").select("plan_id").eq("user_id", userId).maybeSingle(),
    supabase.from("usage_counters").select("*").eq("user_id", userId).eq("period", period).maybeSingle(),
  ]);
  const planId = subRes.data?.plan_id ?? "gratuito";
  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).maybeSingle();
  return { plan, usage: usageRes.data ?? { searches: 0, saved_leads: 0 }, period };
}

export type PlaceResult = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  category: string;
  has_website: boolean;
};

export const searchPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => searchInput.parse(i))
  .handler(async ({ data, context }): Promise<{ results: PlaceResult[] }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !mapsKey) throw new Error("Google Maps não configurado");

    const { enforceRateLimit } = await import("./security.server");
    await enforceRateLimit(context.userId, "search_places", 60);



    const { plan, usage } = await loadPlanAndUsage(context.supabase, context.userId);
    if (!plan) throw new Error("Plano não encontrado");
    if (plan.monthly_searches !== -1 && (usage.searches ?? 0) >= plan.monthly_searches) {
      throw new Error(`Limite mensal de ${plan.monthly_searches} buscas atingido no plano ${plan.name}.`);
    }
    if (data.categorySlug) {
      const { data: cat } = await context.supabase.from("categories").select("min_plan, label").eq("slug", data.categorySlug).maybeSingle();
      if (cat && (PLAN_RANK[cat.min_plan] ?? 1) > (PLAN_RANK[plan.id] ?? 1)) {
        throw new Error(`Categoria "${cat.label}" indisponível no plano ${plan.name}.`);
      }
    }

    const textQuery = `${data.category} em ${data.city}, ${data.state}, ${data.country}`;
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.addressComponents",
      "places.primaryTypeDisplayName",
      "nextPageToken",
    ].join(",");

    const results: PlaceResult[] = [];
    let pageToken: string | undefined;
    let guard = 0;
    while (results.length < data.limit && guard < 4) {
      guard++;
      const body: Record<string, unknown> = {
        textQuery,
        languageCode: "pt-BR",
        regionCode: "BR",
        pageSize: Math.min(20, data.limit - results.length),
      };
      if (pageToken) body.pageToken = pageToken;

      const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[places] search failed", res.status, t);
        throw new Error(`Places API ${res.status}: ${t.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          nationalPhoneNumber?: string;
          internationalPhoneNumber?: string;
          websiteUri?: string;
          rating?: number;
          userRatingCount?: number;
          addressComponents?: Array<{ types: string[]; longText: string; shortText: string }>;
          primaryTypeDisplayName?: { text?: string };
        }>;
        nextPageToken?: string;
      };

      for (const p of json.places ?? []) {
        const comps = p.addressComponents ?? [];
        const findComp = (t: string) => comps.find((c) => c.types.includes(t));
        results.push({
          place_id: p.id,
          name: p.displayName?.text ?? "—",
          address: p.formattedAddress ?? null,
          phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
          website: p.websiteUri ?? null,
          has_website: Boolean(p.websiteUri),
          rating: p.rating ?? null,
          reviews_count: p.userRatingCount ?? null,
          city: findComp("administrative_area_level_2")?.longText ?? findComp("locality")?.longText ?? data.city,
          state: findComp("administrative_area_level_1")?.shortText ?? data.state,
          country: findComp("country")?.longText ?? data.country,
          category: p.primaryTypeDisplayName?.text ?? data.category,
        });
        if (results.length >= data.limit) break;
      }
      pageToken = json.nextPageToken;
      if (!pageToken) break;
      // Google requires a short delay before nextPageToken is usable
      await new Promise((r) => setTimeout(r, 1500));
    }

    await context.supabase.rpc("increment_usage", { _user_id: context.userId, _searches: 1, _saved: 0 });
    return { results };
  });

const saveInput = z.object({
  places: z.array(
    z.object({
      name: z.string(),
      address: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      has_website: z.boolean(),
      rating: z.number().nullable().optional(),
      reviews_count: z.number().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
    }),
  ).min(1).max(60),
});

export const savePlacesAsLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => saveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit } = await import("./security.server");
    await enforceRateLimit(context.userId, "save_leads", 30);
    const { plan, usage } = await loadPlanAndUsage(context.supabase, context.userId);
    if (!plan) throw new Error("Plano não encontrado");
    if (plan.monthly_saved_leads !== -1 && (usage.saved_leads ?? 0) + data.places.length > plan.monthly_saved_leads) {
      const restante = Math.max(0, plan.monthly_saved_leads - (usage.saved_leads ?? 0));
      throw new Error(`Limite mensal de ${plan.monthly_saved_leads} leads atingido. Restam ${restante} no plano ${plan.name}.`);
    }
    const rows = data.places.map((p) => ({
      user_id: context.userId,
      name: p.name,
      category: p.category ?? null,
      country: p.country ?? "Brasil",
      state: p.state ?? null,
      city: p.city ?? null,
      address: p.address ?? null,
      phone: p.phone ?? null,
      website: p.website ?? null,
      has_website: p.has_website,
      rating: p.rating ?? null,
      reviews_count: p.reviews_count ?? null,
      tier: (p.has_website ? "morno" : "quente") as "frio" | "morno" | "quente",
      status: "base" as const,
      source: "google_places",
      score: p.has_website ? 40 : 70,
    }));
    const { error, count } = await context.supabase.from("leads").insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    const inserted = count ?? rows.length;
    await context.supabase.rpc("increment_usage", { _user_id: context.userId, _searches: 0, _saved: inserted });
    return { inserted };
  });
