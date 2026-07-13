import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVENT_TYPES = ["view", "cta_click", "whatsapp_click", "social_click", "form_submit"] as const;
export type SiteEventType = (typeof EVENT_TYPES)[number];

const trackInput = z.object({
  site_id: z.string().uuid(),
  event_type: z.enum(EVENT_TYPES),
  meta: z.record(z.string(), z.any()).optional(),
});

// Public — no auth. RLS restringe a sites publicados.
export const trackSiteEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => trackInput.parse(i))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    // Rate limit por site para evitar spam (300/h — muito acima do tráfego normal).
    const { enforceRateLimit } = await import("./security.server");
    try {
      await enforceRateLimit(data.site_id, `site_event_${data.event_type}`, 300);
    } catch {
      return { ok: false as const };
    }
    const { error } = await sb.from("site_events").insert({
      site_id: data.site_id,
      event_type: data.event_type,
      meta: (data.meta ?? {}) as never,
    });
    if (error) {
      console.error("[trackSiteEvent]", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

const analyticsInput = z.object({
  site_id: z.string().uuid(),
  days: z.number().int().min(1).max(90).optional(),
});

export type SiteAnalytics = {
  totals: Record<SiteEventType, number>;
  series: Array<{ date: string } & Record<SiteEventType, number>>;
  days: number;
};

export const getSiteAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => analyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<SiteAnalytics> => {
    const days = data.days ?? 30;
    // Confere ownership (RLS já filtraria, mas evita query desnecessária).
    const { data: site, error: siteErr } = await context.supabase
      .from("sites").select("id").eq("id", data.site_id).maybeSingle();
    if (siteErr) throw new Error(siteErr.message);
    if (!site) throw new Error("Site não encontrado");

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("site_events")
      .select("event_type, created_at")
      .eq("site_id", data.site_id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const emptyCounts = (): Record<SiteEventType, number> => ({
      view: 0, cta_click: 0, whatsapp_click: 0, social_click: 0, form_submit: 0,
    });

    const totals = emptyCounts();
    const byDay = new Map<string, Record<SiteEventType, number>>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      byDay.set(d, emptyCounts());
    }

    for (const r of rows ?? []) {
      const t = r.event_type as SiteEventType;
      if (!(t in totals)) continue;
      totals[t] += 1;
      const day = (r.created_at as string).slice(0, 10);
      const bucket = byDay.get(day);
      if (bucket) bucket[t] += 1;
    }

    const series = Array.from(byDay.entries()).map(([date, counts]) => ({ date, ...counts }));
    return { totals, series, days };
  });
